import { useGetExam, useGetProgress, useListTasks, useUpdateTask, useCreateTask, getListTasksQueryKey, useListSubjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Clock, Target, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDeleteTask } from "@workspace/api-client-react";

export default function Home() {
  const { data: exam, isLoading: examLoading } = useGetExam();
  const { data: progress, isLoading: progressLoading } = useGetProgress();
  const { data: subjects } = useListSubjects();
  
  const today = new Date().toISOString().split('T')[0];
  const { data: tasks, isLoading: tasksLoading } = useListTasks({ date: today });
  
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("none");

  const handleToggleTask = (taskId: number, completed: boolean) => {
    updateTask.mutate({ id: taskId, data: { completed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ date: today }) });
      }
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    createTask.mutate({
      data: {
        name: newTaskName,
        date: today,
        subjectId: newTaskSubject === "none" ? null : parseInt(newTaskSubject)
      }
    }, {
      onSuccess: () => {
        setNewTaskName("");
        setNewTaskSubject("none");
        setIsAddingTask(false);
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ date: today }) });
      }
    });
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ date: today }) });
      }
    });
  };

  const daysRemaining = exam?.examDate ? differenceInDays(new Date(exam.examDate), new Date()) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-2 text-lg">Here's what you need to focus on today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Countdown Card */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examLoading ? <Skeleton className="h-20 w-full" /> : exam ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-5xl font-extrabold text-foreground tracking-tighter">
                    {daysRemaining !== null && daysRemaining >= 0 ? daysRemaining : "-"}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Days Remaining</div>
                </div>
                <div className="text-center pb-2">
                  <div className="font-semibold text-lg">{exam.name || "Next Exam"}</div>
                  {exam.examDate && <div className="text-sm text-muted-foreground">{new Date(exam.examDate).toLocaleDateString()}</div>}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No exam configured.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${task.completed ? 'bg-muted/50 border-muted' : 'bg-card border-border hover:border-primary/50'}`}>
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={(checked) => handleToggleTask(task.id, checked === true)}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className={`text-base flex-1 transition-all ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.name}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No tasks scheduled for today.</p>
                <p className="text-sm mt-1">Enjoy your free time!</p>
              </div>
            )}

            {isAddingTask ? (
              <div className="mt-4 p-3 bg-muted/30 border border-border rounded-lg space-y-3">
                <Input 
                  placeholder="Task description..." 
                  value={newTaskName} 
                  onChange={(e) => setNewTaskName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select value={newTaskSubject} onValueChange={setNewTaskSubject}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Link to subject (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subject</SelectItem>
                      {subjects?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                  <Button onClick={handleAddTask} disabled={!newTaskName.trim() || createTask.isPending}>Add</Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed" 
                onClick={() => setIsAddingTask(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Task for Today
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Course Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {progressLoading ? (
            <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : progress && progress.subjects && progress.subjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {progress.subjects.map(subject => (
                <div key={subject.subjectId} className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-medium text-foreground">{subject.subjectName}</span>
                    <span className="text-muted-foreground tabular-nums">{Math.round(subject.percentage)}%</span>
                  </div>
                  <Progress value={subject.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {subject.completedTopics} / {subject.totalTopics} topics
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="py-8 text-center text-muted-foreground">
              <p>No subjects added to course outline yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}