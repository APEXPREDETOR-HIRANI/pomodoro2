import { 
  tasks, 
  pomodoroSessions, 
  timerSettings,
  type Task, 
  type InsertTask,
  type PomodoroSession,
  type InsertPomodoroSession,
  type TimerSettings,
  type InsertTimerSettings,
  type User,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Task methods
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  reorderTasks(taskIds: number[]): Promise<void>;

  // Pomodoro session methods
  getSessions(): Promise<PomodoroSession[]>;
  getSessionsByDate(date: string): Promise<PomodoroSession[]>;
  createSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  updateSession(id: number, updates: Partial<InsertPomodoroSession>): Promise<PomodoroSession | undefined>;

  // Timer settings methods
  getTimerSettings(): Promise<TimerSettings>;
  updateTimerSettings(settings: Partial<InsertTimerSettings>): Promise<TimerSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private sessions: Map<number, PomodoroSession>;
  private settings: TimerSettings;
  private currentUserId: number;
  private currentTaskId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentSessionId = 1;

    // Default timer settings
    this.settings = {
      id: 1,
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      notificationsEnabled: true,
      soundEnabled: true,
      longBreakAfter: 4,
    };

    // Initialize with some sample tasks
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleTasks: InsertTask[] = [
      {
        title: "Complete project proposal",
        description: "Finish the quarterly project proposal for the new client",
        project: "Work",
        priority: "High",
        estimatedPomodoros: 3,
        completedPomodoros: 0,
        completed: false,
        order: 0,
      },
      {
        title: "Review team feedback",
        description: "Go through the feedback from the design review meeting",
        project: "Work",
        priority: "Medium",
        estimatedPomodoros: 1,
        completedPomodoros: 0,
        completed: false,
        order: 1,
      },
      {
        title: "Read Atomic Habits chapter 5",
        description: "Continue reading the productivity book",
        project: "Learning",
        priority: "Low",
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        completed: false,
        order: 2,
      },
    ];

    sampleTasks.forEach(task => {
      const newTask: Task = {
        id: this.currentTaskId++,
        title: task.title,
        description: task.description || null,
        project: task.project || "Personal",
        priority: task.priority || "Medium",
        estimatedPomodoros: task.estimatedPomodoros || 1,
        completedPomodoros: task.completedPomodoros || 0,
        completed: task.completed || false,
        order: task.order || 0,
        createdAt: new Date(),
      };
      this.tasks.set(newTask.id, newTask);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => a.order - b.order);
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      project: insertTask.project || "Personal",
      priority: insertTask.priority || "Medium",
      estimatedPomodoros: insertTask.estimatedPomodoros || 1,
      completedPomodoros: insertTask.completedPomodoros || 0,
      completed: insertTask.completed || false,
      order: insertTask.order || 0,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async reorderTasks(taskIds: number[]): Promise<void> {
    taskIds.forEach((taskId, index) => {
      const task = this.tasks.get(taskId);
      if (task) {
        task.order = index;
        this.tasks.set(taskId, task);
      }
    });
  }

  // Pomodoro session methods
  async getSessions(): Promise<PomodoroSession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async getSessionsByDate(date: string): Promise<PomodoroSession[]> {
    const targetDate = new Date(date);
    return Array.from(this.sessions.values()).filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate.toDateString() === targetDate.toDateString();
    });
  }

  async createSession(insertSession: InsertPomodoroSession): Promise<PomodoroSession> {
    const id = this.currentSessionId++;
    const session: PomodoroSession = {
      id,
      taskId: insertSession.taskId || null,
      type: insertSession.type,
      duration: insertSession.duration,
      completed: insertSession.completed || false,
      startedAt: new Date(),
      completedAt: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updates: Partial<InsertPomodoroSession>): Promise<PomodoroSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession: PomodoroSession = { 
      ...session, 
      ...updates,
      completedAt: updates.completed ? new Date() : session.completedAt,
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // Timer settings methods
  async getTimerSettings(): Promise<TimerSettings> {
    return this.settings;
  }

  async updateTimerSettings(updates: Partial<InsertTimerSettings>): Promise<TimerSettings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

export const storage = new MemStorage();
