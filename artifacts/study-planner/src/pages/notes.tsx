import {
  useListSubjects,
  useListNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  getListNotesQueryKey,
} from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Image as ImageIcon, FileText, Info, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NOTE_GROUPS_KEY = "study-planner-note-groups";
function getNoteGroups(): string[] {
  try { return JSON.parse(localStorage.getItem(NOTE_GROUPS_KEY) || "[]"); } catch { return []; }
}
function saveNoteGroups(groups: string[]) {
  localStorage.setItem(NOTE_GROUPS_KEY, JSON.stringify(groups));
}

export default function Notes() {
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  const { data: allNotes, isLoading: notesLoading } = useListNotes();
  const createNote = useCreateNote();
  const queryClient = useQueryClient();

  const [noteGroups, setNoteGroups] = useState<string[]>(getNoteGroups);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [addTarget, setAddTarget] = useState<
    { type: "subject"; id: number } | { type: "custom"; name: string } | null
  >(null);
  const [newClassLabel, setNewClassLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCustomGroup = () => {
    const name = newGroupName.trim();
    if (!name || noteGroups.includes(name)) return;
    const updated = [...noteGroups, name];
    setNoteGroups(updated);
    saveNoteGroups(updated);
    setNewGroupName("");
    setAddingGroup(false);
  };

  const handleAddNote = async () => {
    if (!newClassLabel.trim() || !addTarget) return;
    await createNote.mutateAsync({
      data: {
        subjectId: addTarget.type === "subject" ? addTarget.id : null,
        noteGroupName: addTarget.type === "custom" ? addTarget.name : null,
        classLabel: newClassLabel,
        content: newContent || null,
        photoUrl: newPhotoUrl,
      },
    });
    setAddTarget(null);
    setNewClassLabel("");
    setNewContent("");
    setNewPhotoUrl(null);
    queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
  };

  const getNotesForSubject = (id: number) => allNotes?.filter((n) => n.subjectId === id) || [];
  const getNotesForGroup = (name: string) =>
    allNotes?.filter((n) => n.subjectId === null && n.noteGroupName === name) || [];

  if (subjectsLoading || notesLoading) return <Skeleton className="h-40 w-full" />;

  const hasAnything = (subjects && subjects.length > 0) || noteGroups.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-2">Your class notes and study materials.</p>
        </div>
        <Button variant="outline" onClick={() => setAddingGroup(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add subject
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <span>Subjects from <strong className="text-foreground">Course Outline</strong> appear here automatically.</span>
      </div>

      {addingGroup && (
        <div className="flex gap-2 p-3 bg-muted/30 border border-border rounded-xl">
          <Input autoFocus placeholder="Group name (e.g. Personal, Language)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCustomGroup()} />
          <Button onClick={handleAddCustomGroup} disabled={!newGroupName.trim()}>Add</Button>
          <Button variant="ghost" onClick={() => { setAddingGroup(false); setNewGroupName(""); }}>Cancel</Button>
        </div>
      )}

      {!hasAnything ? (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl">
          <p>Add a subject in Course Outline or click <strong>"Add subject"</strong> above to start.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {subjects?.map((subject) => {
            const notes = getNotesForSubject(subject.id);
            const isAdding = addTarget?.type === "subject" && addTarget.id === subject.id;
            return (
              <NoteGroup
                key={`s-${subject.id}`}
                title={subject.name}
                notes={notes}
                isAdding={isAdding}
                newClassLabel={newClassLabel}
                newContent={newContent}
                newPhotoUrl={newPhotoUrl}
                fileRef={fileRef}
                onStartAdd={() => { setAddTarget({ type: "subject", id: subject.id }); setNewClassLabel(`Class – ${notes.length + 1}`); setNewContent(""); setNewPhotoUrl(null); }}
                onSetClassLabel={setNewClassLabel}
                onSetContent={setNewContent}
                onPhotoUpload={handlePhotoUpload}
                onSave={handleAddNote}
                onCancel={() => setAddTarget(null)}
                isSaving={createNote.isPending}
              />
            );
          })}
          {noteGroups.map((groupName) => {
            const notes = getNotesForGroup(groupName);
            const isAdding = addTarget?.type === "custom" && addTarget.name === groupName;
            return (
              <NoteGroup
                key={`g-${groupName}`}
                title={groupName}
                notes={notes}
                isCustom
                onRemoveGroup={() => {
                  const updated = noteGroups.filter((g) => g !== groupName);
                  setNoteGroups(updated);
                  saveNoteGroups(updated);
                }}
                isAdding={isAdding}
                newClassLabel={newClassLabel}
                newContent={newContent}
                newPhotoUrl={newPhotoUrl}
                fileRef={fileRef}
                onStartAdd={() => { setAddTarget({ type: "custom", name: groupName }); setNewClassLabel(`Class – ${notes.length + 1}`); setNewContent(""); setNewPhotoUrl(null); }}
                onSetClassLabel={setNewClassLabel}
                onSetContent={setNewContent}
                onPhotoUpload={handlePhotoUpload}
                onSave={handleAddNote}
                onCancel={() => setAddTarget(null)}
                isSaving={createNote.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function NoteGroup({ title, notes, isCustom, onRemoveGroup, isAdding, newClassLabel, newContent, newPhotoUrl, fileRef, onStartAdd, onSetClassLabel, onSetContent, onPhotoUpload, onSave, onCancel, isSaving }: any) {
  return (
    <Card className="shadow-sm border-primary/10 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-primary">{title}</CardTitle>
          {isCustom && onRemoveGroup && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemoveGroup}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {notes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            {notes.map((note: any) => <NoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          <p className="text-muted-foreground mb-5 text-sm">No notes yet in this group.</p>
        )}

        {isAdding ? (
          <div className="bg-accent/30 p-4 rounded-xl space-y-3 border border-border">
            <Input placeholder="Class Label (e.g. Class – 1)" value={newClassLabel} onChange={(e) => onSetClassLabel(e.target.value)} />
            <Textarea placeholder="Note content…" value={newContent} onChange={(e) => onSetContent(e.target.value)} className="min-h-[90px]" />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {newPhotoUrl ? "Change Photo" : "Add Photo"}
                </Button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onPhotoUpload} />
                {newPhotoUrl && (
                  <div className="relative h-12 w-16 rounded overflow-hidden border border-border">
                    <img src={newPhotoUrl} alt="preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button size="sm" onClick={onSave} disabled={!newClassLabel.trim() || isSaving}>Save Note</Button>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={onStartAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Note
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function NoteCard({ note }: { note: any }) {
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(note.classLabel);
  const [editContent, setEditContent] = useState(note.content || "");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(note.photoUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const handleUpdate = () => {
    updateNote.mutate(
      { id: note.id, data: { classLabel: editLabel, content: editContent || null, photoUrl: editPhotoUrl } },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteNote.mutate({ id: note.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() }),
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (isEditing) {
    return (
      <div className="bg-background p-4 rounded-xl border border-primary/20 space-y-3">
        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[80px]" />
        {editPhotoUrl && (
          <div className="rounded-md overflow-hidden border border-border/50 max-h-40">
            <img src={editPhotoUrl} alt="attachment" className="w-full object-contain max-h-40" />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="h-8">
            <ImageIcon className="w-3.5 h-3.5 mr-2" /> Photo
          </Button>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setIsEditing(false); setEditLabel(note.classLabel); setEditContent(note.content || ""); setEditPhotoUrl(note.photoUrl ?? null); }}>Cancel</Button>
            <Button size="sm" className="h-8" onClick={handleUpdate} disabled={!editLabel.trim()}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  const photoSrc: string | null = note.photoUrl ?? null;

  return (
    <>
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm group flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            {note.classLabel}
          </div>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setIsEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteStep(1)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {note.content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3 flex-1">{note.content}</p>
        )}
        {photoSrc && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
            <img
              src={photoSrc}
              alt="Note attachment"
              className="w-full object-contain max-h-52"
            />
          </div>
        )}
        <div className="text-xs text-muted-foreground/50 mt-3 pt-2 border-t border-border/50">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>

      <AlertDialog open={deleteStep === 1} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>"{note.classLabel}" will be removed. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep(2)} className="bg-destructive text-white hover:bg-destructive/90">Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 2} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This note and any attached photos will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleteStep(0); handleDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
