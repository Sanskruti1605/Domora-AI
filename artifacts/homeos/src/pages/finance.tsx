import { useState } from "react";
import {
  useListBills,
  useCreateBill,
  useUpdateBill,
  useListExpenses,
  useCreateExpense,
  getListBillsQueryKey,
  getListExpensesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Check, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Finance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: bills, isLoading: isLoadingBills } = useListBills();
  const { data: expenses, isLoading: isLoadingExpenses } = useListExpenses();

  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    name: "",
    provider: "",
    category: "electricity",
    amount: "",
    dueDate: new Date().toISOString().split('T')[0],
    status: "unpaid"
  });

  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    category: "other",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  const createExpense = useCreateExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        setIsNewExpenseOpen(false);
        toast({ title: "Expense logged", description: "The expense has been successfully tracked." });
      }
    }
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      data: {
        ...newExpense,
        amount: Number(newExpense.amount),
        date: new Date(newExpense.date).toISOString()
      }
    });
  };

  const createBill = useCreateBill({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        setIsNewBillOpen(false);
        toast({ title: "Bill created", description: "The bill has been added to your log." });
      }
    }
  });

  const updateBill = useUpdateBill({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
      }
    }
  });

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    createBill.mutate({
      data: {
        ...newBill,
        amount: Number(newBill.amount),
        dueDate: new Date(newBill.dueDate).toISOString()
      }
    });
  };

  const markAsPaid = (id: number) => {
    updateBill.mutate({ id, data: { status: "paid" } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Finance</h1>
          <p className="text-muted-foreground mt-1">Bills, expenses, and capital outflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bills Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Accounts Payable</CardTitle>
              <CardDescription>Recurring and pending bills</CardDescription>
            </div>
            <Dialog open={isNewBillOpen} onOpenChange={setIsNewBillOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Bill</DialogTitle>
                  <DialogDescription>Register a new bill to track its status.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBill} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Bill Name</Label>
                      <Input id="name" required value={newBill.name} onChange={e => setNewBill({...newBill, name: e.target.value})} placeholder="e.g. June Power" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Input id="provider" required value={newBill.provider} onChange={e => setNewBill({...newBill, provider: e.target.value})} placeholder="e.g. PG&E" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input id="amount" type="number" step="0.01" required value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input id="dueDate" type="date" required value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newBill.category} onValueChange={v => setNewBill({...newBill, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electricity">Electricity</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="internet">Internet</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsNewBillOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createBill.isPending}>Add Bill</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingBills ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Bill</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No active bills.</TableCell>
                    </TableRow>
                  )}
                  {bills?.map(bill => (
                    <TableRow key={bill.id} className="border-border/50">
                      <TableCell>
                        <div className="font-medium text-foreground">{bill.name}</div>
                        <div className="text-xs text-muted-foreground">{bill.provider}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {bill.status === "paid" ? (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Paid</Badge>
                          ) : bill.status === "overdue" ? (
                            <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">Overdue</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">Pending</Badge>
                          )}
                          <span className="text-xs font-mono">{format(parseISO(bill.dueDate), 'MMM d, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${bill.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {bill.status !== "paid" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => markAsPaid(bill.id)}
                            disabled={updateBill.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Expense Log</CardTitle>
              <CardDescription>Recent recorded outflows</CardDescription>
            </div>
            <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Log Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Expense</DialogTitle>
                  <DialogDescription>Record a new outflow manually.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateExpense} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="e.g. Plumber visit" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expAmount">Amount ($)</Label>
                      <Input id="expAmount" type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expDate">Date</Label>
                      <Input id="expDate" type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expCategory">Category</Label>
                    <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="groceries">Groceries</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsNewExpenseOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createExpense.isPending}>Save Expense</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingExpenses ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No recent expenses.</TableCell>
                    </TableRow>
                  )}
                  {expenses?.map(expense => (
                    <TableRow key={expense.id} className="border-border/50">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(parseISO(expense.date), 'MMM d')}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize text-muted-foreground">{expense.category}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
