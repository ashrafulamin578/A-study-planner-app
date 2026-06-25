import { Router } from "express";
import { db } from "@workspace/db";
import { subjectsTable, topicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.createdAt);
  const subjectProgress = await Promise.all(
    subjects.map(async (subject) => {
      const topics = await db.select().from(topicsTable).where(eq(topicsTable.subjectId, subject.id));
      const totalTopics = topics.length;
      const completedTopics = topics.filter((t) => t.completed).length;
      const percentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalTopics,
        completedTopics,
        percentage,
      };
    })
  );
  res.json({
    totalSubjects: subjects.length,
    subjects: subjectProgress,
  });
});

export default router;
