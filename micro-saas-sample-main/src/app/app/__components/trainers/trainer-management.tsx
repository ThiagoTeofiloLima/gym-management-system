"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrashIcon, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
}

interface TrainerManagementProps {
  initialTrainers: Trainer[];
  initialMembers: any[];
  gymId: string;
}

export function TrainerManagement({ initialTrainers, gymId }: TrainerManagementProps) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    status: 'Ativo'
  });
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.specialty) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const url = editingTrainer 
        ? `/api/trainers/${editingTrainer.id}?gymId=${gymId}`
        : `/api/trainers?gymId=${gymId}`;

      const method = editingTrainer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingTrainer) {
          setTrainers(prev => prev.map(t => t.id === editingTrainer.id ? data : t));
          toast.success("Treinador atualizado!");
        } else {
          setTrainers(prev => [...prev, data]);
          toast.success("Treinador adicionado!");
        }
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar treinador");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialty: trainer.specialty,
      status: trainer.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir treinador?")) return;

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    try {
      const response = await fetch(`/api/trainers/${id}?gymId=${gymId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrainers(prev => prev.filter(t => t.id !== id));
        toast.success("Treinador excluído!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir treinador");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      status: 'Ativo'
    });
    setEditingTrainer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personal Trainers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusIcon className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrainer ? 'Editar' : 'Adicionar'} Treinador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" className="col-span-3" value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" type="email" className="col-span-3" value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Telefone</Label>
                  <Input id="phone" className="col-span-3" value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialty" className="text-right">Especialidade</Label>
                  <Input id="specialty" className="col-span-3" value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">Status</Label>
                  <select id="status" className="col-span-3 border rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingTrainer ? 'Atualizar' : 'Adicionar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Treinadores ({trainers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {trainers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell>{trainer.name}</TableCell>
                    <TableCell>{trainer.email}</TableCell>
                    <TableCell>{trainer.specialty}</TableCell>
                    <TableCell>
                      <Badge variant={trainer.status === 'Ativo' ? 'default' : 'secondary'}>
                        {trainer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(trainer)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(trainer.id)} className="text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Nenhum treinador encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
