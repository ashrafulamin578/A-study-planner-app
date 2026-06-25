import { Link, useLocation } from "wouter";
import { BookOpen, Calendar, FileText, Download, LayoutDashboard, Plus, Play } from "lucide-react";
import { SettingsDialog } from "./settings-dialog";
import { TooltipProvider, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";
import { Button } from "react-day-picker";
import { Tooltip } from "recharts";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/course", label: "Course Outline", icon: BookOpen },
    { href: "/notes", label: "Notes", icon: FileText },
    { href: "/routine", label: "Routine", icon: Calendar },
    { href: "/resources", label: "Resources", icon: Play },
    { href: "/backup", label: "Backup", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border p-6 flex flex-col gap-8 shadow-sm z-10 relative">
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
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"}`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 md:px-12 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/course">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Plus className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Add Subject</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/routine">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Calendar className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Open Routine</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SettingsDialog />
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}