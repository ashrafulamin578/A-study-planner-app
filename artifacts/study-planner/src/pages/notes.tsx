import {
  useListSubjects,
  useListNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  getListNotesQueryKey,
} from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Image as ImageIcon, FileText, Info, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NOTE_GROUPS_KEY = "study-planner-note-groups";

function getNoteGroups(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTE_GROUPS_KEY) || "[]");
  } catch {
    return [];
  }
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

  const [newNoteGroupKey, setNewNoteGroupKey] = useState<{ type: "subject"; id: number } | { type: "custom"; name: string } | null>(null);
  const [newNoteClassLabel, setNewNoteClassLabel] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePhotoUrl, setNewNotePhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewNotePhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
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

  const handleRemoveCustomGroup = (name: string) => {
    const updated = noteGroups.filter((g) => g !== name);
    setNoteGroups(updated);
    saveNoteGroups(updated);
  };

  const handleAddNote = () => {
    if (!newNoteClassLabel.trim() || !newNoteGroupKey) return;
    const isSubject = newNoteGroupKey.type === "subject";
    createNote.mutate(
      {
        data: {
          subjectId: isSubject ? newNoteGroupKey.id : null,
          noteGroupName: !isSubject ? newNoteGroupKey.name : null,
          classLabel: newNoteClassLabel,
          content: newNoteContent || null,
          photoUrl: newNotePhotoUrl,
        },
      },
      {
        onSuccess: () => {
          setNewNoteGroupKey(null);
          setNewNoteClassLabel("");
          setNewNoteContent("");
          setNewNotePhotoUrl(null);
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        },
      }
    );
  };

  const getNotesForSubject = (subjectId: number) =>
    allNotes?.filter((n) => n.subjectId === subjectId) || [];

  const getNotesForCustomGroup = (name: string) =>
    allNotes?.filter((n) => n.subjectId === null && n.noteGroupName === name) || [];

  if (subjectsLoading || notesLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;
  }

  const hasAnything = (subjects && subjects.length > 0) || noteGroups.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-2">Your class notes and study materials.</p>
        </div>
        <Button variant="outline" onClick={() => setAddingGroup(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add subject
        </Button>
      </div>

      {/* Announcement */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <span>
          Subjects added in <strong className="text-foreground">Course Outline</strong> will appear here automatically and as options in other sections.
        </span>
      </div>

      {/* Add custom group form */}
      {addingGroup && (
        <div className="flex gap-2 p-3 bg-muted/30 border border-border rounded-xl">
          <Input
            autoFocus
            placeholder="Note group name (e.g. Personal, Language Practice)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomGroup()}
          />
          <Button onClick={handleAddCustomGroup} disabled={!newGroupName.trim()}>
            Add
          </Button>
          <Button variant="ghost" onClick={() => { setAddingGroup(false); setNewGroupName(""); }}>
            Cancel
          </Button>
        </div>
      )}

      {!hasAnything ? (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl">
          <p>Add a subject in Course Outline or click <strong>"Add subject"</strong> above to start taking notes.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Course outline subjects */}
          {subjects?.map((subject) => {
            const subjectNotes = getNotesForSubject(subject.id);
            const isAddingHere = newNoteGroupKey?.type === "subject" && newNoteGroupKey.id === subject.id;
            return (
              <NoteGroup
                key={`s-${subject.id}`}
                title={subject.name}
                notes={subjectNotes}
                isAddingHere={isAddingHere}
                newNoteClassLabel={newNoteClassLabel}
                newNoteContent={newNoteContent}
                newNotePhotoUrl={newNotePhotoUrl}
                fileInputRef={fileInputRef}
                onStartAdd={() => {
                  setNewNoteGroupKey({ type: "subject", id: subject.id });
                  setNewNoteClassLabel(`Class – ${subjectNotes.length + 1}`);
                  setNewNoteContent("");
                  setNewNotePhotoUrl(null);
                }}
                onSetClassLabel={setNewNoteClassLabel}
                onSetContent={setNewNoteContent}
                onPhotoUpload={handlePhotoUpload}
                onSave={handleAddNote}
                onCancel={() => setNewNoteGroupKey(null)}
                isSaving={createNote.isPending}
              />
            );
          })}

          {/* Custom note groups */}
          {noteGroups.map((groupName) => {
            const groupNotes = getNotesForCustomGroup(groupName);
            const isAddingHere = newNoteGroupKey?.type === "custom" && newNoteGroupKey.name === groupName;
            return (
              <NoteGroup
                key={`g-${groupName}`}
                title={groupName}
                notes={groupNotes}
                isCustom
                onRemoveGroup={() => handleRemoveCustomGroup(groupName)}
                isAddingHere={isAddingHere}
                newNoteClassLabel={newNoteClassLabel}
                newNoteContent={newNoteContent}
                newNotePhotoUrl={newNotePhotoUrl}
                fileInputRef={fileInputRef}
                onStartAdd={() => {
                  setNewNoteGroupKey({ type: "custom", name: groupName });
                  setNewNoteClassLabel(`Class – ${groupNotes.length + 1}`);
                  setNewNoteContent("");
                  setNewNotePhotoUrl(null);
                }}
                onSetClassLabel={setNewNoteClassLabel}
                onSetContent={setNewNoteContent}
                onPhotoUpload={handlePhotoUpload}
                onSave={handleAddNote}
                onCancel={() => setNewNoteGroupKey(null)}
                isSaving={createNote.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface NoteGroupProps {
  title: string;
  notes: any[];
  isCustom?: boolean;
  onRemoveGroup?: () => void;
  isAddingHere: boolean;
  newNoteClassLabel: string;
  newNoteContent: string;
  newNotePhotoUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onStartAdd: () => void;
  onSetClassLabel: (v: string) => void;
  onSetContent: (v: string) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function NoteGroup({
  title, notes, isCustom, onRemoveGroup,
  isAddingHere, newNoteClassLabel, newNoteContent, newNotePhotoUrl,
  fileInputRef, onStartAdd, onSetClassLabel, onSetContent,
  onPhotoUpload, onSave, onCancel, isSaving,
}: NoteGroupProps) {
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
      <CardContent className="pt-6">
        {notes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {notes.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          <p className="text-muted-foreground mb-6 text-sm">No notes yet in this group.</p>
        )}

        {isAddingHere ? (
          <div className="bg-accent/30 p-4 rounded-xl space-y-4 border border-border">
            <Input
              placeholder="Class Label (e.g. Class – 1)"
              value={newNoteClassLabel}
              onChange={(e) => onSetClassLabel(e.target.value)}
            />
            <Textarea
              placeholder="Note content..."
              value={newNoteContent}
              onChange={(e) => onSetContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {newNotePhotoUrl ? "Change Photo" : "Add Photo"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onPhotoUpload}
                />
                {newNotePhotoUrl && <span className="text-xs text-muted-foreground">Photo attached</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                <Button size="sm" onClick={onSave} disabled={!newNoteClassLabel.trim() || isSaving}>
                  Save Note
                </Button>
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
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(note.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteStep, setDeleteStep] = useState(0);

  const handleUpdate = () => {
    updateNote.mutate(
      { id: note.id, data: { classLabel: editLabel, content: editContent, photoUrl: editPhotoUrl } },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteNote.mutate(
      { id: note.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        },
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-background p-4 rounded-xl border border-primary/20 space-y-3">
        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[80px]"
        />
        {editPhotoUrl && (
          <div className="relative rounded-md overflow-hidden h-24 mb-2">
            <img src={editPhotoUrl} alt="Note attachment" className="object-cover w-full h-full" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8">
            <ImageIcon className="w-3.5 h-3.5 mr-2" /> Photo
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => {
              setIsEditing(false);
              setEditLabel(note.classLabel);
              setEditContent(note.content || "");
              setEditPhotoUrl(note.photoUrl);
            }}>Cancel</Button>
            <Button size="sm" className="h-8" onClick={handleUpdate} disabled={!editLabel.trim()}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm group">
        <div className="flex justify-between items-start mb-2">
          <div className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {note.classLabel}
          </div>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setIsEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteStep(1)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {note.content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{note.content}</p>
        )}
        {note.photoUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border/50 max-h-48">
            <img src={note.photoUrl} alt="Note attachment" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-xs text-muted-foreground/50 mt-3 pt-3 border-t border-border/50">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Double-confirmation delete dialog */}
      <AlertDialog open={deleteStep === 1} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              "{note.classLabel}" will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep(2)} className="bg-destructive text-white hover:bg-destructive/90">
              Yes, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 2} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This note and any photos attached to it will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep(0)}>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleteStep(0); handleDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
