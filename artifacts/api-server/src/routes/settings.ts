import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serialize(r: typeof appSettingsTable.$inferSelect) {
  return {
    id: r.id,
    theme: r.theme,
    userName: r.userName ?? null,
    universityRoutineUrl: r.universityRoutineUrl ?? null,
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const rows = await db.select().from(appSettingsTable).limit(1);
  if (rows.length === 0) {
    const created = await db.insert(appSettingsTable).values({ theme: "light" }).returning();
    return res.json(serialize(created[0]));
  }
  res.json(serialize(rows[0]));
});

router.put("/", async (req, res) => {
  const { theme, userName, universityRoutineUrl } = req.body as {
    theme: string;
    userName?: string | null;
    universityRoutineUrl?: string | null;
  };
  const existing = await db.select().from(appSettingsTable).limit(1);
  const setData: Partial<typeof appSettingsTable.$inferInsert> = {
    theme,
    updatedAt: new Date(),
  };
  if (userName !== undefined) setData.userName = userName;
  if (universityRoutineUrl !== undefined) setData.universityRoutineUrl = universityRoutineUrl;

  if (existing.length > 0) {
    const updated = await db
      .update(appSettingsTable)
      .set(setData)
      .where(eq(appSettingsTable.id, existing[0].id))
      .returning();
    return res.json(serialize(updated[0]));
  }
  const created = await db.insert(appSettingsTable).values({ theme, userName: userName ?? null, universityRoutineUrl: universityRoutineUrl ?? null }).returning();
  res.json(serialize(created[0]));
});

export default router;
