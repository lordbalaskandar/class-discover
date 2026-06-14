import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PulstractMark } from "@/components/brand/PulstractLogo";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "Coming Soon — Pulstract" },
      { name: "description", content: "The Pulstract mobile app is coming soon to the App Store and Google Play." },
    ],
  }),
  component: ComingSoonPage,
});

const ACTIVITIES = [
  "Pickleball", "Boxing", "Yoga", "Pilates", "Tennis", "HIIT", "Climbing",
  "Spin", "Running", "Swimming", "Crossfit", "Barre", "Surfing", "Dance",
  "Karate", "Judo", "Golf", "Cycling", "Basketball", "Soccer", "Skating",
  "Rowing", "Kickboxing", "Muay Thai", "Squash", "Badminton", "Volleyball",
  "Padel", "Fencing", "Archery", "Hiking", "Bouldering", "Sailing", "Rugby",
  "Capoeira", "Zumba", "Stretch", "Mobility", "Sprint", "Lift", "Strength",
  "Cardio", "Aerial", "Polo", "Cricket", "Baseball", "Hockey", "Lacrosse",
];

const COLS = 6;
const ROWS = 8;
const CELLS = COLS * ROWS;

function pickWords(count: number) {
  const shuffled = [...ACTIVITIES].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

function AppStoreBadge() {
  return (
    <a
      href="#"
      aria-label="Coming soon to the App Store"
      className="inline-flex items-center gap-3 rounded-xl bg-white text-black px-5 py-3 shadow-elegant hover:opacity-90 transition-opacity min-w-[180px]"
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.42 2.23-1.12 3.04-.79.93-2.05 1.65-3.07 1.56-.14-1.13.42-2.3 1.1-3.07.78-.9 2.13-1.6 3.09-1.53zM20.5 17.27c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.06-1.79-4.05-3.36C-.18 16.92-.4 11.84 2.27 9.36c1.3-1.2 3.05-1.96 4.86-1.99 1.58-.03 3.08 1.06 4.03 1.06.94 0 2.74-1.31 4.62-1.12.79.03 3.01.32 4.43 2.41-.11.07-2.65 1.55-2.62 4.62.03 3.67 3.21 4.89 3.25 4.91z"/>
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-70">Coming soon to the</span>
        <span className="text-lg font-semibold -mt-0.5">App Store</span>
      </div>
    </a>
  );
}

function GooglePlayBadge() {
  return (
    <a
      href="#"
      aria-label="Coming soon to Google Play"
      className="inline-flex items-center gap-3 rounded-xl bg-white text-black px-5 py-3 shadow-elegant hover:opacity-90 transition-opacity min-w-[180px]"
    >
      <svg viewBox="0 0 512 512" className="h-8 w-8" aria-hidden="true">
        <path fill="#00D7FE" d="M53.3 32.5C42.4 38.6 36 49.9 36 64.5v383c0 14.5 6.4 25.9 17.3 32l217-207.5-217-239.5z"/>
        <path fill="#FFBC00" d="M363 154.6L290.6 196 270 217l99.4 95 73.4-41.9c19.4-11.1 19.4-39.5 0-50.7L363 154.6z"/>
        <path fill="#FF3A44" d="M270 217L53.3 32.5c4-2.3 8.6-3.5 13.7-3.5 6.7 0 13.9 1.9 21 5.9L363 154.6 270 217z"/>
        <path fill="#00F076" d="M270 295l99.4-83-99.4-95L53.3 479.5c4 2.3 8.6 3.5 13.7 3.5 6.7 0 13.9-1.9 21-5.9L363 357.4 270 295z"/>
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-70">Coming soon on</span>
        <span className="text-lg font-semibold -mt-0.5">Google Play</span>
      </div>
    </a>
  );
}

function ComingSoonPage() {
  const words = useMemo(() => pickWords(CELLS), []);

  // Mask the center so the background never competes with the hero content.
  const centerMask =
    "radial-gradient(ellipse 520px 360px at center, transparent 0%, transparent 40%, black 75%)";

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {/* Checkerboard background: strict logo / word / logo / word pattern.
          Each cell crossfades between its logo and its word. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          WebkitMaskImage: centerMask,
          maskImage: centerMask,
        }}
        aria-hidden="true"
      >
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          }}
        >
          {words.map((word, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            // Strict checkerboard: even cells start as logo, odd cells start as word.
            // All cells share the same timing so the entire board flips in unison —
            // logos become words, words become logos, with a clean crossfade.
            const startsWithLogo = (row + col) % 2 === 0;
            const logoAnim = `cellSwap 5s ease-in-out 0s infinite ${startsWithLogo ? "normal" : "reverse"}`;
            const wordAnim = `cellSwap 5s ease-in-out 0s infinite ${startsWithLogo ? "reverse" : "normal"}`;
            return (
              <div
                key={i}
                className="relative flex items-center justify-center overflow-hidden"
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ animation: logoAnim }}
                >
                  <PulstractMark
                    className="h-7 w-14 md:h-9 md:w-[72px] opacity-[0.32]"
                    gold="hsl(43 55% 54%)"
                    light="white"
                  />
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center px-1"
                  style={{ animation: wordAnim }}
                >
                  <span className="font-display text-[11px] md:text-sm font-semibold tracking-[0.18em] uppercase text-white/[0.32] whitespace-nowrap">
                    {word}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crossfade: long hold on each state, quick swap between them. */}
      <style>{`
        @keyframes cellSwap {
          0%, 45%   { opacity: 1; }
          55%, 100% { opacity: 0; }
        }
      `}</style>


      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center relative z-10">
        <div className="flex flex-col items-center">
          <PulstractMark className="h-20 w-40 md:h-24 md:w-48" gold="hsl(43 55% 54%)" light="white" />
          <span className="mt-4 font-sans font-light text-base md:text-lg tracking-[0.4em] uppercase text-white">
            puls<span className="text-primary">t</span>ract
          </span>

          <h1 className="mt-10 font-display text-5xl md:text-7xl font-semibold tracking-tight text-white">
            Coming <span className="text-primary">soon</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/60 text-base md:text-lg">
            Book classes and trainers near you — pilates, boxing, pickleball, yoga and more.
            The Pulstract mobile app lands on iOS and Android shortly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <AppStoreBadge />
            <GooglePlayBadge />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/40 relative z-10">
        © {new Date().getFullYear()} Pulstract · Move together
      </footer>
    </div>
  );
}
