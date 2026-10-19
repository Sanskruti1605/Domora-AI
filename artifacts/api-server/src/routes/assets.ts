import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, assetsTable } from "@workspace/db";
import {
  CreateAssetBody,
  UpdateAssetBody,
  GetAssetParams,
  UpdateAssetParams,
  DeleteAssetParams,
  ListAssetsResponse,
  GetAssetResponse,
  CreateAssetResponse,
  UpdateAssetResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/assets", async (_req, res): Promise<void> => {
  const assets = await db.select().from(assetsTable).orderBy(assetsTable.name);
  res.json(ListAssetsResponse.parse(assets));
});

router.post("/assets", async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db.insert(assetsTable).values(parsed.data).returning();
  res.status(201).json(CreateAssetResponse.parse(asset));
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, params.data.id));
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(GetAssetResponse.parse(asset));
});

router.patch("/assets/:id", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db
    .update(assetsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(assetsTable.id, params.data.id))
    .returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(UpdateAssetResponse.parse(asset));
});

router.delete("/assets/:id", async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [asset] = await db
    .delete(assetsTable)
    .where(eq(assetsTable.id, params.data.id))
    .returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
