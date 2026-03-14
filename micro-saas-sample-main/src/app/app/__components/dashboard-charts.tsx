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
    Cell,
    LineChart,
    Line
} from "recharts";
import {
    BarChartIcon,
    PersonIcon,
    CalendarIcon
} from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { DashboardData } from "../(home)/types";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// The attendanceData and membershipData will be fetched from the gymData prop
// and updated in state based on the fetched data

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface DashboardChartsProps {
    gymData: DashboardData;
}

export function DashboardCharts({ gymData }: DashboardChartsProps) {
    const searchParams = useSearchParams()
    const gymId = searchParams?.get('gymId')
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [membershipData, setMembershipData] = useState<any[]>([]);

    useEffect(() => {
        const loadChartData = async () => {
            try {
                // Fetch data com gymId para filtrar por academia
                const url = gymId ? `/api/data?gymId=${gymId}` : '/api/data';
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const allData = await response.json();
                const members = allData.members;
                const attendance = allData.attendance;

                console.log('[DashboardCharts] Loaded data for gymId:', gymId, 'Members:', members.length);

                // Prepare attendance data for chart by grouping by day of week
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const today = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(today.getDate() - 7);

                // Filter attendance records from the last week
                const recentAttendance = attendance.filter((record: any) => {
                    const recordDate = new Date(record.date);
                    return recordDate >= oneWeekAgo && record.status === 'Presente';
                });

                // Group attendance by day of week
                const attendanceByDay = days.map(day => {
                    // Count attendance for each day of the week
                    const dayAttendance = recentAttendance.filter((record: any) => {
                        const recordDate = new Date(record.date);
                        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        return dayNames[recordDate.getDay()] === day;
                    });

                    return {
                        day,
                        present: dayAttendance.length
                    };
                });

                setAttendanceData(attendanceByDay);

                // Prepare membership data
                const membershipCounts = members.reduce((acc: Record<string, number>, member: any) => {
                    acc[member.plan] = (acc[member.plan] || 0) + 1;
                    return acc;
                }, {});

                const membershipArray = Object.entries(membershipCounts).map(([name, value]) => ({
                    name,
                    value: value as number
                }));

                setMembershipData(membershipArray);

            } catch (error) {
                console.error("Error loading chart data:", error);

                // Fallback to mock data if API fails
                const mockAttendanceData = [
                    { day: 'Seg', present: 45 },
                    { day: 'Ter', present: 52 },
                    { day: 'Qua', present: 48 },
                    { day: 'Qui', present: 55 },
                    { day: 'Sex', present: 62 },
                    { day: 'Sáb', present: 40 },
                    { day: 'Dom', present: 25 },
                ];
                setAttendanceData(mockAttendanceData);

                const mockMembershipData = [
                    { name: 'Mensal', value: 65 },
                    { name: 'Trimestral', value: 25 },
                    { name: 'Anual', value: 10 },
                ];
                setMembershipData(mockMembershipData);
            }
        };

        loadChartData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
                        <PersonIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gymData.activeMembers}</div>
                        <p className="text-xs text-muted-foreground">+{gymData.newMembers} este mês</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Frequência</CardTitle>
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gymData.attendanceRate}%</div>
                        <p className="text-xs text-muted-foreground">Taxa de comparecimento</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita</CardTitle>
                        <BarChartIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {gymData.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                        <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {gymData.profit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Margem de {gymData.revenue > 0 ? Math.round((gymData.profit/gymData.revenue)*100) : 0}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Frequência Semanal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="present" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tipos de Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={membershipData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {membershipData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AnalyticsCharts() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [membershipData, setMembershipData] = useState<any[]>([]);
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
    const [memberGrowth, setMemberGrowth] = useState<any[]>([]);
    const [workoutPopularity, setWorkoutPopularity] = useState<any[]>([]);

    useEffect(() => {
        const loadChartData = async () => {
            try {
                // Fetch data from API route instead of direct file access
                const response = await fetch('/api/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const allData = await response.json();
                const members = allData.members;
                const attendance = allData.attendance;

                // Prepare attendance data for chart by grouping by day of week
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const today = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(today.getDate() - 7);

                // Filter attendance records from the last week
                const recentAttendance = attendance.filter((record: any) => {
                    const recordDate = new Date(record.date);
                    return recordDate >= oneWeekAgo && record.status === 'Presente';
                });

                // Group attendance by day of week
                const attendanceByDay = days.map(day => {
                    // Count attendance for each day of the week
                    const dayAttendance = recentAttendance.filter((record: any) => {
                        const recordDate = new Date(record.date);
                        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        return dayNames[recordDate.getDay()] === day;
                    });

                    return {
                        day,
                        present: dayAttendance.length
                    };
                });

                setChartData(attendanceByDay);

                // Prepare membership data
                const membershipCounts = members.reduce((acc: Record<string, number>, member: any) => {
                    acc[member.plan] = (acc[member.plan] || 0) + 1;
                    return acc;
                }, {});

                const membershipArray = Object.entries(membershipCounts).map(([name, value]) => ({
                    name,
                    value: value as number
                }));

                setMembershipData(membershipArray);

            } catch (error) {
                console.error("Error loading chart data:", error);

                // Fallback to mock data if API fails
                setChartData([
                    { day: 'Seg', present: 45 },
                    { day: 'Ter', present: 52 },
                    { day: 'Qua', present: 48 },
                    { day: 'Qui', present: 55 },
                    { day: 'Sex', present: 62 },
                    { day: 'Sáb', present: 40 },
                    { day: 'Dom', present: 25 },
                ]);

                setMembershipData([
                    { name: 'Mensal', value: 65 },
                    { name: 'Trimestral', value: 25 },
                    { name: 'Anual', value: 10 },
                ]);
            }
        };

        loadChartData();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Update the useEffect to also set the other chart data
    useEffect(() => {
        const loadChartData = async () => {
            try {
                // Fetch data from API route instead of direct file access
                const response = await fetch('/api/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const allData = await response.json();
                const members = allData.members;
                const attendance = allData.attendance;

                // Prepare monthly attendance data
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                // Group attendance by month for the current year
                const currentYear = new Date().getFullYear();
                const monthlyAttendanceData = months.map(month => {
                    // Convert month name to number for comparison
                    const monthMap: Record<string, number> = {
                        'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
                        'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
                    };

                    const monthIndex = monthMap[month];
                    const monthAttendance = attendance.filter((record: any) => {
                        const recordDate = new Date(record.date);
                        return recordDate.getFullYear() === currentYear &&
                               recordDate.getMonth() === monthIndex &&
                               record.status === 'Presente';
                    });

                    return {
                        month,
                        attendance: monthAttendance.length
                    };
                });

                setMonthlyAttendance(monthlyAttendanceData);

                // Prepare membership data
                const membershipCounts = members.reduce((acc: Record<string, number>, member: any) => {
                    acc[member.plan] = (acc[member.plan] || 0) + 1;
                    return acc;
                }, {});

                const membershipArray = Object.entries(membershipCounts).map(([name, value]) => ({
                    name,
                    value: value as number
                }));

                setMembershipData(membershipArray);

                // For member growth, we'll use mock data since we don't have historical data
                const mockMemberGrowth = [
                    { month: 'Jan', new: 12, churned: 3 },
                    { month: 'Fev', new: 15, churned: 2 },
                    { month: 'Mar', new: 18, churned: 4 },
                    { month: 'Abr', new: 14, churned: 3 },
                    { month: 'Mai', new: 16, churned: 2 },
                    { month: 'Jun', new: 20, churned: 1 },
                    { month: 'Jul', new: 17, churned: 3 },
                    { month: 'Ago', new: 19, churned: 2 },
                    { month: 'Set', new: 22, churned: 4 },
                    { month: 'Out', new: 25, churned: 3 },
                    { month: 'Nov', new: 21, churned: 2 },
                    { month: 'Dez', new: 18, churned: 3 },
                ];
                setMemberGrowth(mockMemberGrowth);

                // For workout popularity, we'll use mock data since we don't have workout data
                const mockWorkoutPopularity = [
                    { name: 'Musculação', value: 35 },
                    { name: 'Yoga', value: 20 },
                    { name: 'Crossfit', value: 25 },
                    { name: 'Pilates', value: 15 },
                    { name: 'Cardio', value: 5 },
                ];
                setWorkoutPopularity(mockWorkoutPopularity);

            } catch (error) {
                console.error("Error loading chart data:", error);

                // Fallback to mock data if API fails
                setChartData([
                    { day: 'Seg', present: 45 },
                    { day: 'Ter', present: 52 },
                    { day: 'Qua', present: 48 },
                    { day: 'Qui', present: 55 },
                    { day: 'Sex', present: 62 },
                    { day: 'Sáb', present: 40 },
                    { day: 'Dom', present: 25 },
                ]);

                setMembershipData([
                    { name: 'Mensal', value: 65 },
                    { name: 'Trimestral', value: 25 },
                    { name: 'Anual', value: 10 },
                ]);

                const mockMonthlyAttendance = [
                    { month: 'Jan', attendance: 85 },
                    { month: 'Fev', attendance: 88 },
                    { month: 'Mar', attendance: 92 },
                    { month: 'Abr', attendance: 87 },
                    { month: 'Mai', attendance: 90 },
                    { month: 'Jun', attendance: 93 },
                    { month: 'Jul', attendance: 91 },
                    { month: 'Ago', attendance: 89 },
                    { month: 'Set', attendance: 94 },
                    { month: 'Out', attendance: 95 },
                    { month: 'Nov', attendance: 92 },
                    { month: 'Dez', attendance: 85 },
                ];
                setMonthlyAttendance(mockMonthlyAttendance);

                const mockMemberGrowth = [
                    { month: 'Jan', new: 12, churned: 3 },
                    { month: 'Fev', new: 15, churned: 2 },
                    { month: 'Mar', new: 18, churned: 4 },
                    { month: 'Abr', new: 14, churned: 3 },
                    { month: 'Mai', new: 16, churned: 2 },
                    { month: 'Jun', new: 20, churned: 1 },
                    { month: 'Jul', new: 17, churned: 3 },
                    { month: 'Ago', new: 19, churned: 2 },
                    { month: 'Set', new: 22, churned: 4 },
                    { month: 'Out', new: 25, churned: 3 },
                    { month: 'Nov', new: 21, churned: 2 },
                    { month: 'Dez', new: 18, churned: 3 },
                ];
                setMemberGrowth(mockMemberGrowth);

                const mockWorkoutPopularity = [
                    { name: 'Musculação', value: 35 },
                    { name: 'Yoga', value: 20 },
                    { name: 'Crossfit', value: 25 },
                    { name: 'Pilates', value: 15 },
                    { name: 'Cardio', value: 5 },
                ];
                setWorkoutPopularity(mockWorkoutPopularity);
            }
        };

        loadChartData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Taxa de Frequência ao Longo do Ano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyAttendance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tipos de Treino Mais Populares</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={workoutPopularity}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {workoutPopularity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Crescimento e Churn de Membros</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={memberGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="new" fill="#8884d8" name="Novos Membros" />
                            <Bar dataKey="churned" fill="#ff7300" name="Membros Cancelaram" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}