'use client';

import { useState, useEffect } from 'react';
import { dbApi, Attendance, Member } from "@/services/db-api";
import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock function to get current user ID - in a real app, this would come from session
async function getCurrentUserId() {
  // Return the mock user ID
  return "user-1";
}

export default function AttendancePage() {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Function to format time
    const formatTime = (timeString: string | null) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    // Load attendance data when component mounts
    useEffect(() => {
        const loadAttendance = async () => {
            try {
                const userId = await getCurrentUserId();

                // Get all data for the user (members and attendance)
                const allData = await dbApi.getAllDataByUserId(userId);

                // Store all members and attendance for later use
                setAttendanceData(allData.attendance);
                setFilteredAttendance([]); // Will be populated by the date filter

                // Set default to today's date
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);

                // Filter for today by default
                const todayAttendance = allData.attendance.filter(
                    record => record.date === today
                );

                // Only show members who attended (had check-in) on the selected date
                const attendedMembers = todayAttendance.filter(
                    record => record.status === 'Presente' || record.checkIn !== null
                );

                // Sort by member name
                const sortedAttendance = attendedMembers.sort((a, b) =>
                    a.member.localeCompare(b.member)
                );

                setFilteredAttendance(sortedAttendance);
            } catch (error) {
                console.error('Error loading attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAttendance();
    }, []);

    // Filter attendance based on selected date
    useEffect(() => {
        const loadAttendanceForDate = async () => {
            if (selectedDate) {
                try {
                    const userId = await getCurrentUserId();
                    const allData = await dbApi.getAllDataByUserId(userId);

                    // Get attendance records for the selected date
                    const dateAttendance = allData.attendance.filter(
                        record => record.date === selectedDate
                    );

                    // Only show members who attended (had check-in) on the selected date
                    const attendedMembers = dateAttendance.filter(
                        record => record.status === 'Presente' || record.checkIn !== null
                    );

                    // Sort by member name
                    const sortedAttendance = attendedMembers.sort((a, b) =>
                        a.member.localeCompare(b.member)
                    );

                    setFilteredAttendance(sortedAttendance);
                } catch (error) {
                    console.error('Error filtering attendance:', error);
                }
            }
        };

        loadAttendanceForDate();
    }, [selectedDate]);

    // Get unique dates for the date selector
    const uniqueDates = Array.from(new Set(attendanceData.map(record => record.date))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Frequência</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle>Registros de Frequência ({filteredAttendance.length} membros presentes)</CardTitle>
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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Carregando registros de frequência...</p>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        Data selecionada: {selectedDate ? formatDate(selectedDate) : 'Nenhuma data selecionada'}
                                    </p>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Membro</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Entrada</TableHead>
                                            <TableHead>Saída</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAttendance.length > 0 ? (
                                            filteredAttendance.map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell className="font-medium">{record.member}</TableCell>
                                                    <TableCell>{record.memberEmail}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="h-4 w-4" />
                                                            {formatTime(record.checkIn)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="h-4 w-4" />
                                                            {formatTime(record.checkOut)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={record.status === 'Presente' ? 'default' : 'secondary'}>
                                                            {record.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    Nenhum membro compareceu nesta data.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {filteredAttendance.length === 0 && !loading && selectedDate && (
                                    <p className="text-center text-muted-foreground py-4">
                                        Nenhum registro de frequência encontrado para a data selecionada.
                                    </p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Date Selector Card */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Datas Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {uniqueDates.length > 0 ? (
                                uniqueDates.map((date) => (
                                    <Button
                                        key={date}
                                        variant={selectedDate === date ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        {formatDate(date)}
                                    </Button>
                                ))
                            ) : (
                                <p className="text-muted-foreground">Nenhuma data registrada</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}