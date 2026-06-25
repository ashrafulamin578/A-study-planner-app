import { Router } from "express";
import { db } from "@workspace/db";
import { resourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const subjectName = req.query.subjectName as string | undefined;
  const rows = subjectName
    ? await db.select().from(resourcesTable).where(eq(resourcesTable.subjectName, subjectName)).orderBy(resourcesTable.createdAt)
    : await db.select().from(resourcesTable).orderBy(resourcesTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { subjectName, topicName, url, isPaid } = req.body as {
    subjectName: string;
    topicName: string;
    url: string;
    isPaid?: boolean;
  };
  const created = await db
    .insert(resourcesTable)
    .values({ subjectName, topicName, url, isPaid: isPaid ?? false })
    .returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { subjectName, topicName, url, isPaid } = req.body as {
    subjectName?: string;
    topicName?: string;
    url?: string;
    isPaid?: boolean;
  };
  const updated = await db
    .update(resourcesTable)
    .set({
      ...(subjectName !== undefined && { subjectName }),
      ...(topicName !== undefined && { topicName }),
      ...(url !== undefined && { url }),
      ...(isPaid !== undefined && { isPaid }),
    })
    .where(eq(resourcesTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
  res.status(204).send();
});

export default router;
