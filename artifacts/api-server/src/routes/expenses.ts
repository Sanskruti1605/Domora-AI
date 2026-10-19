import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  CreateExpenseBody,
  DeleteExpenseParams,
  ListExpensesResponse,
  CreateExpenseResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/expenses", async (_req, res): Promise<void> => {
  const expenses = await db.select().from(expensesTable).orderBy(expensesTable.date);
  res.json(ListExpensesResponse.parse(expenses));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [expense] = await db.insert(expensesTable).values(parsed.data).returning();
  res.status(201).json(CreateExpenseResponse.parse(expense));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [expense] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning();
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
