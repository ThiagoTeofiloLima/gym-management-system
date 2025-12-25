"use client";

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
import { PencilIcon, TrashIcon } from "lucide-react";
import { DashboardPage, DashboardPageHeader, DashboardPageHeaderTitle, DashboardPageMain } from "@/components/dashboard/page";

interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    lastVisit: string;
}

export default function MemberDetailPageClient({ member }: { member: Member }) {
    const router = useRouter();
    
    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const updateMember = async () => {
        // Get form values
        const name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('edit-email') as HTMLInputElement).value;
        const phone = (document.getElementById('edit-phone') as HTMLInputElement).value;
        const plan = (document.getElementById('edit-plan') as HTMLSelectElement).value;
        const status = (document.getElementById('edit-status') as HTMLSelectElement).value;

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
                    status
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
                                    <Badge variant={member.plan === 'Mensal' ? 'default' : 
                                                  member.plan === 'Trimestral' ? 'secondary' : 
                                                  'outline'}>
                                        {member.plan}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Badge variant={member.status === 'Ativo' ? 'default' : 'destructive'}>
                                        {member.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Última Visita</Label>
                                    <p className="text-muted-foreground">{formatDate(member.lastVisit)}</p>
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
                                    <Badge variant="default">Em dia</Badge>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium">Próximo Vencimento</h4>
                                    <p className="text-sm text-muted-foreground">15/01/2026</p>
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
            </DashboardPageMain>
        </DashboardPage>
    );
}