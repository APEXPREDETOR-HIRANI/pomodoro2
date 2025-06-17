import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  project: text("project").notNull().default("Personal"), // Work, Personal, Learning
  priority: text("priority").notNull().default("Medium"), // High, Medium, Low
  estimatedPomodoros: integer("estimated_pomodoros").notNull().default(1),
  completedPomodoros: integer("completed_pomodoros").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id),
  type: text("type").notNull(), // focus, short_break, long_break
  duration: integer("duration").notNull(), // in minutes
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const timerSettings = pgTable("timer_settings", {
  id: serial("id").primaryKey(),
  focusDuration: integer("focus_duration").notNull().default(25),
  shortBreakDuration: integer("short_break_duration").notNull().default(5),
  longBreakDuration: integer("long_break_duration").notNull().default(15),
  autoStartBreaks: boolean("auto_start_breaks").notNull().default(false),
  autoStartPomodoros: boolean("auto_start_pomodoros").notNull().default(false),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  longBreakAfter: integer("long_break_after").notNull().default(4),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
  startedAt: true,
});

export const insertTimerSettingsSchema = createInsertSchema(timerSettings).omit({
  id: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertTimerSettings = z.infer<typeof insertTimerSettingsSchema>;
export type TimerSettings = typeof timerSettings.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
