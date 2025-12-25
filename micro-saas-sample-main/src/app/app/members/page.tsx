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
    DialogTrigger
} from "@/components/ui/dialog";
import { PlusIcon } from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { jsonDb } from "@/services/json-db";
import Link from "next/link";

export default async function MembersPage() {
    // Get all members from the database
    const allData = await jsonDb.getData();
    const members = allData.members;

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Membros</DashboardPageHeaderTitle>
                <Dialog>
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
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="name" className="text-right">
                                    Nome
                                </label>
                                <Input id="name" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="email" className="text-right">
                                    Email
                                </label>
                                <Input id="email" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="phone" className="text-right">
                                    Telefone
                                </label>
                                <Input id="phone" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="plan" className="text-right">
                                    Plano
                                </label>
                                <select id="plan" className="col-span-3 border rounded-md px-3 py-2">
                                    <option value="Mensal">Mensal</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>
                        </div>
                        <Button type="submit">Salvar Membro</Button>
                    </DialogContent>
                </Dialog>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Membros ({members.length})</CardTitle>
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
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
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