"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { TrashIcon, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  description: string | null;
}

interface WorkoutManagementProps {
  initialWorkouts: Workout[];
  initialMembers: any[];
  initialTrainers: any[];
  gymId: string;
}

export function WorkoutManagement({ initialWorkouts, gymId }: WorkoutManagementProps) {
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    duration: '',
    level: '',
    description: '',
  });
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    if (!formData.name || !formData.type || !formData.duration || !formData.level) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const url = editingWorkout 
        ? `/api/workouts/${editingWorkout.id}?gymId=${gymId}`
        : `/api/workouts?gymId=${gymId}`;

      const method = editingWorkout ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingWorkout) {
          setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? data : w));
          toast.success("Treino atualizado!");
        } else {
          setWorkouts(prev => [...prev, data]);
          toast.success("Treino adicionado!");
        }
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar treino");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setFormData({
      name: workout.name,
      type: workout.type,
      duration: workout.duration,
      level: workout.level,
      description: workout.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir treino?")) return;

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${id}?gymId=${gymId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkouts(prev => prev.filter(w => w.id !== id));
        toast.success("Treino excluído!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir treino");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      duration: '',
      level: '',
      description: '',
    });
    setEditingWorkout(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Treinos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusIcon className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWorkout ? 'Editar' : 'Adicionar'} Treino</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" className="col-span-3" value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Tipo</Label>
                  <Input id="type" className="col-span-3" value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">Duração</Label>
                  <Input id="duration" className="col-span-3" value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="level" className="text-right">Nível</Label>
                  <Input id="level" className="col-span-3" value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Descrição</Label>
                  <Input id="description" className="col-span-3" value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingWorkout ? 'Atualizar' : 'Adicionar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Treinos ({workouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>{workout.name}</TableCell>
                    <TableCell>{workout.type}</TableCell>
                    <TableCell>{workout.duration}</TableCell>
                    <TableCell>{workout.level}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(workout)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(workout.id)} className="text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Nenhum treino encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
