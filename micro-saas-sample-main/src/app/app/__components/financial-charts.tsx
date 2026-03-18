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
    CardStackIcon,
    DashboardIcon
} from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { getGymPlans, getPlanPrice } from "@/services/plan-pricing";
import { useSearchParams } from "next/navigation";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

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

interface GymPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface FinancialData {
  members: any[];
  expenses: Expense[];
  gymPlans: GymPlan[];
  projectedRevenue: number;
  membersByPlan: Record<string, { count: number; revenue: number }>;
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  monthlyHistory: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  categoryData: Array<{ name: string; value: number }>;
  totalRevenue: number;
  totalExpenses: number;
}

export function FinancialCharts() {
    const searchParams = useSearchParams()
    const gymId = searchParams?.get('gymId')

    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
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
    const [loading, setLoading] = useState(true);

    // Carregar dados financeiros
    const loadFinancialData = async (preserveSelection?: string) => {
        setLoading(true);
        try {
            const url = gymId ? `/api/financial/data?gymId=${gymId}` : '/api/financial/data';
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('Erro ao carregar dados financeiros');
            }

            const data: FinancialData = await res.json();
            setFinancialData(data);

            // Atualizar mapa de preços global
            const planPriceMap = new Map<string, number>();
            data.gymPlans.forEach((plan: GymPlan) => {
                if (plan.isActive) {
                    planPriceMap.set(plan.name.toLowerCase(), plan.price);
                }
            });
            (window as any).__gymPlanPriceMap = planPriceMap;

            // Criar registros financeiros
            const revenueRecords = data.members
                .filter((m: any) => m.status === 'Ativo' || m.status === 'ativo')
                .map((member: any) => {
                    const price = getPlanPrice(member.plan);
                    return {
                        id: `revenue-${member.id}-${member.paymentDate}`,
                        date: member.paymentDate,
                        description: `Mensalidade - ${member.name}`,
                        type: 'Receita',
                        amount: price,
                        category: member.plan,
                    };
                });

            const expenseRecords = data.expenses.map((expense: Expense) => ({
                id: expense.id,
                date: expense.date,
                description: expense.title,
                type: 'Despesa',
                amount: expense.amount,
                category: expense.category,
            }));

            const allRecords = [...revenueRecords, ...expenseRecords];
            setFinancialRecords(allRecords);

            // Atualizar resumos
            const totalRevenue = revenueRecords.reduce((sum, r) => sum + r.amount, 0);
            const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);

            setFinancialSummary({
                totalRevenue,
                totalExpenses,
                profit: totalRevenue - totalExpenses
            });

            // Preparar dados mensais
            const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};
            
            allRecords.forEach(record => {
                const [year, month] = record.date.split('-');
                const key = `${year}-${month}`;
                
                if (!monthlyMap[key]) {
                    monthlyMap[key] = { revenue: 0, expenses: 0 };
                }
                
                if (record.type === 'Receita') {
                    monthlyMap[key].revenue += record.amount;
                } else {
                    monthlyMap[key].expenses += record.amount;
                }
            });

            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const monthly = Object.keys(monthlyMap)
                .sort()
                .slice(-6)
                .map(key => {
                    const [year, monthNum] = key.split('-');
                    const monthName = monthNames[parseInt(monthNum) - 1];
                    return {
                        month: `${monthName}/${year.substring(2)}`,
                        revenue: monthlyMap[key].revenue,
                        expenses: monthlyMap[key].expenses,
                        profit: monthlyMap[key].revenue - monthlyMap[key].expenses,
                    };
                });

            setMonthlyData(monthly);

            // Dados por categoria
            const categoryMap: Record<string, number> = {};
            expenseRecords.forEach(record => {
                if (!categoryMap[record.category]) {
                    categoryMap[record.category] = 0;
                }
                categoryMap[record.category] += record.amount;
            });

            const categories = Object.entries(categoryMap).map(([name, value]) => ({
                name,
                value,
            }));
            setCategoryData(categories);

            // Filtrar registros
            let recordsToShow = allRecords;
            if (selectedMonth) {
                recordsToShow = allRecords.filter(record => {
                    const [recordYear, recordMonth] = record.date.split('-');
                    return recordMonth === selectedMonth && parseInt(recordYear) === new Date().getFullYear();
                });
            } else if (selectedDate) {
                recordsToShow = allRecords.filter(record => record.date === selectedDate);
            }

            setFilteredRecords(recordsToShow.sort((a, b) => {
                if (a.type === 'Receita' && b.type !== 'Receita') return -1;
                if (a.type !== 'Receita' && b.type === 'Receita') return 1;
                return b.amount - a.amount;
            }));

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFinancialData();
    }, [gymId]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <DashboardIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando dados financeiros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Receita Projetada por Planos */}
            {financialData && financialData.gymPlans.length > 0 && Object.keys(financialData.membersByPlan).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Receita Projetada por Planos
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Projeção mensal baseada nos planos ativos dos membros
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    Receita Mensal Projetada
                                </div>
                                <div className="text-4xl font-bold text-green-700 dark:text-green-300">
                                    R$ {financialData.projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                    Baseado em {Object.values(financialData.membersByPlan).reduce((sum: any, p: any) => sum + p.count, 0)} membro(s) ativo(s)
                                </p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                                    <BarChart3 className="h-4 w-4" />
                                    Ticket Médio por Membro
                                </div>
                                <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                                    R$ {(Object.keys(financialData.membersByPlan).length > 0 
                                        ? financialData.projectedRevenue / Object.values(financialData.membersByPlan).reduce((sum: any, p: any) => sum + p.count, 0) 
                                        : 0
                                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    {financialData.gymPlans.length} plano(s) cadastrado(s)
                                </p>
                            </div>
                        </div>
                        
                        {/* Distribuição de Membros por Plano */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Object.entries(financialData.membersByPlan).map(([planName, data]: [string, any]) => {
                                const plan = financialData.gymPlans.find(p => p.name.toLowerCase() === planName.toLowerCase());
                                return (
                                    <div key={planName} className="bg-muted/50 p-3 rounded-lg border text-center hover:border-primary transition-colors">
                                        <div className="text-xs font-medium text-muted-foreground mb-1 truncate" title={planName}>{planName}</div>
                                        <div className="text-2xl font-bold">{data.count}</div>
                                        <div className="text-xs text-muted-foreground">membro(s)</div>
                                        {plan && (
                                            <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                                R$ {plan.price.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <CardStackIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {financialSummary.totalRevenue.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">último período</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                        <CardStackIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {financialSummary.totalExpenses.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground">último período</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                        <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {financialSummary.profit.toLocaleString('pt-BR')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Margem de {financialSummary.totalRevenue > 0 ? Math.round((financialSummary.profit/financialSummary.totalRevenue)*100) : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolução Mensal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Evolução Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    />
                                    <Bar dataKey="revenue" fill="#22c55e" name="Receitas" />
                                    <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Sem dados disponíveis
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Despesas por Categoria */}
                <Card>
                    <CardHeader>
                        <CardTitle>Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Sem despesas registradas
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Registros Detalhados */}
            <Card>
                <CardHeader>
                    <CardTitle>Registros Financeiros</CardTitle>
                    <div className="flex gap-2 mt-4">
                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setSelectedDate('');
                            }}
                            className="w-40"
                            placeholder="Mês"
                        />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedMonth('');
                            }}
                            className="w-40"
                            placeholder="Data"
                        />
                        <Button
                            onClick={() => {
                                setSelectedMonth('');
                                setSelectedDate('');
                                loadFinancialData();
                            }}
                            variant="outline"
                            size="sm"
                        >
                            Limpar
                        </Button>
                        <Button
                            onClick={() => loadFinancialData(selectedMonth || selectedDate)}
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Atualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredRecords.length > 0 ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filteredRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            record.type === 'Receita' 
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {record.type === 'Receita' ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium">{record.description}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(record.date).toLocaleDateString('pt-BR')}
                                                {record.category && (
                                                    <>
                                                        {' • '}
                                                        <Badge variant="outline" className="text-xs">
                                                            {record.category}
                                                        </Badge>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${
                                        record.type === 'Receita' 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {record.type === 'Receita' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum registro financeiro encontrado</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
