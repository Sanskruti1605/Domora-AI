import {
  useGetDashboardSummary,
  useGetDashboardAlerts,
  useGetDashboardUpcoming,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  CreditCard, 
  Clock, 
  Activity, 
  FileText, 
  Zap,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts();
  const { data: upcoming, isLoading: isLoadingUpcoming } = useGetDashboardUpcoming();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mission Control</h1>
          <p className="text-muted-foreground mt-1">System status and intelligence overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="animate-pulse">System Online</Badge>
        </div>
      </div>

      {/* Alerts Banner */}
      {!isLoadingAlerts && alerts && alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border flex items-start gap-4 ${
                alert.type === 'critical' ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                'bg-primary/10 border-primary/50 text-primary'
              }`}
            >
              {alert.type === 'critical' ? <AlertTriangle className="h-5 w-5 shrink-0" /> :
               alert.type === 'warning' ? <AlertTriangle className="h-5 w-5 shrink-0" /> :
               <Info className="h-5 w-5 shrink-0" />}
              <div className="flex-1">
                <p className="font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Output</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold font-mono text-foreground">${summary?.totalMonthlyExpenses.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Current billing cycle</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-foreground">{summary?.pendingBills}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asset Health</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-foreground">{summary?.totalAssets}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.warningAssets ? `${summary.warningAssets} warnings active` : 'All systems nominal'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Document Vault</CardTitle>
            <FileText className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-mono text-foreground">{summary?.totalDocuments}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Securely indexed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Chart */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
            <CardDescription>Expenses distributed by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingSummary ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.expensesByCategory || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="category" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    cursor={{fill: '#ffffff05'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Timeline */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Horizon</CardTitle>
            <CardDescription>Approaching deadlines & events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUpcoming ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No upcoming events.</p>
                ) : (
                  upcoming?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-md bg-secondary/50 border border-border/50">
                      <div className={`p-2 rounded-full ${
                        item.daysUntil <= 3 ? 'bg-destructive/20 text-destructive' :
                        item.daysUntil <= 7 ? 'bg-amber-500/20 text-amber-500' :
                        'bg-primary/20 text-primary'
                      }`}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.daysUntil === 0 ? 'Today' : `In ${item.daysUntil} days`}
                          </span>
                        </div>
                      </div>
                      {item.amount && (
                        <div className="text-sm font-bold font-mono text-foreground whitespace-nowrap">
                          ${item.amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
