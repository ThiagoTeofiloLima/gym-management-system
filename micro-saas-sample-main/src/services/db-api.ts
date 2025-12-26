// Client-side service to interact with the database API
export interface User {
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

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  lastVisit: string;
  userId: string;
  planRenewalDate: string; // Data de renovação do plano
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  status: string;
  certifications: string[];
  userId: string;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  trainer: string;
  members: number;
  userId: string;
}

export interface Attendance {
  id: string;
  date: string;
  member: string;
  memberEmail: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  userId: string;
}

export interface Financial {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  category: string;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class DatabaseApiService {
  private baseUrl = '/api/db';

  async getAttendanceByUserId(userId: string): Promise<Attendance[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=attendance`);
    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }
    return response.json();
  }

  async getMembersByUserId(userId: string): Promise<Member[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=members`);
    if (!response.ok) {
      throw new Error('Failed to fetch members data');
    }
    return response.json();
  }

  async getTrainersByUserId(userId: string): Promise<Trainer[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=trainers`);
    if (!response.ok) {
      throw new Error('Failed to fetch trainers data');
    }
    return response.json();
  }

  async getWorkoutsByUserId(userId: string): Promise<Workout[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=workouts`);
    if (!response.ok) {
      throw new Error('Failed to fetch workouts data');
    }
    return response.json();
  }

  async getFinancialByUserId(userId: string): Promise<Financial[]> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=financial`);
    if (!response.ok) {
      throw new Error('Failed to fetch financial data');
    }
    return response.json();
  }

  async getAllDataByUserId(userId: string): Promise<{
    attendance: Attendance[];
    members: Member[];
    trainers: Trainer[];
    workouts: Workout[];
    financial: Financial[];
  }> {
    const response = await fetch(`${this.baseUrl}?userId=${userId}&resource=all`);
    if (!response.ok) {
      throw new Error('Failed to fetch all data');
    }
    return response.json();
  }

  async createAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resource: 'attendance',
        data: attendanceData
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create attendance record');
    }
    return response.json();
  }

  async createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resource: 'members',
        data: memberData
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create member');
    }
    return response.json();
  }

  async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<Attendance | null> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        resource: 'attendance',
        data: attendanceData
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update attendance record');
    }
    return response.json();
  }

  async updateMember(id: string, memberData: Partial<Member>): Promise<Member | null> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        resource: 'members',
        data: memberData
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update member');
    }
    return response.json();
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}?id=${id}&resource=attendance`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete attendance record');
    }
    const result = await response.json();
    return result.deleted;
  }

  async deleteMember(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}?id=${id}&resource=members`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete member');
    }
    const result = await response.json();
    return result.deleted;
  }
}

export const dbApi = new DatabaseApiService();