import { Router } from "express";
import { db } from "@workspace/db";
import { subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await db.select().from(subjectsTable).orderBy(subjectsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { name } = req.body as { name: string };
  const created = await db.insert(subjectsTable).values({ name }).returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body as { name?: string };
  const updated = await db
    .update(subjectsTable)
    .set({ ...(name !== undefined && { name }) })
    .where(eq(subjectsTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.status(204).send();
});

export default router;
