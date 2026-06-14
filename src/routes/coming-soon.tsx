import { createFileRoute } from "@tanstack/react-router";
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
  { label: "Pickleball", src: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=70" },
  { label: "Boxing", src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=70" },
  { label: "Yoga", src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=70" },
  { label: "Pilates", src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=70" },
  { label: "Tennis", src: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=70" },
  { label: "HIIT", src: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=70" },
  { label: "Rock Climbing", src: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=70" },
  { label: "Spin", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=70" },
  { label: "Running", src: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=70" },
  { label: "Swimming", src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=70" },
  { label: "Crossfit", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=70" },
  { label: "Barre", src: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=70" },
  { label: "Surfing", src: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=70" },
  { label: "Dance", src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=70" },
  { label: "Martial Arts", src: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=900&q=70" },
  { label: "Golf", src: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=70" },
  { label: "Cycling", src: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=70" },
  { label: "Basketball", src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=70" },
  { label: "Soccer", src: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=70" },
  { label: "Skateboarding", src: "https://images.unsplash.com/photo-1531565637446-32307b194362?auto=format&fit=crop&w=900&q=70" },
];

function AppStoreBadge() {
  return (
    <a
      href="#"
      aria-label="Coming soon to the App Store"
      className="inline-flex items-center gap-3 rounded-xl bg-foreground text-background px-5 py-3 shadow-elegant hover:opacity-90 transition-opacity min-w-[180px]"
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.42 2.23-1.12 3.04-.79.93-2.05 1.65-3.07 1.56-.14-1.13.42-2.3 1.1-3.07.78-.9 2.13-1.6 3.09-1.53zM20.5 17.27c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.06-1.79-4.05-3.36C-.18 16.92-.4 11.84 2.27 9.36c1.3-1.2 3.05-1.96 4.86-1.99 1.58-.03 3.08 1.06 4.03 1.06.94 0 2.74-1.31 4.62-1.12.79.03 3.01.32 4.43 2.41-.11.07-2.65 1.55-2.62 4.62.03 3.67 3.21 4.89 3.25 4.91z"/>
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-80">Coming soon to the</span>
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
      className="inline-flex items-center gap-3 rounded-xl bg-foreground text-background px-5 py-3 shadow-elegant hover:opacity-90 transition-opacity min-w-[180px]"
    >
      <svg viewBox="0 0 512 512" className="h-8 w-8" aria-hidden="true">
        <path fill="#00D7FE" d="M53.3 32.5C42.4 38.6 36 49.9 36 64.5v383c0 14.5 6.4 25.9 17.3 32l217-207.5-217-239.5z"/>
        <path fill="#FFBC00" d="M363 154.6L290.6 196 270 217l99.4 95 73.4-41.9c19.4-11.1 19.4-39.5 0-50.7L363 154.6z"/>
        <path fill="#FF3A44" d="M270 217L53.3 32.5c4-2.3 8.6-3.5 13.7-3.5 6.7 0 13.9 1.9 21 5.9L363 154.6 270 217z"/>
        <path fill="#00F076" d="M270 295l99.4-83-99.4-95L53.3 479.5c4 2.3 8.6 3.5 13.7 3.5 6.7 0 13.9-1.9 21-5.9L363 357.4 270 295z"/>
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-80">Coming soon on</span>
        <span className="text-lg font-semibold -mt-0.5">Google Play</span>
      </div>
    </a>
  );
}

function ComingSoonPage() {
  const loop = [...ACTIVITIES, ...ACTIVITIES];
  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center relative overflow-hidden">
        {/* soft radial gold halo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in oklab, var(--primary) 22%, transparent) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <PulstractMark className="h-20 w-40 md:h-24 md:w-48" />
          <span className="mt-4 font-sans font-light text-base md:text-lg tracking-[0.4em] uppercase">
            puls<span className="text-primary">t</span>ract
          </span>

          <h1 className="mt-10 font-display text-5xl md:text-7xl font-semibold tracking-tight">
            Coming <span className="text-primary">soon</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground text-base md:text-lg">
            Book classes and trainers near you — pilates, boxing, pickleball, yoga and more.
            The Pulstract mobile app lands on iOS and Android shortly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <AppStoreBadge />
            <GooglePlayBadge />
          </div>
        </div>
      </main>

      {/* Activity carousel */}
      <section className="relative overflow-hidden border-t bg-background/50 py-10">
        <div className="flex w-max animate-netflix-scroll gap-4 px-4" style={{ willChange: "transform" }}>
          {loop.map((a, i) => (
            <div
              key={`${a.label}-${i}`}
              className="relative h-40 w-64 flex-shrink-0 overflow-hidden rounded-xl shadow-card"
            >
              <img src={a.src} alt={a.label} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <span className="absolute bottom-3 left-3 text-primary-foreground font-display text-lg tracking-wide">
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Pulstract · Move together
      </footer>
    </div>
  );
}
