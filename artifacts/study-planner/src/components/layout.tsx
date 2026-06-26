import { Link, useLocation } from "wouter";
import {
  BookOpen, Calendar, FileText, Download, LayoutDashboard,
  Plus, Play, Settings2,
} from "lucide-react";
import { SettingsDialog } from "./settings-dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/course", label: "Course", icon: BookOpen },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/routine", label: "Routine", icon: Calendar },
  { href: "/resources", label: "Resources", icon: Play },
  { href: "/backup", label: "Backup", icon: Download },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground selection:bg-primary/20">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border p-6 flex-col gap-8 shadow-sm z-10 h-screen sticky top-0">
        <div className="font-bold text-2xl text-primary flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <span>Planner</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
                  isActive
                    ? "liquid-glass-nav shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">

        {/* Header */}
        <header className="h-14 px-4 md:px-10 border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between md:justify-end gap-2">
          {/* Mobile: branding left */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-primary">Planner</span>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/course">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Add Subject</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/routine">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Open Routine</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SettingsDialog />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
          <div className="jelly-color-bar mb-5 rounded-full h-1 w-full" />
          <div key={location} className="max-w-5xl mx-auto glass-page-enter">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 mobile-nav-glass">
        <div className="flex items-center justify-around px-1 py-1 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 min-w-0"
              >
                <div
                  className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${
                    isActive ? "liquid-glass-nav scale-105" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium leading-none truncate ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
