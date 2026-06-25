import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
  const rows = subjectId
    ? await db.select().from(notesTable).where(eq(notesTable.subjectId, subjectId)).orderBy(notesTable.createdAt)
    : await db.select().from(notesTable).orderBy(notesTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const { subjectId, noteGroupName, classLabel, content, photoUrl } = req.body as {
    subjectId?: number | null;
    noteGroupName?: string | null;
    classLabel: string;
    content?: string | null;
    photoUrl?: string | null;
  };
  const created = await db
    .insert(notesTable)
    .values({
      subjectId: subjectId ?? null,
      noteGroupName: noteGroupName ?? null,
      classLabel,
      content: content ?? null,
      photoUrl: photoUrl ?? null,
    })
    .returning();
  const r = created[0];
  res.status(201).json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { classLabel, content, photoUrl, subjectId, noteGroupName } = req.body as {
    classLabel?: string;
    content?: string | null;
    photoUrl?: string | null;
    subjectId?: number | null;
    noteGroupName?: string | null;
  };
  const updated = await db
    .update(notesTable)
    .set({
      ...(classLabel !== undefined && { classLabel }),
      ...(content !== undefined && { content }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(subjectId !== undefined && { subjectId }),
      ...(noteGroupName !== undefined && { noteGroupName }),
    })
    .where(eq(notesTable.id, id))
    .returning();
  if (updated.length === 0) return res.status(404).json({ error: "Not found" });
  const r = updated[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(notesTable).where(eq(notesTable.id, id));
  res.status(204).send();
});

export default router;
