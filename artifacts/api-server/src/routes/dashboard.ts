import { Router, type IRouter } from "express";
import { db, billsTable, expensesTable, subscriptionsTable, assetsTable, documentsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardAlertsResponse,
  GetDashboardUpcomingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [bills, expenses, subscriptions, assets, documents] = await Promise.all([
    db.select().from(billsTable),
    db.select().from(expensesTable),
    db.select().from(subscriptionsTable),
    db.select().from(assetsTable),
    db.select().from(documentsTable),
  ]);

  const totalBills = bills.length;
  const pendingBills = bills.filter((b) => b.status !== "paid").length;
  const totalAssets = assets.length;
  const warningAssets = assets.filter((a) => a.status !== "good").length;
  const totalDocuments = documents.length;
  const totalSubscriptions = subscriptions.length;

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const monthlySubscriptionCost = activeSubscriptions.reduce((sum, s) => {
    if (s.frequency === "yearly") return sum + s.amount / 12;
    if (s.frequency === "weekly") return sum + s.amount * 4.33;
    return sum + s.amount;
  }, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const monthlyBills = bills.filter((b) => b.dueDate >= startOfMonth && b.dueDate <= endOfMonth);
  const monthlyExpenses = expenses.filter((e) => e.date >= startOfMonth && e.date <= endOfMonth);

  const totalMonthlyExpenses =
    monthlyBills.reduce((sum, b) => sum + b.amount, 0) +
    monthlyExpenses.reduce((sum, e) => sum + e.amount, 0) +
    monthlySubscriptionCost;

  // Expenses by category
  const categoryMap: Record<string, number> = {};
  for (const bill of bills) {
    categoryMap[bill.category] = (categoryMap[bill.category] ?? 0) + bill.amount;
  }
  for (const expense of expenses) {
    categoryMap[expense.category] = (categoryMap[expense.category] ?? 0) + expense.amount;
  }
  const expensesByCategory = Object.entries(categoryMap).map(([category, total]) => ({
    category,
    total,
  }));

  res.json(
    GetDashboardSummaryResponse.parse({
      totalMonthlyExpenses,
      totalBills,
      pendingBills,
      totalAssets,
      warningAssets,
      totalDocuments,
      totalSubscriptions,
      monthlySubscriptionCost,
      expensesByCategory,
    }),
  );
});

router.get("/dashboard/alerts", async (_req, res): Promise<void> => {
  const [bills, assets, subscriptions] = await Promise.all([
    db.select().from(billsTable),
    db.select().from(assetsTable),
    db.select().from(subscriptionsTable),
  ]);

  const alerts: Array<{
    id: string;
    type: string;
    message: string;
    entity: string;
    entityId: number | null;
  }> = [];

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Overdue bills
  for (const bill of bills) {
    if (bill.status === "unpaid" && bill.dueDate < today) {
      alerts.push({
        id: `bill-overdue-${bill.id}`,
        type: "critical",
        message: `${bill.name} bill is overdue ($${bill.amount.toFixed(2)})`,
        entity: "bill",
        entityId: bill.id,
      });
    }
  }

  // Bills due soon
  for (const bill of bills) {
    if (bill.status === "unpaid" && bill.dueDate >= today && bill.dueDate <= in7Days) {
      alerts.push({
        id: `bill-due-soon-${bill.id}`,
        type: "warning",
        message: `${bill.name} bill due in ${Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / 86400000)} days ($${bill.amount.toFixed(2)})`,
        entity: "bill",
        entityId: bill.id,
      });
    }
  }

  // Warranties expiring soon
  for (const asset of assets) {
    if (asset.warrantyExpiryDate && asset.warrantyExpiryDate >= today && asset.warrantyExpiryDate <= in30Days) {
      const daysLeft = Math.ceil((new Date(asset.warrantyExpiryDate).getTime() - Date.now()) / 86400000);
      alerts.push({
        id: `warranty-expiring-${asset.id}`,
        type: "warning",
        message: `${asset.name} warranty expires in ${daysLeft} days`,
        entity: "asset",
        entityId: asset.id,
      });
    }
  }

  // Assets in warning/critical status
  for (const asset of assets) {
    if (asset.status === "critical") {
      alerts.push({
        id: `asset-critical-${asset.id}`,
        type: "critical",
        message: `${asset.name} requires immediate attention`,
        entity: "asset",
        entityId: asset.id,
      });
    } else if (asset.status === "warning") {
      alerts.push({
        id: `asset-warning-${asset.id}`,
        type: "warning",
        message: `${asset.name} service is due`,
        entity: "asset",
        entityId: asset.id,
      });
    }
  }

  // High failure probability assets
  for (const asset of assets) {
    if (asset.failureProbability && asset.failureProbability >= 70) {
      alerts.push({
        id: `asset-failure-${asset.id}`,
        type: "warning",
        message: `${asset.name} has ${asset.failureProbability.toFixed(0)}% failure probability — schedule inspection`,
        entity: "asset",
        entityId: asset.id,
      });
    }
  }

  // Overdue service
  for (const asset of assets) {
    if (asset.nextServiceDate && asset.nextServiceDate < today) {
      alerts.push({
        id: `service-overdue-${asset.id}`,
        type: "warning",
        message: `${asset.name} service is overdue`,
        entity: "asset",
        entityId: asset.id,
      });
    }
  }

  res.json(GetDashboardAlertsResponse.parse(alerts));
});

router.get("/dashboard/upcoming", async (_req, res): Promise<void> => {
  const [bills, assets, subscriptions] = await Promise.all([
    db.select().from(billsTable),
    db.select().from(assetsTable),
    db.select().from(subscriptionsTable),
  ]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const in90Days = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

  const items: Array<{
    id: string;
    type: string;
    name: string;
    dueDate: string;
    daysUntil: number;
    amount: number | null;
  }> = [];

  const daysBetween = (dateStr: string) =>
    Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);

  // Unpaid bills
  for (const bill of bills) {
    if (bill.status !== "paid" && bill.dueDate >= todayStr && bill.dueDate <= in90Days) {
      items.push({
        id: `bill-${bill.id}`,
        type: "bill",
        name: bill.name,
        dueDate: bill.dueDate,
        daysUntil: daysBetween(bill.dueDate),
        amount: bill.amount,
      });
    }
  }

  // Warranty expirations
  for (const asset of assets) {
    if (asset.warrantyExpiryDate && asset.warrantyExpiryDate >= todayStr && asset.warrantyExpiryDate <= in90Days) {
      items.push({
        id: `warranty-${asset.id}`,
        type: "warranty",
        name: `${asset.name} warranty`,
        dueDate: asset.warrantyExpiryDate,
        daysUntil: daysBetween(asset.warrantyExpiryDate),
        amount: null,
      });
    }
  }

  // Service dates
  for (const asset of assets) {
    if (asset.nextServiceDate && asset.nextServiceDate >= todayStr && asset.nextServiceDate <= in90Days) {
      items.push({
        id: `service-${asset.id}`,
        type: "service",
        name: `${asset.name} service`,
        dueDate: asset.nextServiceDate,
        daysUntil: daysBetween(asset.nextServiceDate),
        amount: null,
      });
    }
  }

  // Subscription renewals
  for (const sub of subscriptions) {
    if (sub.status === "active" && sub.nextBillingDate >= todayStr && sub.nextBillingDate <= in90Days) {
      items.push({
        id: `subscription-${sub.id}`,
        type: "subscription",
        name: sub.name,
        dueDate: sub.nextBillingDate,
        daysUntil: daysBetween(sub.nextBillingDate),
        amount: sub.amount,
      });
    }
  }

  // Sort by daysUntil
  items.sort((a, b) => a.daysUntil - b.daysUntil);

  res.json(GetDashboardUpcomingResponse.parse(items));
});

export default router;
