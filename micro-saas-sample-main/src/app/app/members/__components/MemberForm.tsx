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
import { PlusIcon } from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from "next/link";

interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    lastVisit: string;
    userId: string;
    planRenewalDate: string; // Data de renovação do plano
    paymentDate: string; // Data de pagamento
}

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

export default function MembersPageClient({ initialMembers }: { initialMembers: Member[] }) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>(initialMembers);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan: 'Mensal',
        paymentDate: new Date().toISOString().split('T')[0], // Data atual por padrão
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get the current user to get the userId
            const session = await getCurrentUser();
            const userId = session.user.id;

            // Calculate renewal date based on payment date and plan
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
                    renewalDate.setMonth(renewalDate.getMonth() + 1); // Default to monthly
            }

            const planRenewalDate = renewalDate.toISOString().split('T')[0];

            const response = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    planRenewalDate, // Include calculated renewal date
                    userId
                }),
            });

            if (response.ok) {
                // Instead of just adding to local state, fetch the updated list
                const newMember = await response.json();

                // Fetch updated members list to ensure consistency
                const updatedResponse = await fetch(`/api/members/get-by-user?userId=${userId}`);
                if (updatedResponse.ok) {
                    const updatedMembers = await updatedResponse.json();
                    setMembers(updatedMembers);
                } else {
                    // Fallback: just add the new member to the list
                    setMembers(prev => [...prev, newMember]);
                }

                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    plan: 'Mensal',
                    paymentDate: new Date().toISOString().split('T')[0],
                });
                setIsOpen(false);
                router.refresh(); // Refresh the page to get updated data
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Erro ao adicionar membro');
            }
        } catch (err) {
            console.error('Error adding member:', err);
            setError('Erro de conexão. Tente novamente.');
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
                                <DialogTitle>Adicionar Novo Membro</DialogTitle>
                                <DialogDescription>
                                    Preencha as informações do novo membro.
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
                                            <option value="Mensal">Mensal</option>
                                            <option value="Trimestral">Trimestral</option>
                                            <option value="Anual">Anual</option>
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
                                    {error && (
                                        <div className="col-span-4 text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Salvando...' : 'Salvar Membro'}
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
                                            <Badge variant={(member.status === 'Ativo' ? 'default' : 'secondary') as any}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{member.lastVisit}</TableCell>
                                        <TableCell>{new Date(member.paymentDate).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getPlanStatus(member.paymentDate, member.plan).variant as any}>
                                                {getPlanStatus(member.paymentDate, member.plan).label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/app/members/${member.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Ver Detalhes
                                                </Button>
                                            </Link>
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