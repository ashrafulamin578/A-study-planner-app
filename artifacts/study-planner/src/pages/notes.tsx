import { 
  useListSubjects, useListNotes, useCreateNote, useUpdateNote, useDeleteNote,
  getListNotesQueryKey 
} from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Image as ImageIcon, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notes() {
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  const { data: allNotes, isLoading: notesLoading } = useListNotes();

  const createNote = useCreateNote();
  
  const queryClient = useQueryClient();

  const [newNoteSubjectId, setNewNoteSubjectId] = useState<number | null>(null);
  const [newNoteClassLabel, setNewNoteClassLabel] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNotePhotoUrl, setNewNotePhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewNotePhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = (subjectId: number) => {
    if (!newNoteClassLabel.trim()) return;
    createNote.mutate({ 
      data: { 
        subjectId, 
        classLabel: newNoteClassLabel,
        content: newNoteContent || null,
        photoUrl: newNotePhotoUrl
      } 
    }, {
      onSuccess: () => {
        setNewNoteSubjectId(null);
        setNewNoteClassLabel("");
        setNewNoteContent("");
        setNewNotePhotoUrl(null);
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      }
    });
  };

  if (subjectsLoading || notesLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground mt-2">Your class notes and study materials.</p>
      </div>

      {!subjects || subjects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl">
          <p>Please add a subject in Course Outline first.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {subjects.map(subject => {
            const subjectNotes = allNotes?.filter(n => n.subjectId === subject.id) || [];
            
            return (
              <Card key={subject.id} className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-xl text-primary">{subject.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {subjectNotes.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                      {subjectNotes.map(note => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground mb-6 text-sm">No notes added for this subject yet.</p>
                  )}

                  {newNoteSubjectId === subject.id ? (
                    <div className="bg-accent/30 p-4 rounded-xl space-y-4 border border-border">
                      <Input 
                        placeholder="Class Label (e.g. Class - 1)" 
                        value={newNoteClassLabel}
                        onChange={e => setNewNoteClassLabel(e.target.value)}
                      />
                      <Textarea 
                        placeholder="Note content..." 
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {newNotePhotoUrl ? "Change Photo" : "Add Photo"}
                          </Button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                          {newNotePhotoUrl && <span className="text-xs text-muted-foreground">Photo attached</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setNewNoteSubjectId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => handleAddNote(subject.id)} disabled={!newNoteClassLabel.trim() || createNote.isPending}>
                            Save Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                      setNewNoteSubjectId(subject.id);
                      setNewNoteClassLabel(`Class - ${subjectNotes.length + 1}`);
                      setNewNoteContent("");
                      setNewNotePhotoUrl(null);
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
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

  const handleUpdate = () => {
    updateNote.mutate({
      id: note.id,
      data: {
        classLabel: editLabel,
        content: editContent,
        photoUrl: editPhotoUrl
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this note?")) {
      deleteNote.mutate({ id: note.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        }
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-background p-4 rounded-xl border border-primary/20 space-y-3">
        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} />
        <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[80px]" />
        
        {editPhotoUrl && (
          <div className="relative rounded-md overflow-hidden h-24 mb-2">
            <img src={editPhotoUrl} alt="Note attachment" className="object-cover w-full h-full" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8">
            <ImageIcon className="w-3.5 h-3.5 mr-2" />
            Photo
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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
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
  );
}