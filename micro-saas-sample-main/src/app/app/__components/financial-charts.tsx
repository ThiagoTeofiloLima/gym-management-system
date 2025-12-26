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

export function FinancialCharts() {
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

    useEffect(() => {
        const loadFinancialData = async () => {
            try {
                const response = await fetch('/api/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const allData = await response.json();
                const financial = allData.financial;
                const members = allData.members;

                // Generate financial records based on member plan renewals
                const planBasedFinancialRecords = generateFinancialRecordsFromMembers(members);

                // Combine with existing financial records
                const allFinancialRecords = [...financial, ...planBasedFinancialRecords];

                // Set all financial records
                setFinancialRecords(allFinancialRecords);

                // Set default to show last 7 days
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);

                // Filter records to show only those from the last 7 days
                const recentRecords = allFinancialRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= sevenDaysAgo;
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

                // If no recent records, show all records as fallback
                const recordsToShow = recentRecords.length > 0 ? recentRecords : allFinancialRecords.slice(0, 20); // Show first 20 if no recent ones

                setFilteredRecords(recordsToShow);
                setSelectedDate(today.toISOString().split('T')[0]); // Set today as default selected date

                // Calculate revenue from members based on their plans
                const planBasedRevenue = calculateRevenueFromMembers(members);

                // Calculate additional revenue from financial records (non-plan related)
                const additionalRevenue = financial
                    .filter((record: any) => record.type === 'Receita' && !record.description.includes('Mensalidade'))
                    .reduce((sum: number, record: any) => sum + record.amount, 0);

                // Calculate total revenue (plan-based + additional)
                const totalRevenue = planBasedRevenue + additionalRevenue;

                // Calculate expenses from financial records
                const totalExpenses = financial
                    .filter((record: any) => record.type === 'Despesa')
                    .reduce((sum: number, record: any) => sum + record.amount, 0);

                setFinancialSummary({
                    totalRevenue,
                    totalExpenses,
                    profit: totalRevenue - totalExpenses
                });

                // Prepare monthly data (simplified for demo)
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
                const monthly = months.map(month => {
                    // This is a simplified calculation - in a real app you'd group by month
                    return {
                        month,
                        revenue: totalRevenue / 6 + Math.random() * 2000,
                        expenses: totalExpenses / 6 + Math.random() * 1000,
                        profit: (totalRevenue - totalExpenses) / 6 + Math.random() * 1000
                    };
                });
                setMonthlyData(monthly);

                // Prepare category data based on plan pricing breakdown
                const planBreakdown = getPlanPricingBreakdown(members);

                // Also include non-plan related revenue from financial records
                const categories = financial.reduce((acc: Record<string, number>, record: any) => {
                    if (!acc[record.category]) {
                        acc[record.category] = 0;
                    }
                    if (record.type === 'Receita' && !record.description.includes('Mensalidade')) {
                        acc[record.category] += record.amount;
                    }
                    return acc;
                }, {});

                // Add plan-based revenue to categories
                Object.entries(planBreakdown).forEach(([planType, data]) => {
                    if (data.total > 0) {
                        categories[`${planType} (Mensalidades)`] = data.total;
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
                setFinancialRecords([
                    { id: '1', date: '2025-12-01', description: 'Mensalidade - João Silva', type: 'Receita', amount: 120, category: 'Mensalidades' },
                    { id: '2', date: '2025-12-01', description: 'Mensalidade - Maria Oliveira', type: 'Receita', amount: 120, category: 'Mensalidades' },
                    { id: '3', date: '2025-12-05', description: 'Limpeza', type: 'Despesa', amount: 800, category: 'Manutenção' },
                    { id: '4', date: '2025-12-10', description: 'Mensalidade - Carlos Souza', type: 'Receita', amount: 120, category: 'Mensalidades' },
                    { id: '5', date: '2025-12-15', description: 'Salário Personal', type: 'Despesa', amount: 3500, category: 'Folha de Pagamento' },
                ]);

                setMonthlyData([
                    { month: 'Jan', revenue: 12000, expenses: 8000, profit: 4000 },
                    { month: 'Fev', revenue: 13500, expenses: 8200, profit: 5300 },
                    { month: 'Mar', revenue: 14200, expenses: 8500, profit: 5700 },
                    { month: 'Abr', revenue: 13800, expenses: 8300, profit: 5500 },
                    { month: 'Mai', revenue: 15000, expenses: 8700, profit: 6300 },
                    { month: 'Jun', revenue: 14500, expenses: 8600, profit: 5900 },
                ]);

                setCategoryData([
                    { name: 'Mensalidades', value: 75 },
                    { name: 'Personal Trainers', value: 15 },
                    { name: 'Manutenção', value: 10 },
                ]);
            }
        };

        loadFinancialData();
    }, []);

    // Filter records based on selected date
    useEffect(() => {
        if (selectedDate && financialRecords.length > 0) {
            // If a specific date is selected, show records for that date
            const selectedDateRecords = financialRecords.filter(record => {
                return record.date === selectedDate;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setFilteredRecords(selectedDateRecords);
        } else if (financialRecords.length > 0) {
            // If no date is selected, show last 7 days
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);

            const recentRecords = financialRecords.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= sevenDaysAgo;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setFilteredRecords(recentRecords);
        }
    }, [selectedDate, financialRecords]);

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
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="max-w-[200px]"
                            />
                            <Button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setSelectedDate(today);
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
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            {selectedDate
                                ? `Mostrando registros para: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`
                                : 'Mostrando registros dos últimos 7 dias'}
                        </p>
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