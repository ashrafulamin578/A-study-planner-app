import { 
  useListResources, useCreateResource, useUpdateResource, useDeleteResource,
  getListResourcesQueryKey 
} from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ExternalLink, PlaySquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Resources() {
  const { data: resources, isLoading } = useListResources();
  const createResource = useCreateResource();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsPaid, setNewIsPaid] = useState(false);

  const handleAdd = () => {
    if (!newSubjectName.trim() || !newTopicName.trim() || !newUrl.trim()) return;
    
    createResource.mutate({
      data: {
        subjectName: newSubjectName,
        topicName: newTopicName,
        url: newUrl,
        isPaid: newIsPaid
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setNewSubjectName("");
        setNewTopicName("");
        setNewUrl("");
        setNewIsPaid(false);
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Free Classes & Resources</h1>
          <p className="text-muted-foreground mt-2">External links, video lectures, and helpful material.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Subject Name</Label>
                <Input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Physics, Math..." />
              </div>
              <div className="grid gap-2">
                <Label>Topic</Label>
                <Input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} placeholder="Quantum Mechanics..." />
              </div>
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={newIsPaid} onCheckedChange={setNewIsPaid} id="paid-mode" />
                <Label htmlFor="paid-mode">This is a paid resource</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} disabled={!newSubjectName || !newTopicName || !newUrl || createResource.isPending}>
                Save Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!resources || resources.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
          <PlaySquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-foreground/70 mb-1">No resources added yet</p>
          <p>Keep track of helpful YouTube videos, articles, and courses here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }: { resource: any }) {
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editSubjectName, setEditSubjectName] = useState(resource.subjectName);
  const [editTopicName, setEditTopicName] = useState(resource.topicName);
  const [editUrl, setEditUrl] = useState(resource.url);
  const [editIsPaid, setEditIsPaid] = useState(resource.isPaid);

  const handleUpdate = () => {
    updateResource.mutate({
      id: resource.id,
      data: {
        subjectName: editSubjectName,
        topicName: editTopicName,
        url: editUrl,
        isPaid: editIsPaid
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this resource link?")) {
      deleteResource.mutate({ id: resource.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        }
      });
    }
  };

  if (isEditing) {
    return (
      <Card className="shadow-sm border-primary/20">
        <CardContent className="p-4 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input value={editSubjectName} onChange={e => setEditSubjectName(e.target.value)} placeholder="Subject" />
            <Input value={editTopicName} onChange={e => setEditTopicName(e.target.value)} placeholder="Topic" />
          </div>
          <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="URL" type="url" />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Switch checked={editIsPaid} onCheckedChange={setEditIsPaid} />
              <Label className="text-sm">Paid Resource</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm group overflow-hidden border-border/60 hover:border-primary/30 transition-colors">
      <CardContent className="p-0">
        <div className="flex items-stretch justify-between p-4 sm:p-5">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">{resource.subjectName}</span>
              <Badge variant={resource.isPaid ? "secondary" : "outline"} className="text-[10px] uppercase font-bold py-0.5 px-2">
                {resource.isPaid ? "Paid" : "Free"}
              </Badge>
            </div>
            <h3 className="text-lg font-medium text-foreground truncate">{resource.topicName}</h3>
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-2 inline-flex truncate max-w-full"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{resource.url}</span>
            </a>
          </div>
          <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-border/50">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}