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

export default async function TrainersPage() {
    // Get all trainers from the database
    const allData = await jsonDb.getData();
    const trainers = allData.trainers;

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Personal Trainers</DashboardPageHeaderTitle>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Personal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Personal Trainer</DialogTitle>
                            <DialogDescription>
                                Preencha as informações do novo personal trainer.
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
                                <label htmlFor="specialty" className="text-right">
                                    Especialidade
                                </label>
                                <Input id="specialty" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="phone" className="text-right">
                                    Telefone
                                </label>
                                <Input id="phone" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="certifications" className="text-right">
                                    Certificações
                                </label>
                                <Input id="certifications" className="col-span-3" placeholder="Separe por vírgula" />
                            </div>
                        </div>
                        <Button type="submit">Salvar Personal</Button>
                    </DialogContent>
                </Dialog>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Personal Trainers ({trainers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Especialidade</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Certificações</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainers.map((trainer) => (
                                    <TableRow key={trainer.id}>
                                        <TableCell className="font-medium">{trainer.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Dumbbell className="h-4 w-4" />
                                                {trainer.specialty}
                                            </div>
                                        </TableCell>
                                        <TableCell>{trainer.phone}</TableCell>
                                        <TableCell>
                                            {trainer.certifications.map((cert, idx) => (
                                                <Badge key={idx} variant="outline" className="mr-1">
                                                    {cert}
                                                </Badge>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={trainer.status === 'Ativo' ? 'default' : 'secondary'}>
                                                {trainer.status}
                                            </Badge>
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