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

export default async function WorkoutsPage() {
    // Get all workouts from the database
    const allData = await jsonDb.getData();
    const workouts = allData.workouts;

    return (
        <DashboardPage>
            <DashboardPageHeader>
                <DashboardPageHeaderTitle>Treinos</DashboardPageHeaderTitle>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="mr-2 h-4 w-4" /> Criar Treino
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Treino</DialogTitle>
                            <DialogDescription>
                                Preencha as informações do novo treino.
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
                                <label htmlFor="type" className="text-right">
                                    Tipo
                                </label>
                                <select id="type" className="col-span-3 border rounded-md px-3 py-2">
                                    <option value="Força">Força</option>
                                    <option value="Cardio">Cardio</option>
                                    <option value="Flexibilidade">Flexibilidade</option>
                                    <option value="Core">Core</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="duration" className="text-right">
                                    Duração
                                </label>
                                <Input id="duration" className="col-span-3" placeholder="Ex: 60 min" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="level" className="text-right">
                                    Nível
                                </label>
                                <select id="level" className="col-span-3 border rounded-md px-3 py-2">
                                    <option value="Iniciante">Iniciante</option>
                                    <option value="Intermediário">Intermediário</option>
                                    <option value="Avançado">Avançado</option>
                                    <option value="Todos">Todos</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="trainer" className="text-right">
                                    Personal
                                </label>
                                <select id="trainer" className="col-span-3 border rounded-md px-3 py-2">
                                    <option value="Roberto Santos">Roberto Santos</option>
                                    <option value="Fernanda Costa">Fernanda Costa</option>
                                    <option value="Marcos Oliveira">Marcos Oliveira</option>
                                    <option value="Juliana Pereira">Juliana Pereira</option>
                                </select>
                            </div>
                        </div>
                        <Button type="submit">Salvar Treino</Button>
                    </DialogContent>
                </Dialog>
            </DashboardPageHeader>

            <DashboardPageMain>
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Treinos ({workouts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Duração</TableHead>
                                    <TableHead>Nível</TableHead>
                                    <TableHead>Personal</TableHead>
                                    <TableHead>Participantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workouts.map((workout) => (
                                    <TableRow key={workout.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Dumbbell className="h-4 w-4" />
                                                {workout.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{workout.type}</Badge>
                                        </TableCell>
                                        <TableCell>{workout.duration}</TableCell>
                                        <TableCell>
                                            <Badge variant={workout.level === 'Avançado' ? 'destructive' :
                                                           workout.level === 'Intermediário' ? 'default' :
                                                           'secondary'}>
                                                {workout.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{workout.trainer}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span>{workout.members}</span>
                                                <span className="text-xs text-muted-foreground">membros</span>
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