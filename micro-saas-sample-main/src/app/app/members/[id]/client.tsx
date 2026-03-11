"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PencilIcon, TrashIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { DashboardPage, DashboardPageHeader, DashboardPageHeaderTitle, DashboardPageMain } from "@/components/dashboard/page";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

// Import the payment status function from the plan pricing service
import { getPaymentStatus } from "@/services/plan-pricing";

// Função para determinar o status do plano com base na data de pagamento e plano
function getPlanStatus(paymentDate: string, plan: string) {
  return getPaymentStatus(paymentDate, plan);
}

// Mock auth function to get the current user - in a real app, this would come from next-auth
async function getCurrentUser() {
  // Return a mock session with a default user
  return {
    user: {
      id: "user-1",
      name: "Thiago Lima",
      email: "thiago.lima.amazoniatelecom@gmail.com",
      image: null,
    },
    expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  };
}

interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    lastVisit: string;
    planRenewalDate: string; // Data de renovação do plano
    paymentDate: string; // Data de pagamento
}

interface Attendance {
    id: string;
    date: string;
    member: string;
    memberEmail: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    userId: string;
}

export default function MemberDetailPageClient({ member }: { member: Member }) {
    const router = useRouter();
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');

    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Function to format time
    const formatTime = (timeString: string | null) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    // Load attendance records when component mounts
    useEffect(() => {
        const loadAttendance = async () => {
            try {
                const session = await getCurrentUser();
                const userId = session.user.id;

                const response = await fetch(`/api/attendance/${member.id}?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setAttendanceRecords(data);
                }
            } catch (error) {
                console.error('Error loading attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAttendance();
    }, [member.id]);

    const updateMember = async () => {
        // Get form values
        const name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('edit-email') as HTMLInputElement).value;
        const phone = (document.getElementById('edit-phone') as HTMLInputElement).value;
        const plan = (document.getElementById('edit-plan') as HTMLSelectElement).value;
        const status = (document.getElementById('edit-status') as HTMLSelectElement).value;
        const paymentDate = (document.getElementById('edit-paymentDate') as HTMLInputElement).value;

        // Calculate renewal date based on payment date and plan
        // Parse the date string to avoid timezone issues
        const [year, month, day] = paymentDate.split('-').map(Number);
        const paymentDateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date

        let renewalYear = year;
        let renewalMonth = month - 1; // month is 0-indexed in JS Date
        let renewalDay = day;

        switch(plan.toLowerCase()) {
            case 'mensal':
                renewalMonth += 1;
                break;
            case 'trimestral':
                renewalMonth += 3;
                break;
            case 'anual':
                renewalYear += 1;
                break;
            default:
                renewalMonth += 1; // Default to monthly
        }

        // Handle month overflow
        const renewalDate = new Date(renewalYear, renewalMonth, renewalDay);

        // Format date back to YYYY-MM-DD format to avoid timezone conversion
        const formattedYear = renewalDate.getFullYear();
        const formattedMonth = String(renewalDate.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(renewalDate.getDate()).padStart(2, '0');
        const planRenewalDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;

        try {
            const response = await fetch(`/api/members/${member.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    plan,
                    status,
                    planRenewalDate,
                    paymentDate  // Include the payment date in the update
                }),
            });

            if (response.ok) {
                // Refresh the page to show updated data
                router.refresh();
            } else {
                alert('Erro ao atualizar membro');
            }
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Erro ao atualizar membro');
        }
    };

    const deleteMember = async () => {
        try {
            const response = await fetch(`/api/members/${member.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Redirect to members list page
                router.push('/app/members');
            } else {
                alert('Erro ao excluir membro');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Erro ao excluir membro');
        }
    };

    const recordAttendance = async () => {
        try {
            const session = await getCurrentUser();
            const userId = session.user.id;

            const response = await fetch(`/api/attendance/${member.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0], // Today's date
                    checkIn: checkInTime || null,
                    checkOut: checkOutTime || null,
                    userId
                }),
            });

            if (response.ok) {
                const newAttendance = await response.json();
                setAttendanceRecords(prev => [newAttendance, ...prev]); // Add to the beginning of the list
                setCheckInTime('');
                setCheckOutTime('');
                // Update the member's last visit date
                router.refresh();
            } else {
                alert('Erro ao registrar frequência');
            }
        } catch (error) {
            console.error('Error recording attendance:', error);
            alert('Erro ao registrar frequência');
        }
    };

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Detalhes do Membro</DashboardPageHeaderTitle>
            </DashboardPageHeader>

            <DashboardPageMain>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Member Info Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Informações do Membro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nome</Label>
                                    <p className="text-lg font-semibold">{member.name}</p>
                                </div>
                                <div>
                                    <Label>ID do Membro</Label>
                                    <p className="text-muted-foreground">{member.id}</p>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <p className="text-muted-foreground">{member.email}</p>
                                </div>
                                <div>
                                    <Label>Telefone</Label>
                                    <p className="text-muted-foreground">{member.phone}</p>
                                </div>
                                <div>
                                    <Label>Plano</Label>
                                    <Badge variant={(member.plan === 'Mensal' ? 'default' :
                                                  member.plan === 'Trimestral' ? 'secondary' :
                                                  'outline') as any}>
                                        {member.plan}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Badge variant={(member.status === 'Ativo' ? 'default' : 'destructive') as any}>
                                        {member.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Última Visita</Label>
                                    <p className="text-muted-foreground">{formatDate(member.lastVisit)}</p>
                                </div>
                                <div>
                                    <Label>Data de Pagamento</Label>
                                    <p className="text-muted-foreground">{formatDate(member.paymentDate)}</p>
                                </div>
                                <div>
                                    <Label>Status do Plano</Label>
                                    <Badge variant={getPlanStatus(member.paymentDate, member.plan).variant as any}>
                                        {getPlanStatus(member.paymentDate, member.plan).label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <PencilIcon className="h-4 w-4" />
                                            Editar Informações
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Informações do Membro</DialogTitle>
                                            <DialogDescription>
                                                Atualize as informações do membro abaixo.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="edit-name">Nome</Label>
                                                    <Input id="edit-name" defaultValue={member.name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edit-email">Email</Label>
                                                    <Input id="edit-email" type="email" defaultValue={member.email} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="edit-phone">Telefone</Label>
                                                    <Input id="edit-phone" defaultValue={member.phone} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edit-plan">Plano</Label>
                                                    <select
                                                        id="edit-plan"
                                                        className="w-full border rounded-md px-3 py-2"
                                                        defaultValue={member.plan}
                                                    >
                                                        <option value="Mensal">Mensal</option>
                                                        <option value="Trimestral">Trimestral</option>
                                                        <option value="Anual">Anual</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-status">Status</Label>
                                                <select
                                                    id="edit-status"
                                                    className="w-full border rounded-md px-3 py-2"
                                                    defaultValue={member.status}
                                                >
                                                    <option value="Ativo">Ativo</option>
                                                    <option value="Inativo">Inativo</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-paymentDate">Data de Pagamento</Label>
                                                <Input
                                                    id="edit-paymentDate"
                                                    type="date"
                                                    defaultValue={member.paymentDate}
                                                />
                                            </div>
                                            <Button onClick={updateMember} className="w-full">
                                                Salvar Alterações
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="flex items-center gap-2">
                                            <TrashIcon className="h-4 w-4" />
                                            Excluir Membro
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o membro {member.name} e todos os dados associados.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={deleteMember}>Continuar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Member Activity Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Atividade Recentee</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium">Últimas Visitas</h4>
                                    <p className="text-sm text-muted-foreground">{formatDate(member.lastVisit)}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium">Status de Pagamento</h4>
                                    <Badge variant={getPlanStatus(member.paymentDate, member.plan).variant as any}>
                                        {getPlanStatus(member.paymentDate, member.plan).label}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="font-medium">Próximo Vencimento</h4>
                                    <p className="text-sm text-muted-foreground">{formatDate(member.planRenewalDate)}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium">Treinos Agendados</h4>
                                    <p className="text-sm text-muted-foreground">3 treinos esta semana</p>
                                </div>

                                <div>
                                    <h4 className="font-medium">Tempo de Membro</h4>
                                    <p className="text-sm text-muted-foreground">2 anos e 3 meses</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Records Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Registro de Frequência</span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        Registrar Frequência
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registrar Frequência</DialogTitle>
                                        <DialogDescription>
                                            Registre a entrada e saída do membro.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="check-in">Horário de Entrada</Label>
                                                <Input
                                                    id="check-in"
                                                    type="time"
                                                    value={checkInTime}
                                                    onChange={(e) => setCheckInTime(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="check-out">Horário de Saída</Label>
                                                <Input
                                                    id="check-out"
                                                    type="time"
                                                    value={checkOutTime}
                                                    onChange={(e) => setCheckOutTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={recordAttendance} className="w-full">
                                            Registrar Frequência
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Carregando registros de frequência...</p>
                        ) : attendanceRecords.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Entrada</TableHead>
                                            <TableHead>Saída</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceRecords.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {formatDate(record.date)}
                                                    </div>
                                                </TableCell>
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
                                                    <Badge variant={(record.status === 'Presente' ? 'default' : 'secondary') as any}>
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                Nenhum registro de frequência encontrado para este membro.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}