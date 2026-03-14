"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    BarChartIcon,
    CardStackIcon
} from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { calculateRevenueFromMembers, getPlanPricingBreakdown, getPlanPrice, generateFinancialRecordsFromMembers } from "@/services/plan-pricing";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export function FinancialCharts() {
    const searchParams = useSearchParams()
    const gymId = searchParams?.get('gymId')
    
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [financialRecords, setFinancialRecords] = useState<any[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
    const [financialSummary, setFinancialSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0
    });
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    // Define the data loading function separately so it can be reused
    const loadFinancialData = async (preserveSelection?: string) => {
        try {
            // Fetch data com gymId para filtrar por academia
            const financialUrl = gymId ? `/api/data?gymId=${gymId}` : '/api/data';
            const expenseUrl = gymId ? `/api/expenses?gymId=${gymId}` : '/api/expenses';
            
            const [financialResponse, expenseResponse] = await Promise.all([
                fetch(financialUrl),
                fetch(expenseUrl)
            ]);

            if (!financialResponse.ok || !expenseResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const allData = await financialResponse.json();
            const financial = allData.financial;
            const members = allData.members;
            const expenses: Expense[] = await expenseResponse.json();

            console.log('[FinancialCharts] Loaded data for gymId:', gymId, 'Expenses:', expenses.length);

            // Convert expenses to financial records format for integration
            const expenseFinancialRecords = expenses.map(expense => ({
                id: expense.id,
                date: expense.date,
                description: expense.title,
                type: 'Despesa',
                amount: expense.amount,
                category: expense.category,
                userId: expense.userId
            }));

            // Use only the existing financial records from the database
            // These should already include the member payment records that were properly updated
            // when member payment dates were changed, thanks to our json-db update
            const allFinancialRecords = [...financial, ...expenseFinancialRecords];

            // Set all financial records
            setFinancialRecords(allFinancialRecords);

            // Determine what to filter by - date, month, or default to last 7 days
            let recordsToShow;
            if (selectedMonth) {
                // If a month is selected, show records for that month in the current year
                const currentYear = new Date().getFullYear();

                recordsToShow = allFinancialRecords.filter(record => {
                    const [recordYear, recordMonth] = record.date.split('-');
                    return recordMonth === selectedMonth && parseInt(recordYear) === currentYear;
                }).sort((a, b) => {
                    // Sort by date (ascending), then by type (Receita first), then by amount (descending)
                    if (a.date !== b.date) {
                        return a.date.localeCompare(b.date); // Sort dates ascending
                    }
                    if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                    if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                    return b.amount - a.amount;
                });
            } else if (preserveSelection && preserveSelection.length === 10) { // YYYY-MM-DD format has 10 characters
                // If a specific date is selected (preserveSelection is in YYYY-MM-DD format), show records for that date
                recordsToShow = allFinancialRecords.filter(record => {
                    return record.date === preserveSelection;
                }).sort((a, b) => {
                    // Sort by type (Receita first), then by amount (descending)
                    if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                    if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                    return b.amount - a.amount;
                });
            } else if (preserveSelection && preserveSelection.length === 2) { // MM format has 2 characters
                // If preserveSelection is a month (when called from refresh with month selected)
                const currentYear = new Date().getFullYear();

                recordsToShow = allFinancialRecords.filter(record => {
                    const [recordYear, recordMonth] = record.date.split('-');
                    return recordMonth === preserveSelection && parseInt(recordYear) === currentYear;
                }).sort((a, b) => {
                    // Sort by date (ascending), then by type (Receita first), then by amount (descending)
                    if (a.date !== b.date) {
                        return a.date.localeCompare(b.date); // Sort dates ascending
                    }
                    if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                    if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                    return b.amount - a.amount;
                });
            } else {
                // If no date or month is selected, show last 7 days
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);

                const recentRecords = allFinancialRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= sevenDaysAgo;
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

                // If no recent records, show all records as fallback
                recordsToShow = recentRecords.length > 0 ? recentRecords : allFinancialRecords.slice(0, 20); // Show first 20 if no recent ones
            }

            setFilteredRecords(recordsToShow);
            // Don't update selectedDate if a month is selected, to preserve the UI state
            if (!selectedMonth && preserveSelection && preserveSelection.length === 10) {
                setSelectedDate(preserveSelection);
            } else if (preserveSelection && preserveSelection.length === 2) {
                setSelectedMonth(preserveSelection);
            }

            // Calculate total revenue from all financial records
            const totalRevenue = allFinancialRecords
                .filter((record: any) => record.type === 'Receita')
                .reduce((sum: number, record: any) => sum + record.amount, 0);

            // Calculate expenses from all financial records
            const totalExpenses = allFinancialRecords
                .filter((record: any) => record.type === 'Despesa')
                .reduce((sum: number, record: any) => sum + record.amount, 0);

            setFinancialSummary({
                totalRevenue,
                totalExpenses,
                profit: totalRevenue - totalExpenses
            });

            // Prepare monthly data based on actual financial records
            const allRecords = allFinancialRecords;

            // Group records by month
            const monthlyDataMap: Record<string, { revenue: number, expenses: number }> = {};

            allRecords.forEach(record => {
                // Parse date to avoid timezone issues
                const [year, month] = record.date.split('-');
                const monthKey = `${year}-${month}`;

                if (!monthlyDataMap[monthKey]) {
                    monthlyDataMap[monthKey] = { revenue: 0, expenses: 0 };
                }

                if (record.type === 'Receita') {
                    monthlyDataMap[monthKey].revenue += record.amount;
                } else if (record.type === 'Despesa') {
                    monthlyDataMap[monthKey].expenses += record.amount;
                }
            });

            // Convert to array and format month names
            const months = Object.keys(monthlyDataMap).sort().slice(-6); // Get last 6 months
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            const monthly = months.map(monthKey => {
                const [year, monthNum] = monthKey.split('-');
                const monthName = monthNames[parseInt(monthNum) - 1];
                const data = monthlyDataMap[monthKey];

                return {
                    month: `${monthName}/${year.substring(2)}`, // Format as "Jan/25"
                    revenue: data.revenue,
                    expenses: data.expenses,
                    profit: data.revenue - data.expenses
                };
            });

            setMonthlyData(monthly);

            // Prepare category data based on all financial records
            const categories: Record<string, number> = {};

            // Add all revenue from financial records
            allFinancialRecords.forEach(record => {
                if (record.type === 'Receita') {
                    if (!categories[record.category]) {
                        categories[record.category] = 0;
                    }
                    categories[record.category] += record.amount;
                }
            });

            const catData = Object.entries(categories).map(([name, value]) => ({
                name,
                value: value as number
            }));
            setCategoryData(catData);

        } catch (error) {
            console.error("Error loading financial data:", error);

            // Fallback to mock data if API fails
            const fallbackFinancial = [
                { id: '1', date: '2025-12-01', description: 'Mensalidade - João Silva', type: 'Receita', amount: 120, category: 'Mensalidades' },
                { id: '2', date: '2025-12-01', description: 'Mensalidade - Maria Oliveira', type: 'Receita', amount: 120, category: 'Mensalidades' },
                { id: '3', date: '2025-12-05', description: 'Limpeza', type: 'Despesa', amount: 800, category: 'Manutenção' },
                { id: '4', date: '2025-12-10', description: 'Mensalidade - Carlos Souza', type: 'Receita', amount: 120, category: 'Mensalidades' },
                { id: '5', date: '2025-12-15', description: 'Salário Personal', type: 'Despesa', amount: 3500, category: 'Folha de Pagamento' },
            ];

            // Add some expense records for fallback
            const fallbackExpenses = [
                { id: '6', date: '2025-12-08', description: 'Suprimentos de limpeza', type: 'Despesa', amount: 150, category: 'Suprimentos' },
                { id: '7', date: '2025-12-12', description: 'Internet', type: 'Despesa', amount: 300, category: 'Utilidades' },
                { id: '8', date: '2025-12-18', description: 'Marketing digital', type: 'Despesa', amount: 500, category: 'Marketing' },
            ];

            const allFinancialRecords = [...fallbackFinancial, ...fallbackExpenses];
            setFinancialRecords(allFinancialRecords);

            // Calculate revenue from all records
            const totalRevenue = allFinancialRecords
                .filter((record: any) => record.type === 'Receita')
                .reduce((sum: number, record: any) => sum + record.amount, 0);

            // Calculate expenses from all records
            const totalExpenses = allFinancialRecords
                .filter((record: any) => record.type === 'Despesa')
                .reduce((sum: number, record: any) => sum + record.amount, 0);

            setFinancialSummary({
                totalRevenue,
                totalExpenses,
                profit: totalRevenue - totalExpenses
            });

            setMonthlyData([
                { month: 'Jan/25', revenue: 12000, expenses: 8000, profit: 4000 },
                { month: 'Fev/25', revenue: 13500, expenses: 8200, profit: 5300 },
                { month: 'Mar/25', revenue: 14200, expenses: 8500, profit: 5700 },
                { month: 'Abr/25', revenue: 13800, expenses: 8300, profit: 5500 },
                { month: 'Mai/25', revenue: 15000, expenses: 8700, profit: 6300 },
                { month: 'Jun/25', revenue: 14500, expenses: 8600, profit: 5900 },
            ]);

            // Calculate categories from all records (for revenue)
            const categories: Record<string, number> = {};
            allFinancialRecords.forEach(record => {
                if (record.type === 'Receita') {
                    if (!categories[record.category]) {
                        categories[record.category] = 0;
                    }
                    categories[record.category] += record.amount;
                }
            });

            const catData = Object.entries(categories).map(([name, value]) => ({
                name,
                value: value as number
            }));
            setCategoryData(catData);
        }
    };

    useEffect(() => {
        loadFinancialData();
    }, []);

    // Filter records based on selected date or month
    useEffect(() => {
        if (selectedMonth && financialRecords.length > 0) {
            // If a month is selected, show records for that month in the current year
            const currentYear = new Date().getFullYear();

            const monthlyRecords = financialRecords.filter(record => {
                const [recordYear, recordMonth] = record.date.split('-');
                return recordMonth === selectedMonth && parseInt(recordYear) === currentYear;
            }).sort((a, b) => {
                // Sort by date (ascending), then by type (Receita first), then by amount (descending)
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date); // Sort dates ascending
                }
                if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                return b.amount - a.amount;
            });

            setFilteredRecords(monthlyRecords);
        } else if (selectedDate && financialRecords.length > 0) {
            // If a specific date is selected, show records for that date
            // Using direct string comparison to avoid timezone issues
            const selectedDateRecords = financialRecords.filter(record => {
                return record.date === selectedDate;
            }).sort((a, b) => {
                // Sort by type (Receita first), then by amount (descending)
                if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                return b.amount - a.amount;
            });

            setFilteredRecords(selectedDateRecords);
        } else if (financialRecords.length > 0) {
            // If no date or month is selected, show last 7 days
            const today = new Date();
            // Format today's date to YYYY-MM-DD to avoid timezone issues
            const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            const sevenDaysAgoFormatted = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

            const recentRecords = financialRecords.filter(record => {
                // Direct string comparison to avoid timezone issues
                return record.date >= sevenDaysAgoFormatted;
            }).sort((a, b) => {
                // Sort by date (descending), then by type (Receita first), then by amount (descending)
                if (a.date !== b.date) {
                    return b.date.localeCompare(a.date); // Sort dates descending
                }
                if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                return b.amount - a.amount;
            });

            setFilteredRecords(recentRecords);
        }
    }, [selectedDate, selectedMonth, financialRecords]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <CardStackIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {financialSummary.totalRevenue.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                        <CardStackIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {financialSummary.totalExpenses.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">-3% desde o mês passado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                        <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {financialSummary.profit.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">Margem de {financialSummary.totalRevenue > 0 ? Math.round((financialSummary.profit/financialSummary.totalRevenue)*100) : 0}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => {
                        // Clear current data and reload from API
                        setFinancialRecords([]);
                        setFilteredRecords([]);
                        setMonthlyData([]);
                        setCategoryData([]);
                        setFinancialSummary({ totalRevenue: 0, totalExpenses: 0, profit: 0 });

                        // Reload the data while preserving the selected date or month
                        // Pass the selected month if it exists, otherwise pass the selected date
                        loadFinancialData(selectedMonth || selectedDate);
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M8 16H3v5"/>
                    </svg>
                    Atualizar Dados
                </Button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Desempenho Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
                                <Bar dataKey="expenses" fill="#ff7300" name="Despesas" />
                                <Bar dataKey="profit" fill="#00c49f" name="Lucro" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Receitas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Records Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Registro Financeiro ({filteredRecords.length})</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    // Directly use the value from the input which is already in YYYY-MM-DD format
                                    // This avoids any timezone conversion issues
                                    setSelectedDate(e.target.value);
                                    // Clear month selection when date is selected
                                    setSelectedMonth('');
                                }}
                                className="max-w-[200px]"
                            />
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    // When a month is selected, clear the date selection
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
                                    // Reset both date and month selections
                                    setSelectedDate('');
                                    setSelectedMonth('');
                                }}
                                variant="outline"
                                className="whitespace-nowrap"
                            >
                                Limpar
                            </Button>
                            <Button
                                onClick={() => {
                                    // Get today's date in YYYY-MM-DD format without timezone conversion
                                    const today = new Date();
                                    const year = today.getFullYear();
                                    const month = String(today.getMonth() + 1).padStart(2, '0');
                                    const day = String(today.getDate()).padStart(2, '0');
                                    const todayStr = `${year}-${month}-${day}`;
                                    setSelectedDate(todayStr);
                                    // Clear month selection when setting today's date
                                    setSelectedMonth('');
                                }}
                                variant="outline"
                                className="whitespace-nowrap"
                            >
                                Hoje
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Transação
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Nova Transação</DialogTitle>
                                        <DialogDescription>
                                            Preencha as informações da transação.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="date" className="text-right">
                                                Data
                                            </label>
                                            <Input id="date" type="date" className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="description" className="text-right">
                                                Descrição
                                            </label>
                                            <Input id="description" className="col-span-3" placeholder="Descrição da transação" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="type" className="text-right">
                                                Tipo
                                            </label>
                                            <select id="type" className="col-span-3 border rounded-md px-3 py-2">
                                                <option value="Receita">Receita</option>
                                                <option value="Despesa">Despesa</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="amount" className="text-right">
                                                Valor
                                            </label>
                                            <Input id="amount" type="number" className="col-span-3" placeholder="R$" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <label htmlFor="category" className="text-right">
                                                Categoria
                                            </label>
                                            <select id="category" className="col-span-3 border rounded-md px-3 py-2">
                                                <option value="Mensalidades">Mensalidades</option>
                                                <option value="Personal Trainers">Personal Trainers</option>
                                                <option value="Manutenção">Manutenção</option>
                                                <option value="Folha de Pagamento">Folha de Pagamento</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit">Salvar Transação</Button>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            {selectedDate
                                ? `Mostrando registros para: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`
                                : 'Mostrando registros dos últimos 7 dias'}
                        </p>
                        <Button variant="outline" className="text-sm">
                            <Link href="/app/expenses">Ver todas as despesas</Link>
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left py-2">Data</th>
                                    <th className="text-left py-2">Descrição</th>
                                    <th className="text-left py-2">Categoria</th>
                                    <th className="text-left py-2">Tipo</th>
                                    <th className="text-left py-2">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="border-t">
                                            <td className="py-2">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="py-2 font-medium">{record.description}</td>
                                            <td className="py-2">
                                                <Badge variant="outline">{record.category}</Badge>
                                            </td>
                                            <td className="py-2">
                                                <Badge variant={record.type === 'Receita' ? 'default' : 'secondary'}>
                                                    {record.type}
                                                </Badge>
                                            </td>
                                            <td className="py-2">
                                                {record.type === 'Receita' ? '+' : '-'} R$ {record.amount}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum registro financeiro encontrado para a data selecionada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}