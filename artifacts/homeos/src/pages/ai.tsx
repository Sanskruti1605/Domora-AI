import { useState, useRef, useEffect } from "react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Plus, MessageSquare, CornerDownRight, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function AI() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: isLoadingConvs } = useListOpenaiConversations();
  const { data: conversation, isLoading: isLoadingMsgs } = useGetOpenaiConversation(
    activeConvId ?? 0, 
    { query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId ?? 0) } }
  );

  const createConv = useCreateOpenaiConversation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setActiveConvId(data.id);
      }
    }
  });

  const handleNewConversation = () => {
    createConv.mutate({ data: { title: "New Chat" } });
  };

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId || isStreaming) return;

    const messageToSend = input;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically add user message to cache
    queryClient.setQueryData(
      ['/api/openai/conversations', activeConvId], 
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages, 
            { id: Date.now(), role: 'user', content: messageToSend, createdAt: new Date().toISOString() }
          ]
        };
      }
    );

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/openai/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend }),
      });
      
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              break;
            }
            if (json.content) {
              finalContent += json.content;
              setStreamingContent(finalContent);
            }
          }
        }
      }

      // After streaming is done, fetch the real messages to update IDs
      queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations', activeConvId] });
      
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" /> HomeOS Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">Your household AI operating system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="lg:col-span-1 border border-border/50 rounded-xl bg-card/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <Button onClick={handleNewConversation} disabled={createConv.isPending} className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" /> New Session
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConvs ? (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                  activeConvId === conv.id ? 'bg-primary/10 border border-primary/30 text-primary' : 'text-muted-foreground hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-foreground">{conv.title}</div>
                  <div className="text-[10px] opacity-70 font-mono mt-0.5">{format(parseISO(conv.createdAt), 'MMM d, h:mm a')}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 border border-border/50 rounded-xl bg-card/50 flex flex-col overflow-hidden">
          {activeConvId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingMsgs ? (
                  <div className="space-y-6 flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Bot className="h-8 w-8 animate-pulse text-primary/50" />
                    <span className="text-sm font-mono tracking-widest uppercase">Connecting to Core...</span>
                  </div>
                ) : (
                  <>
                    {conversation?.messages.length === 0 && !streamingContent && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                        <Zap className="h-12 w-12 text-primary/30 mb-4" />
                        <p className="font-medium text-foreground text-lg">System Ready.</p>
                        <p className="text-sm max-w-sm mt-2">Ask about your bills, request a summary of your assets, or ask for general household advice.</p>
                      </div>
                    )}
                    {conversation?.messages.map((msg, i) => (
                      <div key={msg.id || i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-secondary' : 'bg-primary/20 text-primary border border-primary/30'
                        }`}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                          msg.role === 'user' 
                            ? 'bg-secondary/80 text-foreground rounded-tr-sm' 
                            : 'bg-card border border-border/50 text-foreground font-mono leading-relaxed rounded-tl-sm'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Streaming Message Box */}
                    {isStreaming && streamingContent && (
                      <div className="flex gap-4">
                        <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl max-w-[80%] text-sm bg-card border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)] text-foreground font-mono leading-relaxed rounded-tl-sm">
                          <div className="whitespace-pre-wrap">{streamingContent}<span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" /></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                  <Input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Command interface..." 
                    className="pr-24 py-6 bg-card font-mono text-sm border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    disabled={isStreaming || isLoadingMsgs}
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    className="absolute right-2 top-2 h-8"
                    disabled={!input.trim() || isStreaming || isLoadingMsgs}
                  >
                    <CornerDownRight className="h-3 w-3 mr-1.5" /> Execute
                  </Button>
                </form>
                <div className="text-center mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  HomeOS Intelligence v1.0
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select or create a session to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
