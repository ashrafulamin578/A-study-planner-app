import { Router } from "express";
import { db } from "@workspace/db";
import {
  appSettingsTable,
  examsTable,
  subjectsTable,
  topicsTable,
  tasksTable,
  routineItemsTable,
  notesTable,
  resourcesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await db.select().from(appSettingsTable).limit(1);
  if (rows.length === 0) {
    const created = await db.insert(appSettingsTable).values({ theme: "light" }).returning();
    const r = created[0];
    return res.json({ id: r.id, theme: r.theme, updatedAt: r.updatedAt.toISOString() });
  }
  const r = rows[0];
  res.json({ id: r.id, theme: r.theme, updatedAt: r.updatedAt.toISOString() });
});

router.put("/", async (req, res) => {
  const { theme } = req.body as { theme: string };
  const existing = await db.select().from(appSettingsTable).limit(1);
  if (existing.length > 0) {
    const updated = await db
      .update(appSettingsTable)
      .set({ theme, updatedAt: new Date() })
      .where(eq(appSettingsTable.id, existing[0].id))
      .returning();
    const r = updated[0];
    return res.json({ id: r.id, theme: r.theme, updatedAt: r.updatedAt.toISOString() });
  }
  const created = await db.insert(appSettingsTable).values({ theme }).returning();
  const r = created[0];
  res.json({ id: r.id, theme: r.theme, updatedAt: r.updatedAt.toISOString() });
});

export default router;
