import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, BookOpen, FileText, Calendar, Play, Download,
  ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";

const TUTORIAL_KEY = "study-planner-tutorial-seen";

const steps = [
  {
    icon: Sparkles,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    title: "Welcome to Study Planner! 🎓",
    desc: "Your personal academic organiser to plan your semester, track progress, and stay on top of every subject. Let's take a quick tour!",
  },
  {
    icon: LayoutDashboard,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Overview",
    desc: "Your home screen shows the exam countdown, today's focus tasks (tick them off as you go!), and a visual progress bar for each subject. Start by setting your exam date in ⚙ Settings.",
  },
  {
    icon: BookOpen,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    title: "Course Outline",
    desc: "Add your subjects and the topics inside each one. Check off topics as you study them — the progress percentages update automatically on the Overview.",
  },
  {
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    title: "Notes",
    desc: "Keep class notes organised by subject. You can attach photos of handwritten notes or diagrams. Use 'Add subject' to create a note group that isn't in your Course Outline.",
  },
  {
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    title: "Weekly Routine",
    desc: "Build your weekly study schedule day by day. You can also upload a photo of your university timetable so it's always accessible here.",
  },
  {
    icon: Play,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    title: "Resources",
    desc: "Save useful links (YouTube videos, articles, PDFs) linked to each subject and topic. Mark links as Free or Paid at a glance.",
  },
  {
    icon: Download,
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Backup & Data",
    desc: "Export all your data as a .json file anytime to keep it safe. Import it back if you switch devices. You can also share a progress summary via Gmail. Everything is stored privately in your database.",
  },
];

export function Tutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-400 to-primary jelly-color-bar" />

        <div className="p-6 space-y-5">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${current.bg} flex items-center justify-center mx-auto`}>
            <Icon className={`w-7 h-7 ${current.color}`} />
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step === 0 && (
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={dismiss}>
                Skip tour
              </Button>
            )}
            <Button size="sm" className="flex-1 liquid-glass-nav" onClick={() => isLast ? dismiss() : setStep(s => s + 1)}>
              {isLast ? "Let's go! 🚀" : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
