import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, amount, category, date, userId } = body;

    // Validate required fields
    if (!title || amount === undefined || !category || !userId) {
      return Response.json(
        { message: 'Missing required fields: title, amount, category, or userId' },
        { status: 400 }
      );
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return Response.json(
        { message: 'Amount must be a valid number' },
        { status: 400 }
      );
    }

    // Validate date if provided
    if (date && isNaN(Date.parse(date))) {
      return Response.json(
        { message: 'Date must be a valid date string' },
        { status: 400 }
      );
    }

    // Create new expense
    const newExpense = await jsonDb.createExpense({
      title,
      description,
      amount,
      category,
      date: date || new Date().toISOString().split('T')[0],
      userId
    });

    return Response.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const userExpenses = await jsonDb.findExpensesByUserId(userId);

    return Response.json(userExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}