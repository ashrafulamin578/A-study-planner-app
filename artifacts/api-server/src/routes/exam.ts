import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const exams = await db.select().from(examsTable).limit(1);
  if (exams.length === 0) {
    return res.status(404).json({ error: "No exam set" });
  }
  const e = exams[0];
  res.json({
    id: e.id,
    name: e.name,
    examDate: e.examDate,
    semesterCount: e.semesterCount,
    createdAt: e.createdAt.toISOString(),
  });
});

router.put("/", async (req, res) => {
  const { name, examDate, semesterCount } = req.body as {
    name: string;
    examDate: string;
    semesterCount: number;
  };
  const existing = await db.select().from(examsTable).limit(1);
  if (existing.length > 0) {
    const updated = await db
      .update(examsTable)
      .set({ name, examDate, semesterCount })
      .where(eq(examsTable.id, existing[0].id))
      .returning();
    const e = updated[0];
    return res.json({
      id: e.id,
      name: e.name,
      examDate: e.examDate,
      semesterCount: e.semesterCount,
      createdAt: e.createdAt.toISOString(),
    });
  }
  const created = await db
    .insert(examsTable)
    .values({ name, examDate, semesterCount })
    .returning();
  const e = created[0];
  res.json({
    id: e.id,
    name: e.name,
    examDate: e.examDate,
    semesterCount: e.semesterCount,
    createdAt: e.createdAt.toISOString(),
  });
});

export default router;
