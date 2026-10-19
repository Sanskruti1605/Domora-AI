import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  CreateDocumentBody,
  DeleteDocumentParams,
  QueryDocumentParams,
  QueryDocumentBody,
  ListDocumentsResponse,
  CreateDocumentResponse,
  QueryDocumentResponse,
} from "@workspace/api-zod";
import { ai } from "../lib/gemini";

const router: IRouter = Router();

router.get("/documents", async (_req, res): Promise<void> => {
  const docs = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);
  res.json(ListDocumentsResponse.parse(docs));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Auto-generate summary via Gemini
  let summary: string | null = null;
  try {
    const summaryResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize this document in 2-3 sentences. Document name: "${parsed.data.name}" (type: ${parsed.data.type})\n\n${parsed.data.content.slice(0, 3000)}`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 256 },
    });
    summary = summaryResponse.text ?? null;
  } catch {
    // Summary generation is best-effort
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({ ...parsed.data, summary })
    .returning();
  res.status(201).json(CreateDocumentResponse.parse(doc));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/documents/:id/query", async (req, res): Promise<void> => {
  const params = QueryDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = QueryDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const prompt = `You are a helpful assistant that answers questions about documents.

Document: "${doc.name}" (type: ${doc.type})
Content:
${doc.content.slice(0, 8000)}

Question: ${parsed.data.question}

Answer the question based strictly on the document content. If the answer is not in the document, say so clearly. Cite specific parts of the document in your answer.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const answer = response.text ?? "I could not generate an answer.";

  res.json(
    QueryDocumentResponse.parse({
      answer,
      sources: [`${doc.name} (${doc.type})`],
    }),
  );
});

export default router;
