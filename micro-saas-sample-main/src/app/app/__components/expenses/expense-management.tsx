"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrashIcon, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

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

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load expenses from API
  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/expenses?userId=user-1'); // Using a placeholder user ID for now
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Filter expenses based on date/month and search term
  useEffect(() => {
    let result = [...expenses];
    
    // Apply date/month filter
    if (selectedMonth) {
      const currentYear = new Date().getFullYear();
      result = result.filter(expense => {
        const [expenseYear, expenseMonth] = expense.date.split('-');
        return expenseMonth === selectedMonth && parseInt(expenseYear) === currentYear;
      });
    } else if (selectedDate) {
      result = result.filter(expense => expense.date === selectedDate);
    } else {
      // Show last 30 days by default
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      result = result.filter(expense => expense.date >= thirtyDaysAgoStr);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(expense => 
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredExpenses(result);
  }, [expenses, selectedDate, selectedMonth, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: "user-1" // Placeholder user ID
      };
      
      let response;
      if (editingExpense) {
        // Update existing expense
        response = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        });
        
        if (response.ok) {
          toast.success("Despesa atualizada com sucesso!");
        }
      } else {
        // Create new expense
        response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        });
        
        if (response.ok) {
          toast.success("Despesa adicionada com sucesso!");
        }
      }
      
      if (response.ok) {
        loadExpenses(); // Reload expenses
        resetForm();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao salvar despesa");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Erro ao salvar despesa");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success("Despesa excluída com sucesso!");
        loadExpenses(); // Reload expenses
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao excluir despesa");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
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

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Despesas</CardTitle>
          <div className="text-2xl font-bold text-red-500">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Total de {filteredExpenses.length} despesa(s) {selectedDate ? `em ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : selectedMonth ? `no mês ${selectedMonth}` : 'nos últimos 30 dias'}
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedMonth('');
            }}
            className="max-w-[200px]"
          />
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedDate('');
            }}
            className="border rounded-md px-3 py-2 max-w-[150px]"
          >
            <option value="">Mês</option>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
          <Button
            onClick={() => {
              setSelectedDate('');
              setSelectedMonth('');
            }}
            variant="outline"
            className="whitespace-nowrap"
          >
            Limpar
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar despesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[200px]"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DialogTitle>
                <DialogDescription>
                  {editingExpense 
                    ? 'Edite as informações da despesa.' 
                    : 'Preencha as informações da nova despesa.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Descrição opcional"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="col-span-3"
                    placeholder="R$"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Categoria *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluguel">Aluguel</SelectItem>
                      <SelectItem value="Salários">Salários</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Suprimentos">Suprimentos</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Taxas e Impostos">Taxas e Impostos</SelectItem>
                      <SelectItem value="Seguros">Seguros</SelectItem>
                      <SelectItem value="Utilidades">Utilidades</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">{editingExpense ? 'Atualizar' : 'Adicionar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Título</th>
                    <th className="text-left py-2">Descrição</th>
                    <th className="text-left py-2">Categoria</th>
                    <th className="text-left py-2">Valor</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t">
                      <td className="py-2">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 font-medium">{expense.title}</td>
                      <td className="py-2 text-sm text-muted-foreground">{expense.description || '-'}</td>
                      <td className="py-2">
                        <Badge variant="outline">{expense.category}</Badge>
                      </td>
                      <td className="py-2 font-semibold text-red-500">- R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma despesa encontrada {selectedDate || selectedMonth ? 'para o período selecionado' : 'nos últimos 30 dias'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}