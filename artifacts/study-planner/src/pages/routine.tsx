import { 
  useListRoutineItems, useCreateRoutineItem, useUpdateRoutineItem, useDeleteRoutineItem,
  useListSubjects, getListRoutineItemsQueryKey
} from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Routine() {
  const { data: routineItems, isLoading: routineLoading } = useListRoutineItems();
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  
  const createItem = useCreateRoutineItem();
  const queryClient = useQueryClient();

  const [addingForDay, setAddingForDay] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<string>("none");

  const handleAdd = (day: string) => {
    if (!newLabel.trim()) return;
    createItem.mutate({
      data: {
        day,
        label: newLabel,
        subjectId: newSubjectId === "none" ? null : parseInt(newSubjectId)
      }
    }, {
      onSuccess: () => {
        setAddingForDay(null);
        setNewLabel("");
        setNewSubjectId("none");
        queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() });
      }
    });
  };

  if (routineLoading || subjectsLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Weekly Routine</h1>
        <p className="text-muted-foreground mt-2">Plan your study habits throughout the week.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map(day => {
          const itemsForDay = routineItems?.filter(i => i.day === day) || [];
          
          return (
            <Card key={day} className="shadow-sm border-primary/10 bg-gradient-to-b from-card to-muted/20">
              <CardHeader className="py-4 border-b border-border/50">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                {itemsForDay.length > 0 ? (
                  <div className="space-y-2">
                    {itemsForDay.map(item => (
                      <RoutineItemCard key={item.id} item={item} subjects={subjects || []} />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center italic">
                    Free day
                  </div>
                )}

                {addingForDay === day ? (
                  <div className="space-y-2 mt-2 pt-3 border-t border-border border-dashed">
                    <Input 
                      placeholder="Activity (e.g. Study 2h)" 
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Link to subject (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No subject</SelectItem>
                        {subjects?.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 flex-1" onClick={() => handleAdd(day)} disabled={!newLabel.trim()}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingForDay(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border border-dashed" onClick={() => {
                    setAddingForDay(day);
                    setNewLabel("");
                    setNewSubjectId("none");
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add task
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RoutineItemCard({ item, subjects }: { item: any, subjects: any[] }) {
  const updateItem = useUpdateRoutineItem();
  const deleteItem = useDeleteRoutineItem();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editSubjectId, setEditSubjectId] = useState<string>(item.subjectId ? item.subjectId.toString() : "none");

  const handleUpdate = () => {
    updateItem.mutate({
      id: item.id,
      data: {
        label: editLabel,
        subjectId: editSubjectId === "none" ? null : parseInt(editSubjectId)
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ id: item.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() });
      }
    });
  };

  const subjectName = item.subjectId ? subjects.find(s => s.id === item.subjectId)?.name : null;

  if (isEditing) {
    return (
      <div className="p-2 border border-primary/30 rounded-md bg-background space-y-2 animate-in fade-in">
        <Input 
          value={editLabel} 
          onChange={e => setEditLabel(e.target.value)} 
          className="h-7 text-sm"
        />
        <Select value={editSubjectId} onValueChange={setEditSubjectId}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="sm" variant="default" className="h-6 text-xs flex-1" onClick={handleUpdate}>Save</Button>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.label}</span>
        {subjectName && (
          <span className="text-xs text-primary/80 mt-0.5">{subjectName}</span>
        )}
      </div>
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsEditing(true)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}