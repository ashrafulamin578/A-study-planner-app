import { Router } from "express";
import { db } from "@workspace/db";
import { routineItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const day = req.query.day as string | undefined;
  const rows = day
    ? await db.select().from(routineItemsTable).where(eq(routineItemsTable.day, day)).orderBy(routineItemsTable.createdAt)
    : await db.select().from(routineItemsTable).orderBy(routineItemsTable.day, routineItemsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { day, subjectId, label } = req.body as {
    day: string;
    subjectId?: number | null;
    label: string;
  };
  const created = await db
    .insert(routineItemsTable)
    .values({ day, subjectId: subjectId ?? null, label })
    .returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { day, subjectId, label } = req.body as {
    day?: string;
    subjectId?: number | null;
    label?: string;
  };
  const updated = await db
    .update(routineItemsTable)
    .set({
      ...(day !== undefined && { day }),
      ...(subjectId !== undefined && { subjectId }),
      ...(label !== undefined && { label }),
    })
    .where(eq(routineItemsTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(routineItemsTable).where(eq(routineItemsTable.id, id));
  res.status(204).send();
});

export default router;
