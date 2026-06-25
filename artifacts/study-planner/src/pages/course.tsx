import { 
  useListSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useListTopics, useCreateTopic, useUpdateTopic, useDeleteTopic,
  getListSubjectsQueryKey, getListTopicsQueryKey 
} from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Pencil, Plus, Trash2, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Course() {
  const { data: subjects, isLoading: subjectsLoading } = useListSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  
  const queryClient = useQueryClient();
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    createSubject.mutate({ data: { name: newSubjectName } }, {
      onSuccess: () => {
        setNewSubjectName("");
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
      }
    });
  };

  const handleUpdateSubject = (id: number) => {
    if (!editSubjectName.trim()) return;
    updateSubject.mutate({ id, data: { name: editSubjectName } }, {
      onSuccess: () => {
        setEditingSubjectId(null);
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
      }
    });
  };

  const handleDeleteSubject = (id: number) => {
    if (confirm("Delete this subject and all its topics?")) {
      deleteSubject.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Course Outline</h1>
          <p className="text-muted-foreground mt-2">Manage your subjects and study topics.</p>
        </div>
      </div>

      <div className="flex gap-2 p-4 bg-card border border-border rounded-xl shadow-sm">
        <Input 
          placeholder="New subject name..." 
          value={newSubjectName} 
          onChange={e => setNewSubjectName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
          className="bg-background border-none focus-visible:ring-1"
        />
        <Button onClick={handleAddSubject} disabled={!newSubjectName.trim() || createSubject.isPending}>
          <Plus className="w-4 h-4 mr-2" /> Add Subject
        </Button>
      </div>

      {subjectsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : subjects?.length ? (
        <div className="space-y-4">
          {subjects.map(subject => (
            <SubjectCard 
              key={subject.id} 
              subject={subject} 
              isEditing={editingSubjectId === subject.id}
              editName={editSubjectName}
              setEditName={setEditSubjectName}
              onStartEdit={() => { setEditingSubjectId(subject.id); setEditSubjectName(subject.name); }}
              onCancelEdit={() => setEditingSubjectId(null)}
              onSaveEdit={() => handleUpdateSubject(subject.id)}
              onDelete={() => handleDeleteSubject(subject.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No subjects added yet.</p>
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subject, isEditing, editName, setEditName, onStartEdit, onCancelEdit, onSaveEdit, onDelete }: any) {
  const { data: topics } = useListTopics({ subjectId: subject.id });
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    createTopic.mutate({ data: { subjectId: subject.id, name: newTopicName } }, {
      onSuccess: () => {
        setNewTopicName("");
        queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId: subject.id }) });
      }
    });
  };

  const handleToggleTopic = (id: number, completed: boolean) => {
    updateTopic.mutate({ id, data: { completed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId: subject.id }) });
      }
    });
  };

  const handleDeleteTopic = (id: number) => {
    if (confirm("Delete this topic?")) {
      deleteTopic.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ subjectId: subject.id }) });
        }
      });
    }
  };

  return (
    <Card className="shadow-sm overflow-hidden border-primary/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="flex items-center flex-1 gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full w-8 h-8">
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Input value={editName} onChange={e => setEditName(e.target.value)} autoFocus className="h-8" />
                <Button size="sm" onClick={onSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
              </div>
            ) : (
              <div className="font-semibold text-lg flex-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                {subject.name}
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStartEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <CollapsibleContent className="p-4 pt-0">
          <div className="space-y-3 pl-11">
            {topics?.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox 
                    checked={topic.completed} 
                    onCheckedChange={(c) => handleToggleTopic(topic.id, c === true)}
                    className="rounded-full w-5 h-5 border-muted-foreground/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <span className={`text-sm transition-all ${topic.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {topic.name}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  onClick={() => handleDeleteTopic(topic.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 mt-4 max-w-md">
              <Input 
                placeholder="Add a topic..." 
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="secondary" onClick={handleAddTopic} disabled={!newTopicName.trim() || createTopic.isPending}>
                Add
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}