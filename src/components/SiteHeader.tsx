import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, User as UserIcon, Calendar, Sun, Moon, IdCard, Heart, Building2 } from "lucide-react";
import { PulsatractMark } from "@/components/brand/PulsatractLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthModal } from "@/components/AuthModal";

function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  return { isDark, toggle };
}

export function SiteHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open: openAuthModal } = useAuthModal();
  const { isDark, toggle } = useThemeToggle();
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setUid(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
      setUid(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const initials = email?.[0]?.toUpperCase() ?? "?";

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 leading-none mr-10">
          <PulsatractMark className="h-9 w-[72px]" />
          <span className="font-sans font-light text-[15px] tracking-[0.32em] uppercase">
            pulsa<span className="text-primary">t</span>ract
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm ml-auto mr-auto">
          <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }} className="text-foreground/80 hover:text-foreground transition-colors">Browse</Link>
          <Link to="/host" className="text-foreground/80 hover:text-foreground transition-colors">For hosts</Link>
          <Link to="/mobile" className="text-foreground/80 hover:text-foreground transition-colors">Mobile preview</Link>
          <Link to="/architecture" className="text-foreground/80 hover:text-foreground transition-colors">Architecture</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {email ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/me" })}>
                  <IdCard className="mr-2 h-4 w-4" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/bookings" })}>
                  <Calendar className="mr-2 h-4 w-4" /> My bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
                  <Heart className="mr-2 h-4 w-4" /> Saved classes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/me/my-gym" })}>
                  <Building2 className="mr-2 h-4 w-4" /> My gym
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/host" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Host dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={openAuthModal}>Sign in</Button>
              <Button onClick={openAuthModal} className="bg-gradient-hero hover:opacity-90 shadow-elegant">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
