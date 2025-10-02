import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import WelcomeBack from "@/components/WelcomeBack";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_10%_-10%,hsl(var(--primary)/0.12),transparent_60%),radial-gradient(900px_500px_at_90%_10%,hsl(var(--accent)/0.10),transparent_50%)] text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2 font-extrabold tracking-tight">
            <span className="inline-block h-7 w-7 rounded-lg bg-primary/90 shadow ring-1 ring-primary/50 group-hover:scale-105 transition-transform" />
            <span className="text-lg">Crisp</span>
            <span className="sr-only">Crisp Interview Assistant</span>
          </Link>
          <nav className="flex items-center gap-1">
            <TabLink to="/">Interviewee</TabLink>
            <TabLink to="/interviewer">Interviewer</TabLink>
          </nav>
        </div>
      </header>
      <main className="container py-6 md:py-8 lg:py-10">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">© {new Date().getFullYear()} Crisp • AI Interview Assistant</div>
      </footer>
      <WelcomeBack />
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )
      }
    >
      {children}
    </NavLink>
  );
}
