import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const date = req.query.date as string | undefined;
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;

  let rows;
  if (date && subjectId) {
    rows = await db.select().from(tasksTable).where(
      and(eq(tasksTable.date, date), eq(tasksTable.subjectId, subjectId))
    ).orderBy(tasksTable.createdAt);
  } else if (date) {
    rows = await db.select().from(tasksTable).where(eq(tasksTable.date, date)).orderBy(tasksTable.createdAt);
  } else if (subjectId) {
    rows = await db.select().from(tasksTable).where(eq(tasksTable.subjectId, subjectId)).orderBy(tasksTable.createdAt);
  } else {
    rows = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  }
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { subjectId, name, date, completed } = req.body as {
    subjectId?: number | null;
    name: string;
    date: string;
    completed?: boolean;
  };
  const created = await db
    .insert(tasksTable)
    .values({ subjectId: subjectId ?? null, name, date, completed: completed ?? false })
    .returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, completed, subjectId } = req.body as {
    name?: string;
    completed?: boolean;
    subjectId?: number | null;
  };
  const updated = await db
    .update(tasksTable)
    .set({
      ...(name !== undefined && { name }),
      ...(completed !== undefined && { completed }),
      ...(subjectId !== undefined && { subjectId }),
    })
    .where(eq(tasksTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

export default router;
