import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  examDate: text("exam_date").notNull(),
  semesterCount: integer("semester_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTopicSchema = createInsertSchema(topicsTable).omit({ id: true, createdAt: true });
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topicsTable.$inferSelect;

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjectsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

export const routineItemsTable = pgTable("routine_items", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(),
  subjectId: integer("subject_id").references(() => subjectsTable.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoutineItemSchema = createInsertSchema(routineItemsTable).omit({ id: true, createdAt: true });
export type InsertRoutineItem = z.infer<typeof insertRoutineItemSchema>;
export type RoutineItem = typeof routineItemsTable.$inferSelect;

export const notesTable = pgTable("notes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjectsTable.id, { onDelete: "set null" }),
  noteGroupName: text("note_group_name"),
  classLabel: text("class_label").notNull(),
  content: text("content"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notesTable).omit({ id: true, createdAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notesTable.$inferSelect;

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  subjectName: text("subject_name").notNull(),
  topicName: text("topic_name").notNull(),
  url: text("url").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, createdAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;

export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull().default("light"),
  userName: text("user_name"),
  universityRoutineUrl: text("university_routine_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({ id: true, updatedAt: true });
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
