import { useState } from "react";
import {
  useListAssets,
  useCreateAsset,
  useUpdateAsset,
  getListAssetsQueryKey,
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
import { format, parseISO } from "date-fns";
import { Shield, Wrench, AlertTriangle, CheckCircle2, Plus } from "lucide-react";

export default function Assets() {
  const queryClient = useQueryClient();
  const { data: assets, isLoading } = useListAssets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "appliance",
    purchaseDate: "",
    purchasePrice: "",
    serialNumber: "",
    warrantyExpiryDate: "",
    status: "good",
    nextServiceDate: ""
  });

  const createAsset = useCreateAsset({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        setIsOpen(false);
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate({
      data: {
        ...newAsset,
        purchasePrice: newAsset.purchasePrice ? Number(newAsset.purchasePrice) : undefined,
        purchaseDate: newAsset.purchaseDate ? new Date(newAsset.purchaseDate).toISOString() : undefined,
        warrantyExpiryDate: newAsset.warrantyExpiryDate ? new Date(newAsset.warrantyExpiryDate).toISOString() : undefined,
        nextServiceDate: newAsset.nextServiceDate ? new Date(newAsset.nextServiceDate).toISOString() : undefined,
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'good': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'good': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Asset Registry</h1>
          <p className="text-muted-foreground mt-1">Hardware, appliances, and lifecycle management.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Asset</DialogTitle>
              <DialogDescription>Add a new appliance or system to the registry.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Name</Label>
                  <Input required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="e.g. HVAC System" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newAsset.category} onValueChange={v => setNewAsset({...newAsset, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appliance">Appliance</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Date (Optional)</Label>
                  <Input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Price ($) (Optional)</Label>
                  <Input type="number" step="0.01" value={newAsset.purchasePrice} onChange={e => setNewAsset({...newAsset, purchasePrice: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warranty Expiry (Optional)</Label>
                  <Input type="date" value={newAsset.warrantyExpiryDate} onChange={e => setNewAsset({...newAsset, warrantyExpiryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Next Service (Optional)</Label>
                  <Input type="date" value={newAsset.nextServiceDate} onChange={e => setNewAsset({...newAsset, nextServiceDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Serial Number (Optional)</Label>
                <Input value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="SN-XXXXX" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAsset.isPending}>Register Asset</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </>
        ) : assets?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No assets registered.
          </div>
        ) : (
          assets?.map((asset) => (
            <Card key={asset.id} className="bg-card/50 border-border/50 flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-border/50 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-2 py-0 h-5">
                      {asset.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{asset.name}</CardTitle>
                  {asset.serialNumber && (
                    <CardDescription className="font-mono text-xs mt-1 uppercase tracking-widest">
                      SN: {asset.serialNumber}
                    </CardDescription>
                  )}
                </div>
                <div className={`p-2 rounded-full flex items-center justify-center ${
                  asset.status === 'good' ? 'bg-emerald-500/10' :
                  asset.status === 'warning' ? 'bg-amber-500/10' :
                  'bg-destructive/10'
                }`}>
                  {getStatusIcon(asset.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Warranty
                    </div>
                    <div className="font-mono text-sm">
                      {asset.warrantyExpiryDate ? format(parseISO(asset.warrantyExpiryDate), 'MMM d, yyyy') : 'No Warranty'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Next Service
                    </div>
                    <div className="font-mono text-sm">
                      {asset.nextServiceDate ? format(parseISO(asset.nextServiceDate), 'MMM d, yyyy') : 'Not Scheduled'}
                    </div>
                  </div>
                </div>

                {asset.failureProbability !== null && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground uppercase tracking-wider">Failure Probability</span>
                      <span className="font-mono font-bold">{asset.failureProbability}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          (asset.failureProbability ?? 0) < 30 ? 'bg-emerald-500' :
                          (asset.failureProbability ?? 0) < 70 ? 'bg-amber-500' :
                          'bg-destructive'
                        }`}
                        style={{ width: `${asset.failureProbability}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
