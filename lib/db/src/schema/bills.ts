import { pgTable, serial, text, doublePrecision, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  category: text("category").notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  billingPeriod: text("billing_period"),
  status: text("status").notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;
