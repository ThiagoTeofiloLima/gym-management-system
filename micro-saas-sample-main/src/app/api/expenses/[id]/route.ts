import { NextRequest } from 'next/server';
import { jsonDb } from '@/services/json-db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = params.id;

    if (!expenseId) {
      return Response.json(
        { message: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, amount, category, date } = body;

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount))) {
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

    // Update the expense
    const updatedExpense = await jsonDb.updateExpense(expenseId, {
      title,
      description,
      amount,
      category,
      date
    });

    if (!updatedExpense) {
      return Response.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }

    return Response.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const expenseId = params.id;

    if (!expenseId) {
      return Response.json(
        { message: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const deleted = await jsonDb.deleteExpense(expenseId);

    if (!deleted) {
      return Response.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }

    return Response.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}