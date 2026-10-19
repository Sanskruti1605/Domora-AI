import { useState } from "react";
import {
  useListSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  getListSubscriptionsQueryKey,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Activity, Ban, CheckCircle, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading } = useListSubscriptions();
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newSub, setNewSub] = useState({
    name: "",
    provider: "",
    amount: "",
    frequency: "monthly",
    nextBillingDate: new Date().toISOString().split('T')[0],
    status: "active",
    usageLevel: "medium"
  });

  const createSub = useCreateSubscription({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        setIsNewOpen(false);
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSub.mutate({
      data: {
        ...newSub,
        amount: Number(newSub.amount),
        nextBillingDate: new Date(newSub.nextBillingDate).toISOString()
      }
    });
  };

  const updateSub = useUpdateSubscription({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() })
    }
  });

  const toggleStatus = (id: number, currentStatus: string) => {
    updateSub.mutate({
      id,
      data: { status: currentStatus === 'active' ? 'cancelled' : 'active' }
    });
  };

  const getUsageColor = (level: string) => {
    if (level === 'high') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (level === 'medium') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-destructive bg-destructive/10 border-destructive/20';
  };

  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const monthlyTotal = subscriptions?.filter(s => s.status === 'active').reduce((acc, sub) => {
    if (sub.frequency === 'yearly') return acc + sub.amount / 12;
    if (sub.frequency === 'weekly') return acc + sub.amount * 4;
    return acc + sub.amount;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Recurring services and software.</p>
        </div>
        <div className="text-right flex items-center gap-6">
          <div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Monthly Burn</div>
            <div className="text-2xl font-bold font-mono text-primary">${monthlyTotal.toFixed(2)}</div>
          </div>
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subscription</DialogTitle>
                <DialogDescription>Track a new recurring software or service.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} placeholder="e.g. Netflix" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input id="provider" required value={newSub.provider} onChange={e => setNewSub({...newSub, provider: e.target.value})} placeholder="e.g. Netflix Inc." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input id="amount" type="number" step="0.01" required value={newSub.amount} onChange={e => setNewSub({...newSub, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextBill">Next Billing Date</Label>
                    <Input id="nextBill" type="date" required value={newSub.nextBillingDate} onChange={e => setNewSub({...newSub, nextBillingDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={newSub.frequency} onValueChange={v => setNewSub({...newSub, frequency: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Usage Level</Label>
                    <Select value={newSub.usageLevel} onValueChange={v => setNewSub({...newSub, usageLevel: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsNewOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSub.isPending}>Add Subscription</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </>
        ) : subscriptions?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No subscriptions found.
          </div>
        ) : (
          subscriptions?.map((sub) => (
            <Card key={sub.id} className={`bg-card/50 border-border/50 relative overflow-hidden transition-all ${sub.status === 'cancelled' ? 'opacity-50 grayscale-[0.5]' : ''}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${sub.status === 'active' ? 'bg-primary' : 'bg-muted'}`} />
              <CardHeader className="pb-2 pl-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{sub.name}</CardTitle>
                    <CardDescription>{sub.provider}</CardDescription>
                  </div>
                  <Badge variant="outline" className={`capitalize ${getUsageColor(sub.usageLevel)}`}>
                    {sub.usageLevel} Usage
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pl-6 pb-2">
                <div className="flex items-end gap-2 mt-4">
                  <span className="text-3xl font-bold font-mono text-foreground">${sub.amount.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground mb-1 capitalize">/ {sub.frequency}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <Activity className="h-4 w-4" /> 
                  Next bill: {format(parseISO(sub.nextBillingDate), 'MMM d, yyyy')}
                </div>
              </CardContent>
              <CardFooter className="pl-6 pt-4 border-t border-border/50 mt-4 flex justify-between">
                <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="capitalize bg-transparent border-border/50 text-foreground">
                  {sub.status}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={sub.status === 'active' ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10'}
                  onClick={() => toggleStatus(sub.id, sub.status)}
                  disabled={updateSub.isPending}
                >
                  {sub.status === 'active' ? <><Ban className="h-4 w-4 mr-2" /> Cancel</> : <><CheckCircle className="h-4 w-4 mr-2" /> Reactivate</>}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
