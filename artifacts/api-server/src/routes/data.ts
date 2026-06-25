import { Router } from "express";
import { db } from "@workspace/db";
import {
  examsTable,
  subjectsTable,
  topicsTable,
  tasksTable,
  routineItemsTable,
  notesTable,
  resourcesTable,
  appSettingsTable,
} from "@workspace/db";

const router = Router();

router.get("/export", async (req, res) => {
  const [exams, subjects, topics, tasks, routineItems, notes, resources, settings] = await Promise.all([
    db.select().from(examsTable),
    db.select().from(subjectsTable),
    db.select().from(topicsTable),
    db.select().from(tasksTable),
    db.select().from(routineItemsTable),
    db.select().from(notesTable),
    db.select().from(resourcesTable),
    db.select().from(appSettingsTable),
  ]);
  res.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    exams,
    subjects,
    topics,
    tasks,
    routineItems,
    notes,
    resources,
    settings,
  });
});

router.post("/import", async (req, res) => {
  const { data } = req.body as { data: Record<string, unknown> };
  if (!data) return res.status(400).json({ error: "No data provided" });

  const d = data as {
    subjects?: Array<{ name: string }>;
    topics?: Array<{ subjectId: number; name: string; completed: boolean }>;
    tasks?: Array<{ subjectId?: number | null; name: string; date: string; completed: boolean }>;
    routineItems?: Array<{ day: string; subjectId?: number | null; label: string }>;
    notes?: Array<{ subjectId?: number | null; classLabel: string; content?: string | null; photoUrl?: string | null }>;
    resources?: Array<{ subjectName: string; topicName: string; url: string; isPaid: boolean }>;
    exams?: Array<{ name: string; examDate: string; semesterCount: number }>;
    settings?: Array<{ theme: string }>;
  };

  await db.delete(subjectsTable);
  if (d.subjects && d.subjects.length > 0) {
    await db.insert(subjectsTable).values(d.subjects.map((s) => ({ name: s.name })));
  }
  if (d.topics && d.topics.length > 0) {
    await db.insert(topicsTable).values(d.topics.map((t) => ({
      subjectId: t.subjectId,
      name: t.name,
      completed: t.completed ?? false,
    })));
  }
  if (d.tasks && d.tasks.length > 0) {
    await db.insert(tasksTable).values(d.tasks.map((t) => ({
      subjectId: t.subjectId ?? null,
      name: t.name,
      date: t.date,
      completed: t.completed ?? false,
    })));
  }
  if (d.routineItems && d.routineItems.length > 0) {
    await db.insert(routineItemsTable).values(d.routineItems.map((r) => ({
      day: r.day,
      subjectId: r.subjectId ?? null,
      label: r.label,
    })));
  }
  if (d.notes && d.notes.length > 0) {
    await db.insert(notesTable).values(d.notes.map((n) => ({
      subjectId: n.subjectId ?? null,
      classLabel: n.classLabel,
      content: n.content ?? null,
      photoUrl: n.photoUrl ?? null,
    })));
  }
  if (d.resources && d.resources.length > 0) {
    await db.insert(resourcesTable).values(d.resources.map((r) => ({
      subjectName: r.subjectName,
      topicName: r.topicName,
      url: r.url,
      isPaid: r.isPaid ?? false,
    })));
  }
  if (d.exams && d.exams.length > 0) {
    await db.delete(examsTable);
    await db.insert(examsTable).values(d.exams.map((e) => ({
      name: e.name,
      examDate: e.examDate,
      semesterCount: e.semesterCount ?? 1,
    })));
  }
  if (d.settings && d.settings.length > 0) {
    await db.delete(appSettingsTable);
    await db.insert(appSettingsTable).values(d.settings.map((s) => ({ theme: s.theme })));
  }

  res.json({ success: true });
});

router.post("/reset", async (req, res) => {
  await db.delete(subjectsTable);
  await db.delete(examsTable);
  await db.delete(appSettingsTable);
  res.json({ success: true });
});

export default router;
