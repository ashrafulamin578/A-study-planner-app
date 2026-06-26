import {
  useListRoutineItems, useCreateRoutineItem, useUpdateRoutineItem, useDeleteRoutineItem,
  useListSubjects, useGetSettings, useUpsertSettings,
  getListRoutineItemsQueryKey,
} from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarDays, Upload, X, ImageIcon, ZoomIn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Routine() {
  const { data: routineItems, isLoading: routineLoading } = useListRoutineItems();
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  const { data: settings } = useGetSettings();
  const upsertSettings = useUpsertSettings();
  const { toast } = useToast();
  const createItem = useCreateRoutineItem();
  const queryClient = useQueryClient();

  const [addingForDay, setAddingForDay] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTimetable, setUploadingTimetable] = useState(false);
  const [timetableLightbox, setTimetableLightbox] = useState(false);
  const [removeTimetableConfirm, setRemoveTimetableConfirm] = useState(false);

  const handleAdd = (day: string) => {
    if (!newLabel.trim()) return;
    createItem.mutate({
      data: { day, label: newLabel, subjectId: newSubjectId === "none" ? null : parseInt(newSubjectId) },
    }, {
      onSuccess: () => {
        setAddingForDay(null); setNewLabel(""); setNewSubjectId("none");
        queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() });
      },
    });
  };

  const handleTimetableUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTimetable(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        await upsertSettings.mutateAsync({
          data: { theme: settings?.theme || "light", universityRoutineUrl: dataUrl },
        });
        queryClient.invalidateQueries();
        toast({ title: "University timetable saved!" });
      } catch {
        toast({ title: "Failed to save timetable", variant: "destructive" });
      } finally {
        setUploadingTimetable(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTimetable = async () => {
    try {
      await upsertSettings.mutateAsync({
        data: { theme: settings?.theme || "light", universityRoutineUrl: null },
      });
      queryClient.invalidateQueries();
      toast({ title: "Timetable removed" });
    } catch {
      toast({ title: "Failed to remove timetable", variant: "destructive" });
    } finally {
      setRemoveTimetableConfirm(false);
    }
  };

  if (routineLoading || subjectsLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;

  const timetableUrl: string | null = settings?.universityRoutineUrl ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Weekly Routine</h1>
        <p className="text-muted-foreground mt-2">Plan your study habits throughout the week.</p>
      </div>

      {/* University Timetable */}
      <Card className="shadow-sm border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> University Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timetableUrl ? (
            <div className="space-y-3">
              {/* Clickable image → lightbox */}
              <button
                className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm max-h-80 cursor-zoom-in group"
                onClick={() => setTimetableLightbox(true)}
              >
                <img src={timetableUrl} alt="University timetable" className="w-full object-contain max-h-80" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Tap the image to view full size</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingTimetable}>
                  <Upload className="w-3.5 h-3.5 mr-2" /> Replace
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemoveTimetableConfirm(true)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border/60 rounded-xl py-10 text-center space-y-3">
              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <div>
                <p className="text-sm text-muted-foreground">Upload a photo of your university class timetable</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Supports JPG, PNG, WEBP</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingTimetable}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingTimetable ? "Uploading…" : "Upload Timetable"}
              </Button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleTimetableUpload} />
        </CardContent>
      </Card>

      {/* Timetable lightbox */}
      {timetableLightbox && timetableUrl && (
        <Dialog open onOpenChange={o => !o && setTimetableLightbox(false)}>
          <DialogContent className="max-w-5xl p-2 bg-black/90 border-0">
            <img src={timetableUrl} alt="Timetable full size" className="w-full h-auto object-contain max-h-[88vh] rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      {/* Remove timetable confirm */}
      <AlertDialog open={removeTimetableConfirm} onOpenChange={setRemoveTimetableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove timetable?</AlertDialogTitle>
            <AlertDialogDescription>Your uploaded university timetable image will be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveTimetable} className="bg-destructive text-white hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Day-by-day schedule */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map(day => {
          const itemsForDay = routineItems?.filter(i => i.day === day) || [];
          return (
            <Card key={day} className="shadow-sm border-primary/10 bg-gradient-to-b from-card to-muted/20">
              <CardHeader className="py-4 border-b border-border/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" /> {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-3">
                {itemsForDay.length > 0 ? (
                  <div className="space-y-2">
                    {itemsForDay.map(item => <RoutineItemCard key={item.id} item={item} subjects={subjects || []} />)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center italic">Free day</div>
                )}

                {addingForDay === day ? (
                  <div className="space-y-2 mt-2 pt-3 border-t border-border border-dashed">
                    <Input placeholder="Activity (e.g. Study 2h)" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-8 text-sm" autoFocus />
                    <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Link to subject (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No subject</SelectItem>
                        {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 flex-1" onClick={() => handleAdd(day)} disabled={!newLabel.trim()}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingForDay(null)}>✕</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost" size="sm"
                    className="w-full mt-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border border-dashed"
                    onClick={() => { setAddingForDay(day); setNewLabel(""); setNewSubjectId("none"); }}
                  >
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

function RoutineItemCard({ item, subjects }: { item: any; subjects: any[] }) {
  const updateItem = useUpdateRoutineItem();
  const deleteItem = useDeleteRoutineItem();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editSubjectId, setEditSubjectId] = useState<string>(item.subjectId ? item.subjectId.toString() : "none");
  const [showDelete, setShowDelete] = useState(false);

  const handleUpdate = () => {
    updateItem.mutate({
      id: item.id,
      data: { label: editLabel, subjectId: editSubjectId === "none" ? null : parseInt(editSubjectId) },
    }, {
      onSuccess: () => { setIsEditing(false); queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() }); },
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ id: item.id }, {
      onSuccess: () => { setShowDelete(false); queryClient.invalidateQueries({ queryKey: getListRoutineItemsQueryKey() }); },
    });
  };

  const subjectName = item.subjectId ? subjects.find(s => s.id === item.subjectId)?.name : null;

  if (isEditing) {
    return (
      <div className="p-2 border border-primary/30 rounded-md bg-background space-y-2">
        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-7 text-sm" />
        <Select value={editSubjectId} onValueChange={setEditSubjectId}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="sm" className="h-6 text-xs flex-1" onClick={handleUpdate}>Save</Button>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsEditing(false)}>✕</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group flex items-start justify-between p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium">{item.label}</span>
          {subjectName && <span className="text-xs text-primary/80 mt-0.5">{subjectName}</span>}
        </div>
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity -mr-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsEditing(true)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{item.label}"?</AlertDialogTitle>
            <AlertDialogDescription>This routine task will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
