import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for the file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: Date | null;
  image?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
  stripePriceId?: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  lastVisit: string;
  userId: string;
}

interface Trainer {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  status: string;
  certifications: string[];
  userId: string;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  trainer: string;
  members: number;
  userId: string;
}

interface Attendance {
  id: string;
  date: string;
  member: string;
  memberEmail: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  userId: string;
}

interface Financial {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  category: string;
  userId: string;
}

interface ToDo {
  id: string;
  title: string;
  doneAt: Date | null;
  createdAt: Date;
  userId: string;
}

interface Database {
  users: User[];
  members: Member[];
  trainers: Trainer[];
  workouts: Workout[];
  attendance: Attendance[];
  financial: Financial[];
  toDos: ToDo[];
  accounts: any[];
  sessions: any[];
  verificationTokens: any[];
}

export class JsonDatabase {
  private dbPath: string;
  private data: Database | null = null;

  constructor() {
    this.dbPath = path.join(__dirname, '..', '..', 'db.json');
  }

  private async readDb(): Promise<Database> {
    try {
      const fileContent = await fs.readFile(this.dbPath, 'utf-8');
      const parsedData = JSON.parse(fileContent) as Database;

      // Initialize all arrays if they don't exist
      if (!parsedData.users) parsedData.users = [];
      if (!parsedData.members) parsedData.members = [];
      if (!parsedData.trainers) parsedData.trainers = [];
      if (!parsedData.workouts) parsedData.workouts = [];
      if (!parsedData.attendance) parsedData.attendance = [];
      if (!parsedData.financial) parsedData.financial = [];
      if (!parsedData.toDos) parsedData.toDos = [];
      if (!parsedData.accounts) parsedData.accounts = [];
      if (!parsedData.sessions) parsedData.sessions = [];
      if (!parsedData.verificationTokens) parsedData.verificationTokens = [];

      return parsedData;
    } catch (error) {
      console.error('Error reading database:', error);
      // Return empty database structure if file doesn't exist
      return {
        users: [],
        members: [],
        trainers: [],
        workouts: [],
        attendance: [],
        financial: [],
        toDos: [],
        accounts: [],
        sessions: [],
        verificationTokens: []
      };
    }
  }

  private async writeDb(data: Database): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing to database:', error);
      throw error;
    }
  }

  async getData(): Promise<Database> {
    if (!this.data) {
      this.data = await this.readDb();
    }
    return this.data;
  }

  async saveData(data: Database): Promise<void> {
    this.data = data;
    await this.writeDb(data);
  }

  // User operations
  async findUserById(id: string): Promise<User | undefined> {
    const db = await this.getData();
    return db.users.find(user => user.id === id);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getData();
    return db.users.find(user => user.email === email);
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const db = await this.getData();
    const newUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.users.push(newUser);
    await this.saveData(db);

    return newUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const db = await this.getData();
    const userIndex = db.users.findIndex(user => user.id === id);

    if (userIndex === -1) return null;

    db.users[userIndex] = { ...db.users[userIndex], ...userData };
    await this.saveData(db);

    return db.users[userIndex];
  }

  // Member operations
  async findMembersByUserId(userId: string): Promise<Member[]> {
    const db = await this.getData();
    return db.members.filter(member => member.userId === userId);
  }

  async findMemberById(id: string): Promise<Member | undefined> {
    const db = await this.getData();
    return db.members.find(member => member.id === id);
  }

  async createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    const db = await this.getData();
    const newMember = {
      ...memberData,
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.members.push(newMember);
    await this.saveData(db);

    return newMember;
  }

  async updateMember(id: string, memberData: Partial<Member>): Promise<Member | null> {
    const db = await this.getData();
    const memberIndex = db.members.findIndex(member => member.id === id);

    if (memberIndex === -1) return null;

    db.members[memberIndex] = { ...db.members[memberIndex], ...memberData };

    await this.saveData(db);

    return db.members[memberIndex];
  }

  async deleteMember(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.members.length;
    db.members = db.members.filter(member => member.id !== id);

    if (db.members.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  // Trainer operations
  async findTrainersByUserId(userId: string): Promise<Trainer[]> {
    const db = await this.getData();
    return db.trainers.filter(trainer => trainer.userId === userId);
  }

  async findTrainerById(id: string): Promise<Trainer | undefined> {
    const db = await this.getData();
    return db.trainers.find(trainer => trainer.id === id);
  }

  async createTrainer(trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
    const db = await this.getData();
    const newTrainer = {
      ...trainerData,
      id: `trainer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.trainers.push(newTrainer);
    await this.saveData(db);

    return newTrainer;
  }

  async updateTrainer(id: string, trainerData: Partial<Trainer>): Promise<Trainer | null> {
    const db = await this.getData();
    const trainerIndex = db.trainers.findIndex(trainer => trainer.id === id);

    if (trainerIndex === -1) return null;

    db.trainers[trainerIndex] = { ...db.trainers[trainerIndex], ...trainerData };

    await this.saveData(db);

    return db.trainers[trainerIndex];
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.trainers.length;
    db.trainers = db.trainers.filter(trainer => trainer.id !== id);

    if (db.trainers.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  // Workout operations
  async findWorkoutsByUserId(userId: string): Promise<Workout[]> {
    const db = await this.getData();
    return db.workouts.filter(workout => workout.userId === userId);
  }

  async findWorkoutById(id: string): Promise<Workout | undefined> {
    const db = await this.getData();
    return db.workouts.find(workout => workout.id === id);
  }

  async createWorkout(workoutData: Omit<Workout, 'id'>): Promise<Workout> {
    const db = await this.getData();
    const newWorkout = {
      ...workoutData,
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.workouts.push(newWorkout);
    await this.saveData(db);

    return newWorkout;
  }

  async updateWorkout(id: string, workoutData: Partial<Workout>): Promise<Workout | null> {
    const db = await this.getData();
    const workoutIndex = db.workouts.findIndex(workout => workout.id === id);

    if (workoutIndex === -1) return null;

    db.workouts[workoutIndex] = { ...db.workouts[workoutIndex], ...workoutData };

    await this.saveData(db);

    return db.workouts[workoutIndex];
  }

  async deleteWorkout(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.workouts.length;
    db.workouts = db.workouts.filter(workout => workout.id !== id);

    if (db.workouts.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  // Attendance operations
  async findAttendanceByUserId(userId: string): Promise<Attendance[]> {
    const db = await this.getData();
    return db.attendance.filter(record => record.userId === userId);
  }

  async findAttendanceById(id: string): Promise<Attendance | undefined> {
    const db = await this.getData();
    return db.attendance.find(record => record.id === id);
  }

  async createAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> {
    const db = await this.getData();
    const newAttendance = {
      ...attendanceData,
      id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.attendance.push(newAttendance);
    await this.saveData(db);

    return newAttendance;
  }

  async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<Attendance | null> {
    const db = await this.getData();
    const attendanceIndex = db.attendance.findIndex(record => record.id === id);

    if (attendanceIndex === -1) return null;

    db.attendance[attendanceIndex] = { ...db.attendance[attendanceIndex], ...attendanceData };

    await this.saveData(db);

    return db.attendance[attendanceIndex];
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.attendance.length;
    db.attendance = db.attendance.filter(record => record.id !== id);

    if (db.attendance.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  // Financial operations
  async findFinancialByUserId(userId: string): Promise<Financial[]> {
    const db = await this.getData();
    return db.financial.filter(record => record.userId === userId);
  }

  async findFinancialById(id: string): Promise<Financial | undefined> {
    const db = await this.getData();
    return db.financial.find(record => record.id === id);
  }

  async createFinancial(financialData: Omit<Financial, 'id'>): Promise<Financial> {
    const db = await this.getData();
    const newFinancial = {
      ...financialData,
      id: `financial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.financial.push(newFinancial);
    await this.saveData(db);

    return newFinancial;
  }

  async updateFinancial(id: string, financialData: Partial<Financial>): Promise<Financial | null> {
    const db = await this.getData();
    const financialIndex = db.financial.findIndex(record => record.id === id);

    if (financialIndex === -1) return null;

    db.financial[financialIndex] = { ...db.financial[financialIndex], ...financialData };

    await this.saveData(db);

    return db.financial[financialIndex];
  }

  async deleteFinancial(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.financial.length;
    db.financial = db.financial.filter(record => record.id !== id);

    if (db.financial.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  // ToDo operations
  async findToDosByUserId(userId: string): Promise<ToDo[]> {
    const db = await this.getData();
    return db.toDos.filter(todo => todo.userId === userId);
  }

  async findToDoById(id: string): Promise<ToDo | undefined> {
    const db = await this.getData();
    return db.toDos.find(todo => todo.id === id);
  }

  async createToDo(todoData: Omit<ToDo, 'id'>): Promise<ToDo> {
    const db = await this.getData();
    const newToDo = {
      ...todoData,
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.toDos.push(newToDo);
    await this.saveData(db);

    return newToDo;
  }

  async updateToDo(id: string, todoData: Partial<ToDo>): Promise<ToDo | null> {
    const db = await this.getData();
    const todoIndex = db.toDos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) return null;

    db.toDos[todoIndex] = { ...db.toDos[todoIndex], ...todoData };

    await this.saveData(db);

    return db.toDos[todoIndex];
  }

  async deleteToDo(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.toDos.length;
    db.toDos = db.toDos.filter(todo => todo.id !== id);

    if (db.toDos.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }

  async deleteAllToDosByUserId(userId: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.toDos.length;
    db.toDos = db.toDos.filter(todo => todo.userId !== userId);

    if (db.toDos.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }
}

export const jsonDb = new JsonDatabase();