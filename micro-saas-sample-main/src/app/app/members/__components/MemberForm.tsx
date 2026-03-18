'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { PlusIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { toast } from "sonner";

interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    lastVisit: string;
    userId: string;
    planRenewalDate: string;
    paymentDate: string;
    trainerId?: string | null;
    gymId?: string | null;
}

interface GymPlan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
    maxMembers: number | null;
    isActive: boolean;
}

// Import the payment status function from the plan pricing service
import { getPaymentStatus } from "@/services/plan-pricing";

// Função para determinar o status do plano com base na data de pagamento e plano
function getPlanStatus(paymentDate: string, plan: string) {
  return getPaymentStatus(paymentDate, plan);
}

export default function MembersPageClient({ initialMembers, gymId }: { initialMembers: Member[], gymId: string }) {
    const searchParams = useSearchParams();
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>(initialMembers);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availablePlans, setAvailablePlans] = useState<GymPlan[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan: 'Mensal',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Ativo',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const router = useRouter();

    // Carregar planos disponíveis
    useEffect(() => {
        const loadPlans = async () => {
            try {
                const url = gymId ? `/api/gym-plans?gymId=${gymId}` : '/api/gym-plans';
                const res = await fetch(url);
                if (res.ok) {
                    const plans = await res.json();
                    setAvailablePlans(plans);
                    // Se houver planos, usa o primeiro como padrão
                    if (plans.length > 0 && !formData.plan) {
                        setFormData(prev => ({ ...prev, plan: plans[0].name }));
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar planos:', error);
            }
        };
        loadPlans();
    }, [gymId]);

    // Filter members based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredMembers(members);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = members.filter(member =>
                member.name.toLowerCase().includes(term) ||
                member.email.toLowerCase().includes(term) ||
                member.phone.toLowerCase().includes(term) ||
                member.plan.toLowerCase().includes(term)
            );
            setFilteredMembers(filtered);
        }
    }, [searchTerm, members]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            phone: member.phone,
            plan: member.plan,
            paymentDate: member.paymentDate,
            status: member.status,
        });
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este membro?")) {
            return;
        }

        try {
            if (!gymId) {
                toast.error('Academia não selecionada');
                return;
            }

            const url = `/api/members/${id}?gymId=${gymId}`;
            const response = await fetch(url, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success("Membro excluído com sucesso!");
                router.refresh();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || errorData.message || 'Erro ao excluir membro');
            }
        } catch (err) {
            console.error('Error deleting member:', err);
            toast.error('Erro ao excluir membro');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Calcular data de renovação
            const paymentDate = new Date(formData.paymentDate);
            let renewalDate = new Date(paymentDate);

            switch(formData.plan.toLowerCase()) {
                case 'mensal':
                    renewalDate.setMonth(renewalDate.getMonth() + 1);
                    break;
                case 'trimestral':
                    renewalDate.setMonth(renewalDate.getMonth() + 3);
                    break;
                case 'anual':
                    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
                    break;
                default:
                    renewalDate.setMonth(renewalDate.getMonth() + 1);
            }

            const planRenewalDate = renewalDate.toISOString().split('T')[0];

            if (!gymId) {
                toast.error('Academia não selecionada');
                return;
            }

            // PUT usa o ID do membro, POST usa a lista
            const url = editingMember 
                ? `/api/members/${editingMember.id}?gymId=${gymId}`
                : `/api/members?gymId=${gymId}`;

            const method = editingMember ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    planRenewalDate,
                    trainerId: editingMember?.trainerId || null,
                }),
            });

            if (response.ok) {
                const updatedMember = await response.json();

                if (editingMember) {
                    setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m));
                    toast.success("Membro atualizado com sucesso!");
                } else {
                    setMembers(prev => [...prev, updatedMember]);
                    toast.success("Membro adicionado com sucesso!");
                }

                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    plan: 'Mensal',
                    paymentDate: new Date().toISOString().split('T')[0],
                    status: 'Ativo',
                });
                setEditingMember(null);
                setIsOpen(false);
                router.refresh();
            } else {
                const errorData = await response.json();
                setError(errorData.error || errorData.message || 'Erro ao salvar membro');
                toast.error(errorData.error || errorData.message || 'Erro ao salvar membro');
            }
        } catch (err) {
            console.error('Error saving member:', err);
            setError('Erro de conexão. Tente novamente.');
            toast.error('Erro ao salvar membro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Membros</DashboardPageHeaderTitle>
                <div className="flex gap-2">
                    <Input
                        placeholder="Buscar membros..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
                                <DialogDescription>
                                    {editingMember
                                        ? 'Edite as informações do membro.'
                                        : 'Preencha as informações do novo membro.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="name" className="text-right">
                                            Nome
                                        </label>
                                        <Input
                                            id="name"
                                            className="col-span-3"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="email" className="text-right">
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            type="email"
                                            className="col-span-3"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="phone" className="text-right">
                                            Telefone
                                        </label>
                                        <Input
                                            id="phone"
                                            className="col-span-3"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="plan" className="text-right">
                                            Plano
                                        </label>
                                        <select
                                            id="plan"
                                            className="col-span-3 border rounded-md px-3 py-2"
                                            value={formData.plan}
                                            onChange={handleChange}
                                        >
                                            {availablePlans.length > 0 ? (
                                                availablePlans.map((plan) => (
                                                    <option key={plan.id} value={plan.name}>
                                                        {plan.name} - R$ {plan.price.toFixed(2).replace('.', ',')}
                                                        {plan.duration === 30 ? '/mês' : plan.duration === 90 ? '/trimestre' : plan.duration === 365 ? '/ano' : `/${plan.duration} dias`}
                                                        {!plan.isActive && ' (Inativo)'}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="Mensal">Mensal</option>
                                                    <option value="Trimestral">Trimestral</option>
                                                    <option value="Anual">Anual</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="paymentDate" className="text-right">
                                            Data de Pagamento
                                        </label>
                                        <Input
                                            id="paymentDate"
                                            type="date"
                                            className="col-span-3"
                                            value={formData.paymentDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="status" className="text-right">
                                            Status
                                        </label>
                                        <select
                                            id="status"
                                            className="col-span-3 border rounded-md px-3 py-2"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Ativo">Ativo</option>
                                            <option value="Inativo">Inativo</option>
                                        </select>
                                    </div>
                                    {error && (
                                        <div className="col-span-4 text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" onClick={() => {
                                            setEditingMember(null);
                                            setFormData({
                                                name: '',
                                                email: '',
                                                phone: '',
                                                plan: 'Mensal',
                                                paymentDate: new Date().toISOString().split('T')[0],
                                                status: 'Ativo',
                                            });
                                        }}>Cancelar</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Salvando...' : (editingMember ? 'Atualizar' : 'Salvar')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Membros ({filteredMembers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Última Visita</TableHead>
                                    <TableHead>Data de Pagamento</TableHead>
                                    <TableHead>Status do Plano</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.phone}</TableCell>
                                        <TableCell>{member.plan}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.status === 'Ativo' ? 'default' : 'secondary'}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{member.lastVisit}</TableCell>
                                        <TableCell>{new Date(member.paymentDate).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getPlanStatus(member.paymentDate, member.plan).variant === 'active' ? 'default' : 'secondary'}>
                                                {getPlanStatus(member.paymentDate, member.plan).label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleEdit(member)}
                                                >
                                                    <Pencil1Icon className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleDelete(member.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </DashboardPageMain>
        </DashboardPage>
    );
}