"use server";

import { auth } from "@/services/auth";
import { jsonDb } from "@/services/json-db";

// Get gym dashboard data
export async function getDashboardData() {
    // Try to get session, but provide fallback for development
    let session;
    try {
        session = await auth();
    } catch (error) {
        // If auth fails, use a default user for development
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        // Return empty data if no user
        return {
            totalMembers: 0,
            activeMembers: 0,
            newMembers: 0,
            attendanceRate: 0,
            revenue: 0,
            expenses: 0,
            profit: 0
        };
    }

    // Get all members for the gym (not just for this user)
    const allMembers = await jsonDb.getData();
    const members = allMembers.members;
    const activeMembers = members.filter(member => member.status === 'Ativo');
    const newMembers = members.filter(member =>
        new Date(member.lastVisit).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    // Calculate attendance rate (simplified calculation)
    const allAttendance = await jsonDb.getData();
    const attendance = allAttendance.attendance;
    const presentRecords = attendance.filter(record => record.status === 'Presente');
    const attendanceRate = attendance.length > 0
        ? Math.round((presentRecords.length / attendance.length) * 100)
        : 0;

    // Calculate financial data
    const allFinancial = await jsonDb.getData();
    const financial = allFinancial.financial;
    const revenue = financial
        .filter(record => record.type === 'Receita')
        .reduce((sum, record) => sum + record.amount, 0);
    const expenses = financial
        .filter(record => record.type === 'Despesa')
        .reduce((sum, record) => sum + record.amount, 0);
    const profit = revenue - expenses;

    return {
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        newMembers: newMembers.length,
        attendanceRate,
        revenue,
        expenses,
        profit
    };
}

