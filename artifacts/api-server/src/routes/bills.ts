import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, billsTable } from "@workspace/db";
import {
  CreateBillBody,
  UpdateBillBody,
  GetBillParams,
  UpdateBillParams,
  DeleteBillParams,
  ListBillsResponse,
  GetBillResponse,
  CreateBillResponse,
  UpdateBillResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bills", async (req, res): Promise<void> => {
  const bills = await db.select().from(billsTable).orderBy(billsTable.dueDate);
  res.json(ListBillsResponse.parse(bills));
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [bill] = await db.insert(billsTable).values(parsed.data).returning();
  res.status(201).json(CreateBillResponse.parse(bill));
});

router.get("/bills/:id", async (req, res): Promise<void> => {
  const params = GetBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, params.data.id));
  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  res.json(GetBillResponse.parse(bill));
});

router.patch("/bills/:id", async (req, res): Promise<void> => {
  const params = UpdateBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [bill] = await db
    .update(billsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(billsTable.id, params.data.id))
    .returning();
  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  res.json(UpdateBillResponse.parse(bill));
});

router.delete("/bills/:id", async (req, res): Promise<void> => {
  const params = DeleteBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [bill] = await db.delete(billsTable).where(eq(billsTable.id, params.data.id)).returning();
  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
