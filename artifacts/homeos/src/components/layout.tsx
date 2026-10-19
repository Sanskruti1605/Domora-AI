import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  CreditCard, 
  LayoutDashboard, 
  Layers, 
  FileText, 
  Bot,
  Zap
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: CreditCard },
  { href: "/subscriptions", label: "Subscriptions", icon: Layers },
  { href: "/assets", label: "Assets", icon: Activity },
  { href: "/documents", label: "Vault", icon: FileText },
  { href: "/ai", label: "Intelligence", icon: Bot },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col z-10 md:h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Zap className="h-6 w-6" fill="currentColor" />
            <span className="font-mono font-bold text-lg tracking-wider text-foreground">HomeOS</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 flex flex-row md:flex-col gap-1 px-4 md:px-3 overflow-x-auto md:overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="hidden md:flex p-4 border-t border-border items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Admin</span>
            <span className="text-xs text-muted-foreground">System Online</span>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-background relative">
        {/* Subtle grid background for the cockpit vibe */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0">
          <div className="max-w-6xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
