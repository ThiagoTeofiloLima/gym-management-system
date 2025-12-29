"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrashIcon, PlusIcon, PencilIcon, UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { MemberTrainerAssignment } from "./member-trainer-assignment";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: string;
  certifications: string[];
  assignedMemberIds: string[];
  members: Member[];
  userId: string;
}

export function TrainerManagement() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    certifications: [] as string[],
    assignedMemberIds: [] as string[],
    status: 'Ativo'
  });
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [certificationInput, setCertificationInput] = useState('');

  // Load trainers and members from API
  const loadTrainersAndMembers = async () => {
    try {
      const [trainersResponse, membersResponse] = await Promise.all([
        fetch('/api/trainers?userId=user-1'), // Using a placeholder user ID for now
        fetch('/api/members?userId=user-1') // Using a placeholder user ID for now
      ]);

      if (!trainersResponse.ok || !membersResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const trainersData = await trainersResponse.json();
      const membersData = await membersResponse.json();

      setTrainers(trainersData);
      setMembers(membersData);
      setAvailableMembers(membersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainersAndMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.specialty) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const trainerData = {
        ...formData,
        userId: "user-1" // Placeholder user ID
      };

      let response;
      if (editingTrainer) {
        // Update existing trainer
        response = await fetch(`/api/trainers/${editingTrainer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trainerData),
        });

        if (response.ok) {
          toast.success("Personal atualizado com sucesso!");
        }
      } else {
        // Create new trainer
        response = await fetch('/api/trainers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trainerData),
        });

        if (response.ok) {
          toast.success("Personal adicionado com sucesso!");
        }
      }

      if (response.ok) {
        loadTrainersAndMembers(); // Reload data
        resetForm();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao salvar personal");
      }
    } catch (error) {
      console.error("Error saving trainer:", error);
      toast.error("Erro ao salvar personal");
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialty: trainer.specialty,
      certifications: trainer.certifications || [],
      assignedMemberIds: trainer.assignedMemberIds || [],
      status: trainer.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este personal trainer?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trainers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Personal excluído com sucesso!");
        loadTrainersAndMembers(); // Reload data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao excluir personal");
      }
    } catch (error) {
      console.error("Error deleting trainer:", error);
      toast.error("Erro ao excluir personal");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      certifications: [],
      assignedMemberIds: [],
      status: 'Ativo'
    });
    setCertificationInput('');
    setEditingTrainer(null);
  };

  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certificationInput.trim()]
      });
      setCertificationInput('');
    }
  };

  const removeCertification = (certIndex: number) => {
    const newCerts = [...formData.certifications];
    newCerts.splice(certIndex, 1);
    setFormData({
      ...formData,
      certifications: newCerts
    });
  };

  const toggleMemberAssignment = (memberId: string) => {
    if (formData.assignedMemberIds.includes(memberId)) {
      // Remove member from assignment
      setFormData({
        ...formData,
        assignedMemberIds: formData.assignedMemberIds.filter(id => id !== memberId)
      });
    } else {
      // Add member to assignment
      setFormData({
        ...formData,
        assignedMemberIds: [...formData.assignedMemberIds, memberId]
      });
    }
  };

  const [showAssignmentSection, setShowAssignmentSection] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Trainers</CardTitle>
          <div className="text-2xl font-bold">{trainers.length} ativos</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gerencie os personais trainers da sua academia
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Personal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrainer ? 'Editar Personal' : 'Adicionar Novo Personal'}</DialogTitle>
              <DialogDescription>
                {editingTrainer
                  ? 'Edite as informações do personal trainer.'
                  : 'Preencha as informações do novo personal trainer.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <Label>Certificações</Label>
                <div className="flex gap-2">
                  <Input
                    value={certificationInput}
                    onChange={(e) => setCertificationInput(e.target.value)}
                    placeholder="Adicione uma certificação"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  />
                  <Button type="button" onClick={addCertification} variant="outline">Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Member Assignment */}
              <div className="space-y-2">
                <Label>Atribuir Membros</Label>
                <p className="text-sm text-muted-foreground">Selecione os membros que este personal irá atender</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-md border ${
                        formData.assignedMemberIds.includes(member.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.assignedMemberIds.includes(member.id)}
                          onChange={() => toggleMemberAssignment(member.id)}
                          className="h-4 w-4"
                        />
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{member.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">{editingTrainer ? 'Atualizar' : 'Adicionar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trainers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personal Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          {trainers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Especialidade</th>
                    <th className="text-left py-2">Contato</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Membros Atribuídos</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((trainer) => (
                    <tr key={trainer.id} className="border-t">
                      <td className="py-2 font-medium">{trainer.name}</td>
                      <td className="py-2">{trainer.specialty}</td>
                      <td className="py-2">
                        <div>{trainer.email}</div>
                        <div className="text-sm text-muted-foreground">{trainer.phone}</div>
                      </td>
                      <td className="py-2">
                        <Badge variant={trainer.status === 'Ativo' ? 'default' : 'secondary'}>
                          {trainer.status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {trainer.members && trainer.members.length > 0 ? (
                            trainer.members.map((member, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {member.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhum</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(trainer)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(trainer.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum personal trainer cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collapsible Member-Trainer Assignment Section */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowAssignmentSection(!showAssignmentSection)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Atribuição de Membros</CardTitle>
            {showAssignmentSection ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {showAssignmentSection && (
          <CardContent>
            <MemberTrainerAssignment />
          </CardContent>
        )}
      </Card>
    </div>
  );
}