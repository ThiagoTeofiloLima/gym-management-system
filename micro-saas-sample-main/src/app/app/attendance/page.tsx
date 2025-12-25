import {
    DashboardPage,
    DashboardPageHeader,
    DashboardPageHeaderTitle,
    DashboardPageMain,
} from "@/components/dashboard/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import {Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { jsonDb } from "@/services/json-db";

export default async function AttendancePage() {
    // Get all attendance records from the database
    const allData = await jsonDb.getData();
    const attendance = allData.attendance;

    // Calculate attendance summary
    const today = new Date().toISOString().split('T')[0];
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    const currentWeekEnd = new Date();
    currentWeekEnd.setDate(currentWeekEnd.getDate() + (6 - currentWeekEnd.getDay()));
    
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const todayRecords = attendance.filter(record => record.date === today && record.status === 'Presente');
    const weekRecords = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= currentWeekStart && 
               recordDate <= currentWeekEnd && 
               record.status === 'Presente';
    });
    const monthRecords = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= currentMonthStart && 
               recordDate <= currentMonthEnd && 
               record.status === 'Presente';
    });

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Frequência</DashboardPageHeaderTitle>
                <div className="flex gap-2">
                    <Input type="date" className="w-auto" />
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" /> Filtrar
                    </Button>
                </div>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <CardTitle>Registro de Frequência ({attendance.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Membro</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>Check-out</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{new Date(record.date).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="font-medium">{record.member}</TableCell>
                                        <TableCell>
                                            {record.checkIn ? record.checkIn : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {record.checkOut ? record.checkOut : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={record.status === 'Presente' ? 'default' : 'secondary'}>
                                                {record.status === 'Presente' ? (
                                                    <CheckIcon className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <Cross2Icon className="mr-1 h-3 w-3" />
                                                )}
                                                {record.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo de Frequência</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-medium">Hoje</h3>
                                <p className="text-2xl font-bold">{todayRecords.length}</p>
                                <p className="text-sm text-muted-foreground">Presentes</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-medium">Esta Semana</h3>
                                <p className="text-2xl font-bold">{weekRecords.length}</p>
                                <p className="text-sm text-muted-foreground">Presentes</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-medium">Este Mês</h3>
                                <p className="text-2xl font-bold">{monthRecords.length}</p>
                                <p className="text-sm text-muted-foreground">Presentes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}