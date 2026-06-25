import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "./theme-provider";
import { useGetExam, useUpsertExam, useGetSettings, useUpsertSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetExamQueryKey, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Settings, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SettingsDialog() {
  const { theme: currentTheme } = useTheme();
  const { data: exam } = useGetExam();
  const { data: settings } = useGetSettings();
  
  const upsertExam = useUpsertExam();
  const upsertSettings = useUpsertSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [examName, setExamName] = useState(exam?.name || "");
  const [examDate, setExamDate] = useState(exam?.examDate?.split("T")[0] || "");
  const [semesterCount, setSemesterCount] = useState(exam?.semesterCount?.toString() || "");
  const [theme, setTheme] = useState(settings?.theme || currentTheme);

  // Sync state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setExamName(exam?.name || "");
      setExamDate(exam?.examDate?.split("T")[0] || "");
      setSemesterCount(exam?.semesterCount?.toString() || "");
      setTheme(settings?.theme || currentTheme);
    }
    setOpen(newOpen);
  };

  const handleSave = async () => {
    try {
      await upsertExam.mutateAsync({
        data: {
          name: examName,
          examDate: new Date(examDate).toISOString(),
          semesterCount: parseInt(semesterCount) || 1,
        }
      });
      await upsertSettings.mutateAsync({
        data: {
          theme
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getGetExamQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      
      toast({ title: "Settings saved" });
      setOpen(false);
    } catch (e) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="pink-light">Girls Light (Pink)</SelectItem>
                <SelectItem value="dark-red">Boys Dark (Red)</SelectItem>
                <SelectItem value="dark-blue">Boys Dark (Blue)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Exam Name</Label>
            <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Finals, Midterms..." />
          </div>
          <div className="grid gap-2">
            <Label>Exam Date</Label>
            <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Semester Count</Label>
            <Input type="number" value={semesterCount} onChange={e => setSemesterCount(e.target.value)} min={1} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={upsertExam.isPending || upsertSettings.isPending}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}