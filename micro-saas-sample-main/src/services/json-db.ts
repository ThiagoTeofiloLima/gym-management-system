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
  trainerId?: string; // ID of the assigned trainer
  assignedWorkoutIds?: string[]; // IDs of assigned workouts
  userId: string;
  planRenewalDate: string; // Data de renovação do plano
  paymentDate: string; // Data de pagamento
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
  certifications: string[];
  assignedMemberIds: string[]; // IDs of members assigned to this trainer
  userId: string;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  description?: string;
  trainerId: string; // ID of the assigned trainer
  assignedMemberIds: string[]; // IDs of members assigned to this workout
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

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
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
  expenses: Expense[];
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
      if (!parsedData.expenses) parsedData.expenses = [];
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
        expenses: [],
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
    return db.members
      .filter(member => member.userId === userId)
      .map(member => ({
        ...member,
        trainerId: member.trainerId || undefined,
        assignedWorkoutIds: member.assignedWorkoutIds || []
      }));
  }

  async findMemberById(id: string): Promise<Member | undefined> {
    const db = await this.getData();
    const member = db.members.find(member => member.id === id);
    if (member) {
      return {
        ...member,
        trainerId: member.trainerId || undefined,
        assignedWorkoutIds: member.assignedWorkoutIds || []
      };
    }
    return undefined;
  }

  async createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    const db = await this.getData();
    const newMember = {
      ...memberData,
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      trainerId: memberData.trainerId || undefined, // Initialize trainerId if provided
      assignedWorkoutIds: memberData.assignedWorkoutIds || [], // Initialize assignedWorkoutIds if provided
      paymentDate: memberData.paymentDate || new Date().toISOString().split('T')[0] // Default to today if not provided
    };

    db.members.push(newMember);
    await this.saveData(db);

    return newMember;
  }

  async updateMember(id: string, memberData: Partial<Member>): Promise<Member | null> {
    const db = await this.getData();
    const memberIndex = db.members.findIndex(member => member.id === id);

    if (memberIndex === -1) return null;

    const oldMember = { ...db.members[memberIndex] };
    const updatedMember = {
      ...db.members[memberIndex],
      ...memberData,
      paymentDate: memberData.paymentDate || db.members[memberIndex].paymentDate // Preserve paymentDate if not provided
    };

    db.members[memberIndex] = updatedMember;

    // If payment date changed, update the corresponding financial record
    if (memberData.paymentDate && oldMember.paymentDate !== memberData.paymentDate) {
      // Find and update the financial record for this member's payment
      const financialRecordIndex = db.financial.findIndex(record =>
        record.description.includes(`Mensalidade - ${oldMember.name}`)
      );

      if (financialRecordIndex !== -1) {
        // Update the financial record with the new payment date
        db.financial[financialRecordIndex] = {
          ...db.financial[financialRecordIndex],
          date: memberData.paymentDate as string,
          description: `Mensalidade - ${updatedMember.name}`
        };
      } else {
        // If no existing record found, create a new one
        const planPrice = this.getPlanPrice(updatedMember.plan);
        db.financial.push({
          id: `payment-${updatedMember.id}-${Date.now()}`,
          date: memberData.paymentDate as string,
          description: `Mensalidade - ${updatedMember.name}`,
          type: 'Receita',
          amount: planPrice,
          category: updatedMember.plan === 'Anual' ? 'Mensalidades Anuais' :
                   updatedMember.plan === 'Trimestral' ? 'Mensalidades Trimestrais' : 'Mensalidades',
          userId: updatedMember.userId
        });
      }
    }

    // If trainerId changed, update the trainer's assignedMemberIds
    if (memberData.trainerId !== undefined && oldMember.trainerId !== memberData.trainerId) {
      // Remove member from old trainer's assigned list if there was one
      if (oldMember.trainerId) {
        const oldTrainer = db.trainers.find(trainer => trainer.id === oldMember.trainerId);
        if (oldTrainer) {
          oldTrainer.assignedMemberIds = oldTrainer.assignedMemberIds.filter(memberId => memberId !== updatedMember.id);
        }
      }

      // Add member to new trainer's assigned list if there is one
      if (memberData.trainerId) {
        const newTrainer = db.trainers.find(trainer => trainer.id === memberData.trainerId);
        if (newTrainer) {
          if (!newTrainer.assignedMemberIds.includes(updatedMember.id)) {
            newTrainer.assignedMemberIds.push(updatedMember.id);
          }
        }
      }
    }

    // If assignedWorkoutIds changed, update the workouts' assignedMemberIds
    if (memberData.assignedWorkoutIds !== undefined && oldMember.assignedWorkoutIds && JSON.stringify(oldMember.assignedWorkoutIds) !== JSON.stringify(memberData.assignedWorkoutIds)) {
      // Remove member from workouts that are no longer assigned
      const oldWorkoutIds = oldMember.assignedWorkoutIds || [];
      const newWorkoutIds = memberData.assignedWorkoutIds || [];

      for (const workoutId of oldWorkoutIds) {
        if (!newWorkoutIds.includes(workoutId)) {
          const workout = db.workouts.find(w => w.id === workoutId);
          if (workout) {
            workout.assignedMemberIds = workout.assignedMemberIds.filter(memberId => memberId !== updatedMember.id);
          }
        }
      }

      // Add member to newly assigned workouts
      for (const workoutId of newWorkoutIds) {
        if (!oldWorkoutIds.includes(workoutId)) {
          const workout = db.workouts.find(w => w.id === workoutId);
          if (workout) {
            if (!workout.assignedMemberIds.includes(updatedMember.id)) {
              workout.assignedMemberIds.push(updatedMember.id);
            }
          }
        }
      }
    }

    await this.saveData(db);

    return db.members[memberIndex];
  }

  // Helper function to get plan price
  private getPlanPrice(planType: string): number {
    switch (planType.toLowerCase()) {
      case 'mensal':
        return 100;
      case 'trimestral':
        return 250;
      case 'anual':
        return 900;
      default:
        return 0;
    }
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
    return db.trainers
      .filter(trainer => trainer.userId === userId)
      .map(trainer => ({
        ...trainer,
        assignedMemberIds: trainer.assignedMemberIds || []
      }));
  }

  async findTrainerById(id: string): Promise<Trainer | undefined> {
    const db = await this.getData();
    const trainer = db.trainers.find(trainer => trainer.id === id);
    if (trainer) {
      return {
        ...trainer,
        assignedMemberIds: trainer.assignedMemberIds || []
      };
    }
    return undefined;
  }

  async createTrainer(trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
    const db = await this.getData();
    const newTrainer = {
      ...trainerData,
      id: `trainer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedMemberIds: trainerData.assignedMemberIds || [] // Initialize with empty array if not provided
    };

    db.trainers.push(newTrainer);
    await this.saveData(db);

    return newTrainer;
  }

  async updateTrainer(id: string, trainerData: Partial<Trainer>): Promise<Trainer | null> {
    const db = await this.getData();
    const trainerIndex = db.trainers.findIndex(trainer => trainer.id === id);

    if (trainerIndex === -1) return null;

    // Handle member assignment updates
    if (trainerData.assignedMemberIds !== undefined) {
      // Update the trainer's assigned members
      db.trainers[trainerIndex] = {
        ...db.trainers[trainerIndex],
        ...trainerData
      };

      // Update the members to reference their assigned trainer
      const updatedTrainer = db.trainers[trainerIndex];
      const newAssignedMemberIds = trainerData.assignedMemberIds || [];

      // Remove trainer reference from members that are no longer assigned
      for (const member of db.members) {
        if (member.trainerId === updatedTrainer.id && !newAssignedMemberIds.includes(member.id)) {
          delete member.trainerId; // Remove the trainer reference
        }
      }

      // Add trainer reference to newly assigned members
      for (const memberId of newAssignedMemberIds) {
        const member = db.members.find(m => m.id === memberId);
        if (member) {
          member.trainerId = updatedTrainer.id; // Add trainer reference to member
        }
      }
    } else {
      // Regular update without member assignment changes
      db.trainers[trainerIndex] = { ...db.trainers[trainerIndex], ...trainerData };
    }

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
    return db.workouts
      .filter(workout => workout.userId === userId)
      .map(workout => ({
        ...workout,
        assignedMemberIds: workout.assignedMemberIds || []
      }));
  }

  async findWorkoutById(id: string): Promise<Workout | undefined> {
    const db = await this.getData();
    const workout = db.workouts.find(workout => workout.id === id);
    if (workout) {
      return {
        ...workout,
        assignedMemberIds: workout.assignedMemberIds || []
      };
    }
    return undefined;
  }

  async createWorkout(workoutData: Omit<Workout, 'id'>): Promise<Workout> {
    const db = await this.getData();
    const newWorkout = {
      ...workoutData,
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedMemberIds: workoutData.assignedMemberIds || [] // Initialize with empty array if not provided
    };

    db.workouts.push(newWorkout);
    await this.saveData(db);

    return newWorkout;
  }

  async updateWorkout(id: string, workoutData: Partial<Workout>): Promise<Workout | null> {
    const db = await this.getData();
    const workoutIndex = db.workouts.findIndex(workout => workout.id === id);

    if (workoutIndex === -1) return null;

    // Handle member assignment updates
    if (workoutData.assignedMemberIds !== undefined) {
      // Update the workout's assigned members
      db.workouts[workoutIndex] = {
        ...db.workouts[workoutIndex],
        ...workoutData
      };

      // Update the members to reference their assigned workouts
      const updatedWorkout = db.workouts[workoutIndex];
      const newAssignedMemberIds = workoutData.assignedMemberIds || [];

      // Remove workout reference from members that are no longer assigned
      for (const member of db.members) {
        if (member.assignedWorkoutIds && member.assignedWorkoutIds.includes(updatedWorkout.id) && !newAssignedMemberIds.includes(member.id)) {
          member.assignedWorkoutIds = member.assignedWorkoutIds.filter(workoutId => workoutId !== updatedWorkout.id);
        }
      }

      // Add workout reference to newly assigned members
      for (const memberId of newAssignedMemberIds) {
        const member = db.members.find(m => m.id === memberId);
        if (member) {
          if (!member.assignedWorkoutIds) {
            member.assignedWorkoutIds = [];
          }
          if (!member.assignedWorkoutIds.includes(updatedWorkout.id)) {
            member.assignedWorkoutIds.push(updatedWorkout.id);
          }
        }
      }
    } else {
      // Regular update without member assignment changes
      db.workouts[workoutIndex] = { ...db.workouts[workoutIndex], ...workoutData };
    }

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

  // Expense operations
  async findExpensesByUserId(userId: string): Promise<Expense[]> {
    const db = await this.getData();
    return db.expenses.filter(expense => expense.userId === userId);
  }

  async findExpenseById(id: string): Promise<Expense | undefined> {
    const db = await this.getData();
    return db.expenses.find(expense => expense.id === id);
  }

  async createExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const db = await this.getData();
    const now = new Date().toISOString();
    const newExpense = {
      ...expenseData,
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };

    db.expenses.push(newExpense);
    await this.saveData(db);

    return newExpense;
  }

  async updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id' | 'createdAt' | 'userId'>>): Promise<Expense | null> {
    const db = await this.getData();
    const expenseIndex = db.expenses.findIndex(expense => expense.id === id);

    if (expenseIndex === -1) return null;

    const oldExpense = { ...db.expenses[expenseIndex] };
    const updatedExpense = {
      ...db.expenses[expenseIndex],
      ...expenseData,
      updatedAt: new Date().toISOString()
    };

    db.expenses[expenseIndex] = updatedExpense;
    await this.saveData(db);

    return db.expenses[expenseIndex];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const db = await this.getData();
    const initialLength = db.expenses.length;
    db.expenses = db.expenses.filter(expense => expense.id !== id);

    if (db.expenses.length < initialLength) {
      await this.saveData(db);
      return true;
    }

    return false;
  }
}

export const jsonDb = new JsonDatabase();