import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Compass,
  Map as MapIcon,
  Heart,
  Calendar,
  User as UserIcon,
  Sparkles,
  LayoutDashboard,
  Building2,
  Users,
  LineChart,
  PlusSquare,
  Wallet,
  Clock,
  FileText,
  Star,
  LifeBuoy,
  Sun,
  Moon,
  LogOut,
  Settings,
  Bell,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthModal } from "@/components/AuthModal";
import { AppSwitcher } from "@/components/AppSwitcher";

type NavItem = { to: string; label: string; icon: typeof Compass; search?: Record<string, unknown> };
type NavGroup = { label: string; items: NavItem[] };

const BROWSE_SEARCH = { q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" } as const;

const GROUPS: NavGroup[] = [
  {
    label: "Discover",
    items: [
      { to: "/browse", label: "Browse", icon: Compass, search: BROWSE_SEARCH },
      { to: "/hosts", label: "Hosts", icon: Users },
      { to: "/hosts/map", label: "Map view", icon: MapIcon },
    ],
  },
  {
    label: "My activity",
    items: [
      { to: "/bookings", label: "Bookings", icon: Calendar },
      { to: "/saved", label: "Saved", icon: Heart },
      { to: "/me/my-gym", label: "My gym", icon: Building2 },
    ],
  },
  {
    label: "Host",
    items: [
      { to: "/host", label: "Dashboard", icon: LayoutDashboard },
      { to: "/host/new", label: "Create listing", icon: PlusSquare },
      { to: "/host/analytics", label: "Analytics", icon: LineChart },
      { to: "/host/gym", label: "My gym", icon: Building2 },
      { to: "/host/gym/members", label: "Members", icon: Users },
      { to: "/host/earnings", label: "Earnings", icon: Wallet },
      { to: "/host/availability", label: "Availability", icon: Clock },
      { to: "/host/templates", label: "Templates", icon: FileText },
      { to: "/host/reviews", label: "Reviews", icon: Star },
      { to: "/host/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/me", label: "Profile", icon: UserIcon },
      { to: "/me/payment", label: "Payment methods", icon: CreditCard },
      { to: "/me/notifications", label: "Notifications", icon: Bell },
      { to: "/me/become-host", label: "Become a host", icon: Sparkles },
      { to: "/me/help", label: "Help & support", icon: HelpCircle },
      { to: "/me/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-elegant">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="tracking-tight group-data-[collapsible=icon]:hidden">Pulstract</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active =
                    pathname === item.to ||
                    (item.to !== "/" && pathname.startsWith(item.to + "/"));
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to} search={item.search as never}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  return {
    isDark,
    toggle: () => {
      const next = !isDark;
      setIsDark(next);
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* ignore */ }
    },
  };
}

function Topbar({ title, actions }: { title?: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open: openAuthModal } = useAuthModal();
  const { isDark, toggle } = useThemeToggle();
  const [email, setEmail] = useState<string | null>(null);
  useSidebar();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const initials = email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger />
      {title && <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>}
      <AppSwitcher className="ml-2 hidden sm:inline-flex" />
      <div className="ml-auto flex items-center gap-2">
        {actions}
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
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/bookings" })}>
                <Calendar className="mr-2 h-4 w-4" /> Bookings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={openAuthModal} size="sm" className="bg-gradient-hero shadow-elegant">Sign in</Button>
        )}
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  topbarActions,
}: {
  children: ReactNode;
  title?: string;
  topbarActions?: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar title={title} actions={topbarActions} />
        <main className="flex-1 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
