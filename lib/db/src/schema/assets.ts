import { pgTable, serial, text, doublePrecision, date, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  purchaseDate: date("purchase_date", { mode: "string" }),
  purchasePrice: doublePrecision("purchase_price"),
  serialNumber: text("serial_number"),
  warrantyExpiryDate: date("warranty_expiry_date", { mode: "string" }),
  status: text("status").notNull().default("good"),
  lastServiceDate: date("last_service_date", { mode: "string" }),
  nextServiceDate: date("next_service_date", { mode: "string" }),
  failureProbability: real("failure_probability"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
