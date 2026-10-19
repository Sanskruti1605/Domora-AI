import { useState } from "react";
import {
  useListDocuments,
  useCreateDocument,
  useQueryDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Upload, Bot, CornerDownRight, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Documents() {
  const queryClient = useQueryClient();
  const { data: documents, isLoading } = useListDocuments();
  const [activeDoc, setActiveDoc] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    type: "manual",
    content: "",
    tags: ""
  });

  const createDoc = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setIsUploadOpen(false);
      }
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    createDoc.mutate({
      data: {
        name: newDoc.name,
        type: newDoc.type,
        content: newDoc.content,
        tags: newDoc.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    });
  };

  const queryDoc = useQueryDocument();

  const handleAsk = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!question.trim()) return;
    queryDoc.mutate({ id, data: { question } });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Vault</h1>
          <p className="text-muted-foreground mt-1">AI-indexed manuals, warranties, and contracts.</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Upload to Vault</DialogTitle>
              <DialogDescription>Add a new document for AI indexing and retrieval.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input required value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} placeholder="e.g. HVAC Manual" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newDoc.type} onValueChange={v => setNewDoc({...newDoc, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Content</Label>
                <Textarea required value={newDoc.content} onChange={e => setNewDoc({...newDoc, content: e.target.value})} placeholder="Paste document content here for indexing..." className="h-32" />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={newDoc.tags} onChange={e => setNewDoc({...newDoc, tags: e.target.value})} placeholder="e.g. hvac, maintenance, home" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createDoc.isPending}>
                  {createDoc.isPending ? 'Indexing...' : 'Save & Index'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="md:col-span-1 border border-border/50 rounded-xl bg-card/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vault..." className="pl-9 bg-background/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : documents?.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setActiveDoc(doc.id); queryDoc.reset(); setQuestion(""); }}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                  activeDoc === doc.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-md ${activeDoc === doc.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{doc.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 h-4 border-border/50">{doc.type}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{format(parseISO(doc.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 border border-border/50 rounded-xl bg-card/50 flex flex-col overflow-hidden relative">
          {activeDoc ? (() => {
            const doc = documents?.find(d => d.id === activeDoc);
            return (
              <>
                <div className="p-6 border-b border-border/50 flex-shrink-0">
                  <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5 uppercase tracking-widest">{doc?.type}</Badge>
                  <h2 className="text-2xl font-bold">{doc?.name}</h2>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {doc?.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50 text-muted-foreground">{tag}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 text-sm text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                  {doc?.summary ? (
                    <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 text-foreground">
                      <div className="flex items-center gap-2 font-bold mb-2 font-sans">
                        <Bot className="h-4 w-4 text-primary" /> AI Summary
                      </div>
                      {doc.summary}
                    </div>
                  ) : null}
                  {doc?.content}
                </div>

                <div className="p-4 border-t border-border/50 bg-secondary/30 flex-shrink-0">
                  <div className="max-w-3xl mx-auto">
                    {queryDoc.isSuccess && queryDoc.data && (
                      <div className="mb-4 p-4 rounded-lg bg-card border border-primary/30 shadow-lg">
                        <div className="flex items-center gap-2 font-bold mb-2 text-primary text-sm">
                          <Bot className="h-4 w-4" /> Insight
                        </div>
                        <p className="text-sm text-foreground">{queryDoc.data.answer}</p>
                      </div>
                    )}
                    
                    <form onSubmit={(e) => handleAsk(e, doc!.id)} className="relative">
                      <Bot className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={`Ask AI about this ${doc?.type}...`} 
                        className="pl-9 pr-24 py-6 bg-background/80 focus-visible:ring-primary shadow-sm"
                        disabled={queryDoc.isPending}
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="absolute right-2 top-2 h-8"
                        disabled={!question.trim() || queryDoc.isPending}
                      >
                        {queryDoc.isPending ? 'Analyzing...' : <><CornerDownRight className="h-3 w-3 mr-1" /> Ask</>}
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <Bot className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">AI Document Analysis</h3>
              <p className="text-sm max-w-sm">
                Select a document from the vault to view its contents, AI-generated summary, and ask questions about specific clauses, warranty limits, or terms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
