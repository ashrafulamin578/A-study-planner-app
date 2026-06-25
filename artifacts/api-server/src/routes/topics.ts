import { Router } from "express";
import { db } from "@workspace/db";
import { topicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
  const rows = subjectId
    ? await db.select().from(topicsTable).where(eq(topicsTable.subjectId, subjectId)).orderBy(topicsTable.createdAt)
    : await db.select().from(topicsTable).orderBy(topicsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { subjectId, name, completed } = req.body as {
    subjectId: number;
    name: string;
    completed?: boolean;
  };
  const created = await db
    .insert(topicsTable)
    .values({ subjectId, name, completed: completed ?? false })
    .returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, completed } = req.body as { name?: string; completed?: boolean };
  const updated = await db
    .update(topicsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(completed !== undefined && { completed }),
    })
    .where(eq(topicsTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(topicsTable).where(eq(topicsTable.id, id));
  res.status(204).send();
});

export default router;
