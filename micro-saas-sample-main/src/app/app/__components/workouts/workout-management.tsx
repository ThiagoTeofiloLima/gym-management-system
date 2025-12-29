"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrashIcon, PlusIcon, PencilIcon, DumbbellIcon } from "lucide-react";
import { toast } from "sonner";
import { MemberWorkoutAssignment } from "./member-workout-assignment";
import { TrainerWorkoutAssignment } from "./trainer-workout-assignment";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Trainer {
  id: string;
  name: string;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  description?: string;
  trainerId?: string;
  assignedMemberIds: string[];
  members: Member[];
  trainer?: Trainer;
  userId: string;
}

export function WorkoutManagement() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    duration: '',
    level: '',
    description: '',
    trainerId: '',
    assignedMemberIds: [] as string[],
  });
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showMemberAssignmentSection, setShowMemberAssignmentSection] = useState(false);
  const [showTrainerAssignmentSection, setShowTrainerAssignmentSection] = useState(false);

  // Load workouts, members and trainers from API
  const loadData = async () => {
    try {
      const [workoutsResponse, membersResponse, trainersResponse] = await Promise.all([
        fetch('/api/workouts?userId=user-1'), // Using a placeholder user ID for now
        fetch('/api/members?userId=user-1'), // Using a placeholder user ID for now
        fetch('/api/trainers?userId=user-1') // Using a placeholder user ID for now
      ]);

      if (!workoutsResponse.ok || !membersResponse.ok || !trainersResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const workoutsData = await workoutsResponse.json();
      const membersData = await membersResponse.json();
      const trainersData = await trainersResponse.json();

      setWorkouts(workoutsData);
      setMembers(membersData);
      setTrainers(trainersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.duration || !formData.level) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const workoutData = {
        ...formData,
        userId: "user-1" // Placeholder user ID
      };

      let response;
      if (editingWorkout) {
        // Update existing workout
        response = await fetch(`/api/workouts/${editingWorkout.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workoutData),
        });

        if (response.ok) {
          toast.success("Treino atualizado com sucesso!");
        }
      } else {
        // Create new workout
        response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workoutData),
        });

        if (response.ok) {
          toast.success("Treino adicionado com sucesso!");
        }
      }

      if (response.ok) {
        loadData(); // Reload data
        resetForm();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao salvar treino");
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Erro ao salvar treino");
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
      trainerId: workout.trainerId || '',
      assignedMemberIds: workout.assignedMemberIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este treino?")) {
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Treino excluído com sucesso!");
        loadData(); // Reload data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao excluir treino");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
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
      trainerId: '',
      assignedMemberIds: [],
    });
    setEditingWorkout(null);
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
          <CardTitle>Treinos</CardTitle>
          <div className="text-2xl font-bold">{workouts.length} treinos</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gerencie os treinos da sua academia e atribua a membros
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <PlusIcon className="mr-2 h-4 w-4" /> Adicionar Treino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkout ? 'Editar Treino' : 'Adicionar Novo Treino'}</DialogTitle>
              <DialogDescription>
                {editingWorkout
                  ? 'Edite as informações do treino.'
                  : 'Preencha as informações do novo treino.'}
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
                  <Label htmlFor="type">Tipo *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Nível *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({...formData, level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iniciante">Iniciante</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded-md min-h-[80px]"
                    placeholder="Descrição do treino"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="trainer">Personal Trainer</Label>
                  <Select
                    value={formData.trainerId}
                    onValueChange={(value) => setFormData({...formData, trainerId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um personal trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map(trainer => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Member Assignment */}
              <div className="space-y-2">
                <Label>Atribuir Membros</Label>
                <p className="text-sm text-muted-foreground">Selecione os membros que participarão deste treino</p>
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
                        <DumbbellIcon className="h-4 w-4 text-muted-foreground" />
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
                <Button type="submit">{editingWorkout ? 'Atualizar' : 'Adicionar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Duração</th>
                    <th className="text-left py-2">Nível</th>
                    <th className="text-left py-2">Personal</th>
                    <th className="text-left py-2">Membros</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => (
                    <tr key={workout.id} className="border-t">
                      <td className="py-2 font-medium">{workout.name}</td>
                      <td className="py-2">{workout.type}</td>
                      <td className="py-2">{workout.duration}</td>
                      <td className="py-2">
                        <Badge variant="outline">{workout.level}</Badge>
                      </td>
                      <td className="py-2">
                        {workout.trainer ? workout.trainer.name : 'Nenhum'}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {workout.members && workout.members.length > 0 ? (
                            workout.members.map((member, idx) => (
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
                            onClick={() => handleEdit(workout)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workout.id)}
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
              Nenhum treino cadastrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collapsible Member-Workout Assignment Section */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowMemberAssignmentSection(!showMemberAssignmentSection)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Atribuição de Membros</CardTitle>
            {showMemberAssignmentSection ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {showMemberAssignmentSection && (
          <CardContent>
            <MemberWorkoutAssignment />
          </CardContent>
        )}
      </Card>

      {/* Collapsible Trainer-Workout Assignment Section */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowTrainerAssignmentSection(!showTrainerAssignmentSection)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Atribuição de Treinadores</CardTitle>
            {showTrainerAssignmentSection ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {showTrainerAssignmentSection && (
          <CardContent>
            <TrainerWorkoutAssignment />
          </CardContent>
        )}
      </Card>
    </div>
  );
}