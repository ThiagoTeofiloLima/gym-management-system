"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TrashIcon, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseManagementProps {
  initialExpenses: Expense[];
  gymId: string;
}

export function ExpenseManagement({ initialExpenses, gymId }: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const url = editingExpense 
        ? `/api/expenses/${editingExpense.id}?gymId=${gymId}`
        : `/api/expenses?gymId=${gymId}`;

      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingExpense) {
          setExpenses(prev => prev.map(e => e.id === editingExpense.id ? data : e));
          toast.success("Despesa atualizada!");
        } else {
          setExpenses(prev => [...prev, data]);
          toast.success("Despesa adicionada!");
        }
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar despesa");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir despesa?")) return;

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}?gymId=${gymId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        toast.success("Despesa excluída!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir despesa");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Despesas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusIcon className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Editar' : 'Adicionar'} Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Título</Label>
                  <Input id="title" className="col-span-3" value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Descrição</Label>
                  <Input id="description" className="col-span-3" value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Valor</Label>
                  <Input id="amount" type="number" step="0.01" className="col-span-3" value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Categoria</Label>
                  <Input id="category" className="col-span-3" value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Data</Label>
                  <Input id="date" type="date" className="col-span-3" value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingExpense ? 'Atualizar' : 'Adicionar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>R$ {Number(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)} className="text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Nenhuma despesa encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
