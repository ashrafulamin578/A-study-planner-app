import {
  useGetExam, useGetProgress, useListTasks, useUpdateTask, useCreateTask,
  useDeleteTask, useListSubjects, useGetSettings, getListTasksQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Clock, Target, CheckCircle2, AlertCircle, Plus, Trash2, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function CircleProgress({ value, size = 110, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className={`font-bold text-foreground ${size >= 120 ? "text-2xl" : size >= 80 ? "text-base" : "text-xs"}`}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: exam, isLoading: examLoading } = useGetExam();
  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: subjects } = useListSubjects();
  const { data: settings } = useGetSettings();
  const today = new Date().toISOString().split("T")[0];
  const { data: allTasks, isLoading: tasksLoading } = useListTasks();
  const todayTasks = allTasks?.filter(t => t.date === today) || [];
  const archivedTasks = allTasks?.filter(t => t.date < today) || [];

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("none");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const totalTopics = progress?.subjects?.reduce((s, sub) => s + sub.totalTopics, 0) ?? 0;
  const completedTopics = progress?.subjects?.reduce((s, sub) => s + sub.completedTopics, 0) ?? 0;
  const overallPct = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const daysRemaining = exam?.examDate ? differenceInDays(new Date(exam.examDate), new Date()) : null;
  const greeting = settings?.userName ? `Welcome, ${settings.userName} 👋` : "Welcome back 👋";
  const getSubjectName = (subjectId: number | null) =>
    subjectId ? subjects?.find(s => s.id === subjectId)?.name ?? null : null;

  const handleToggleTask = (taskId: number, completed: boolean) => {
    updateTask.mutate({ id: taskId, data: { completed } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    });
  };
  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    createTask.mutate({
      data: { name: newTaskName, date: today, subjectId: newTaskSubject === "none" ? null : parseInt(newTaskSubject) },
    }, {
      onSuccess: () => {
        setNewTaskName(""); setNewTaskSubject("none"); setIsAddingTask(false);
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      },
    });
  };
  const confirmDeleteTask = () => {
    if (!deleteTaskId) return;
    deleteTask.mutate({ id: deleteTaskId }, {
      onSuccess: () => { setDeleteTaskId(null); queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{greeting}</h1>
        {exam?.semesterCount && <p className="text-primary font-semibold mt-1 text-sm">Semester {exam.semesterCount}</p>}
        <p className="text-muted-foreground mt-0.5 text-base">Here's what you need to focus on today.</p>
      </div>

      {/* Countdown + Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" /> Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examLoading ? <Skeleton className="h-20 w-full" /> : exam ? (
              <div className="space-y-3">
                <div className="text-center py-3">
                  <div className="text-5xl font-extrabold text-foreground tracking-tighter">
                    {daysRemaining !== null && daysRemaining >= 0 ? daysRemaining : "—"}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Days Remaining</div>
                </div>
                <div className="text-center pb-1">
                  <div className="font-semibold">{exam.name || "Next Exam"}</div>
                  {exam.examDate && <div className="text-xs text-muted-foreground">{new Date(exam.examDate).toLocaleDateString()}</div>}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <AlertCircle className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No exam set — use ⚙ Settings.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map(task => {
                  const subjectName = getSubjectName(task.subjectId);
                  return (
                    <div key={task.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors group ${task.completed ? "bg-muted/50 border-muted" : "bg-card border-border hover:border-primary/50"}`}>
                      <Checkbox checked={task.completed} onCheckedChange={c => handleToggleTask(task.id, c === true)} className="w-5 h-5 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        {subjectName && <div className="text-xs font-semibold text-primary mb-0.5">{subjectName}</div>}
                        <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0" onClick={() => setDeleteTaskId(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No tasks for today. Enjoy your time!</p>
              </div>
            )}

            {isAddingTask ? (
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                <Input placeholder="Task description…" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleAddTask()} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={newTaskSubject} onValueChange={setNewTaskSubject}>
                    <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Subject (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subject</SelectItem>
                      {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                    <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAddTask} disabled={!newTaskName.trim() || createTask.isPending}>Add</Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full mt-3 border-dashed" onClick={() => setIsAddingTask(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Task for Today
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Progress – Overall circle + subject rows */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-medium">Course Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {progressLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : progress && progress.subjects.length > 0 ? (
            <>
              {/* Overall circle — centered */}
              <div className="flex flex-col items-center py-5 border-b border-border/50">
                <CircleProgress value={overallPct} size={180} stroke={16} />
                <p className="mt-3 text-base font-semibold text-primary">Overall Progress</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-bold text-foreground">{completedTopics}</span> of <span className="font-bold text-foreground">{totalTopics}</span> topics complete
                </p>
              </div>
              {/* Subject rows */}
              <div className="divide-y divide-border/40 mt-2">
                {progress.subjects.map(subject => (
                  <div key={subject.subjectId} className="flex items-center justify-between py-3.5 px-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-semibold text-foreground truncate">{subject.subjectName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {subject.completedTopics} / {subject.totalTopics} topics
                      </div>
                    </div>
                    <CircleProgress value={subject.percentage} size={60} stroke={5} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-muted-foreground text-sm">No subjects in course outline yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Archived Tasks */}
      <Card className="shadow-sm border-muted/60">
        <CardHeader className="pb-2">
          <button onClick={() => setShowArchived(v => !v)} className="flex items-center gap-2 text-left w-full">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Past Tasks {archivedTasks.length > 0 && `(${archivedTasks.length})`}</span>
            <span className="ml-auto text-xs text-muted-foreground">{showArchived ? "▲" : "▼"}</span>
          </button>
        </CardHeader>
        {showArchived && (
          <CardContent className="pt-0">
            {archivedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">No past tasks. Tasks from previous days appear here automatically.</p>
            ) : (
              <div className="space-y-1.5">
                {archivedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-muted/60">
                    <Checkbox checked={task.completed} disabled className="w-4 h-4 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      {getSubjectName(task.subjectId) && <div className="text-xs text-muted-foreground/70">{getSubjectName(task.subjectId)}</div>}
                      <span className={`text-xs ${task.completed ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>{task.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">{task.date}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Task delete confirm */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={o => !o && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This task will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
