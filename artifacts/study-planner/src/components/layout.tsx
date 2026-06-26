import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Calendar, FileText, Download, LayoutDashboard, Plus, Play,
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

const N = navItems.length;

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const activeIndex = navItems.findIndex(item => item.href === location);

  /* ── Sidebar pill position ───────────────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ top: 0, height: 48, ready: false });

  useEffect(() => {
    const measure = () => {
      const idx = navItems.findIndex(i => i.href === location);
      if (idx < 0) return;
      const el = linkRefs.current[idx];
      const container = containerRef.current;
      if (!el || !container) return;
      const cTop = container.getBoundingClientRect().top;
      const { top, height } = el.getBoundingClientRect();
      setPill({ top: top - cTop, height, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [location]);

  /* ── Mobile pill position ────────────────────────────────── */
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const mobileLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [mPill, setMPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const measure = () => {
      const idx = navItems.findIndex(i => i.href === location);
      if (idx < 0) return;
      const el = mobileLinkRefs.current[idx];
      const container = mobileContainerRef.current;
      if (!el || !container) return;
      const cLeft = container.getBoundingClientRect().left;
      const { left, width } = el.getBoundingClientRect();
      setMPill({ left: left - cLeft, width, ready: true });
    };
    // slight delay so layout is fully painted
    const t = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground selection:bg-primary/20">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border p-6 flex-col gap-8 shadow-sm z-10 h-screen sticky top-0">
        <div className="font-bold text-2xl text-primary flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <span>Planner</span>
        </div>

        {/* Nav with sliding glass pill */}
        <div ref={containerRef} className="relative flex flex-col gap-1.5 flex-1">
          {pill.ready && (
            <div className="liquid-glass-pill" style={{ top: pill.top, height: pill.height }} />
          )}
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { linkRefs.current[i] = el; }}
                className={`relative z-10 flex items-center gap-3 px-4 py-3 h-12 rounded-xl font-medium transition-colors duration-200 group ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">
        {/* Header */}
        <header className="h-14 px-4 md:px-10 border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between md:justify-end gap-2">
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

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
          <div className="jelly-color-bar mb-5 rounded-full h-1 w-full" />
          <div key={location} className="max-w-5xl mx-auto glass-page-enter">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 mobile-nav-glass">
        <div ref={mobileContainerRef} className="relative flex items-center px-1 py-1">
          {/* Sliding horizontal glass pill */}
          {mPill.ready && (
            <div
              className="liquid-glass-pill-h"
              style={{ left: mPill.left, width: mPill.width }}
            />
          )}
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { mobileLinkRefs.current[i] = el; }}
                className="relative z-10 flex flex-col items-center gap-0.5 flex-1 py-1.5 min-w-0"
              >
                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-muted-foreground"}`} />
                <span className={`text-[10px] font-medium leading-none truncate transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
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
