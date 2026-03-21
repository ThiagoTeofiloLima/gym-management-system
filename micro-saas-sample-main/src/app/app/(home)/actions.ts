"use server";

import { auth } from "@/services/auth";
import * as db from "@/services/database";
import { z } from "zod";
import { upsertToDoSchema } from "./schema";

export interface ToDo {
    id: string;
    title: string;
    doneAt: string | null;
    createdAt: string;
    userId?: string;
}

// Get gym dashboard data
export async function getDashboardData() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
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

    const userId = session.user.id;

    // Get all members for the user
    const members = await db.findMembers({ userId });
    const activeMembers = members.filter(member => member.status === 'Ativo');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newMembers = members.filter(member =>
        new Date(member.lastVisit).getTime() > thirtyDaysAgo.getTime()
    );

    // Calculate attendance rate
    const attendance = await db.findAttendanceRecords({ userId });
    const presentRecords = attendance.filter(record => record.status === 'Presente');
    const attendanceRate = attendance.length > 0
        ? Math.round((presentRecords.length / attendance.length) * 100)
        : 0;

    // Calculate financial data
    const financial = await db.findExpenses({ userId });
    // Expenses com categoria que indica receita (ex: "Receita", "Mensalidades") são receitas, outras são despesas
    const revenueCategories = ['Receita', 'Mensalidades', 'Mensalidades Anuais', 'Mensalidades Trimestrais'];
    const revenue = financial
        .filter(record => revenueCategories.includes(record.category))
        .reduce((sum, record) => sum + Number(record.amount), 0);
    const expenses = financial
        .filter(record => !revenueCategories.includes(record.category))
        .reduce((sum, record) => sum + Number(record.amount), 0);
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

// ToDo functions
export async function getToDos() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return [];
    }

    const userId = session.user.id;

    const todos = await db.findTodos({ userId });

    return todos;
}

export async function upsertToDo(data: { id?: string; title: string; doneAt?: string | null }) {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return { error: "Unauthorized", data: null };
    }

    const validatedData = upsertToDoSchema.safeParse(data);
    if (!validatedData.success) {
        return { error: "Invalid data", data: null };
    }

    const { id, title, doneAt } = validatedData.data;
    const userId = session.user.id;

    if (id) {
        const updatedTodo = await db.updateTodo(id, { title, doneAt: doneAt || null });
        return { error: null, data: updatedTodo };
    } else {
        const newTodo = await db.createTodo({
            title,
            doneAt: doneAt || null,
            userId,
        });
        return { error: null, data: newTodo };
    }
}

export async function deleteToDo(data: { id: string }) {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return { error: "Unauthorized", success: false };
    }

    try {
        await db.deleteTodo(data.id);
        return { error: null, success: true };
    } catch (error) {
        return { error: "Failed to delete ToDo", success: false };
    }
}

export async function deleteAllToDos() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        session = { user: { id: "user-1" } };
    }

    if (!session?.user?.id) {
        return { error: "Unauthorized", success: false };
    }

    const userId = session.user.id;
    try {
        const todos = await db.findTodos({ userId });
        await Promise.all(todos.map(todo => db.deleteTodo(todo.id)));
        return { error: null, success: true };
    } catch (error) {
        return { error: "Failed to delete all ToDos", success: false };
    }
}
