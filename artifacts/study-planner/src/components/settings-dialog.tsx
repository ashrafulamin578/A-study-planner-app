import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetExam, useUpsertExam, useGetSettings, useUpsertSettings,
  getGetExamQueryKey, getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const THEMES = [
  { value: "light",      label: "☀️ Light" },
  { value: "dark",       label: "🌑 Dark" },
  { value: "pink-light", label: "🌸 Pink Light" },
  { value: "dark-red",   label: "🔴 Dark Red" },
  { value: "dark-blue",  label: "🔵 Dark Blue" },
  { value: "forest",     label: "🌿 Forest" },
  { value: "lavender",   label: "💜 Lavender" },
  { value: "sunset",     label: "🌅 Sunset" },
  { value: "midnight",   label: "🌙 Midnight" },
  { value: "ocean",      label: "🌊 Ocean" },
];

export function SettingsDialog() {
  const { data: exam } = useGetExam();
  const { data: settings } = useGetSettings();

  const upsertExam = useUpsertExam();
  const upsertSettings = useUpsertSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState(settings?.userName || "");
  const [examName, setExamName] = useState(exam?.name || "");
  const [examDate, setExamDate] = useState(exam?.examDate?.split("T")[0] || "");
  const [semesterCount, setSemesterCount] = useState(exam?.semesterCount?.toString() || "");
  const [theme, setTheme] = useState(settings?.theme || "light");

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setUserName(settings?.userName || "");
      setExamName(exam?.name || "");
      setExamDate(exam?.examDate?.split("T")[0] || "");
      setSemesterCount(exam?.semesterCount?.toString() || "");
      setTheme(settings?.theme || "light");
    }
    setOpen(newOpen);
  };

  const handleSave = async () => {
    try {
      if (examName && examDate) {
        await upsertExam.mutateAsync({
          data: {
            name: examName,
            examDate: examDate,
            semesterCount: parseInt(semesterCount) || 1,
          },
        });
      }
      await upsertSettings.mutateAsync({
        data: { theme, userName: userName.trim() || null },
      });
      queryClient.invalidateQueries({ queryKey: getGetExamQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Settings saved" });
      setOpen(false);
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-3">
          <div className="grid gap-1.5">
            <Label>Your Name</Label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Sarah"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Exam Name</Label>
            <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Finals, Midterms…" />
          </div>
          <div className="grid gap-1.5">
            <Label>Exam Date</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Semester Number</Label>
            <Input type="number" value={semesterCount} onChange={(e) => setSemesterCount(e.target.value)} min={1} placeholder="e.g. 3" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsertExam.isPending || upsertSettings.isPending}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
