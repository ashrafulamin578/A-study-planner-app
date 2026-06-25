import { 
  useExportData, useImportData, useResetData, useGetProgress, getGetProgressQueryKey
} from "@workspace/api-client-react";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, Mail, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Backup() {
  const { refetch: exportData, isFetching: isExporting } = useExportData({ query: { enabled: false } });
  const importData = useImportData();
  const resetData = useResetData();
  const { data: progress } = useGetProgress();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const result = await exportData();
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Backup downloaded successfully" });
      }
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          await importData.mutateAsync({ data: { data: parsed } });
          queryClient.invalidateQueries();
          toast({ title: "Data imported successfully" });
        } catch (err) {
          toast({ title: "Invalid backup file", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = async () => {
    try {
      await resetData.mutateAsync();
      queryClient.invalidateQueries();
      toast({ title: "All data has been erased" });
    } catch (e) {
      toast({ title: "Failed to reset data", variant: "destructive" });
    }
  };

  const handleGmailSummary = () => {
    if (!progress) return;
    
    let body = "Study Progress Summary:\n\n";
    if (progress.subjects && progress.subjects.length > 0) {
      progress.subjects.forEach(sub => {
        body += `- ${sub.subjectName}: ${Math.round(sub.percentage)}% (${sub.completedTopics}/${sub.totalTopics} topics)\n`;
      });
    } else {
      body += "No subjects configured yet.\n";
    }
    
    const subject = encodeURIComponent("Weekly Study Progress Update");
    const encodedBody = encodeURIComponent(body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${encodedBody}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Data & Backup</h1>
        <p className="text-muted-foreground mt-2">Manage your study data, export backups, and send progress reports.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" /> Export Data
            </CardTitle>
            <CardDescription>Download a complete copy of your planner data as a JSON file.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? "Preparing Backup..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Import Data
            </CardTitle>
            <CardDescription>Restore your planner from a previously downloaded JSON backup file.</CardDescription>
          </CardHeader>
          <CardContent>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport} 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full" disabled={importData.isPending}>
              {importData.isPending ? "Importing..." : "Choose Backup File"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" /> Share Progress via Gmail
          </CardTitle>
          <CardDescription>
            Generate an automated summary of your course progress and open a new draft in Gmail.
            Great for keeping parents, mentors, or tutors updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGmailSummary} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Mail className="w-4 h-4 mr-2" /> Open Gmail Draft
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Permanently delete all subjects, notes, routines, and resources. This cannot be undone unless you have a backup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Erase All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your subjects, topics, notes, tasks, routine items, and resources. Make sure you have exported a backup first!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Erase Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}