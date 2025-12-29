"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserIcon, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  trainerId?: string;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  assignedMemberIds: string[];
}

export function MemberTrainerAssignment() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Load trainers and members from API
  const loadData = async () => {
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

  const assignMemberToTrainer = async (memberId: string, trainerId: string | null) => {
    try {
      // Update member with trainerId
      const memberResponse = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainerId: trainerId || undefined }),
      });

      if (!memberResponse.ok) {
        throw new Error('Failed to update member');
      }

      // Update trainer's assigned members list
      if (trainerId) {
        const trainer = trainers.find(t => t.id === trainerId);
        if (trainer) {
          const updatedAssignedMembers = trainer.assignedMemberIds.includes(memberId)
            ? trainer.assignedMemberIds
            : [...trainer.assignedMemberIds, memberId];
          
          const trainerResponse = await fetch(`/api/trainers/${trainerId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              ...trainer,
              assignedMemberIds: updatedAssignedMembers
            }),
          });

          if (!trainerResponse.ok) {
            throw new Error('Failed to update trainer');
          }
        }
      }

      toast.success("Atribuição atualizada com sucesso!");
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Erro ao atualizar atribuição");
    }
  };

  const getTrainerForMember = (memberId: string) => {
    return trainers.find(trainer => trainer.assignedMemberIds.includes(memberId));
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
      <Card>
        <CardHeader>
          <CardTitle>Atribuição de Membros a Personal Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Members List */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Membros
              </h3>
              <div className="space-y-3">
                {members.map((member) => {
                  const assignedTrainer = getTrainerForMember(member.id);
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignedTrainer ? (
                          <Badge variant="secondary">
                            {assignedTrainer.name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem personal</span>
                        )}
                        <select
                          value={assignedTrainer?.id || ''}
                          onChange={(e) => assignMemberToTrainer(member.id, e.target.value || null)}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="">Sem personal</option>
                          {trainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trainers List */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserRoundCheck className="h-5 w-5" />
                Personal Trainers
              </h3>
              <div className="space-y-3">
                {trainers.map((trainer) => {
                  const assignedMembers = members.filter(member => 
                    trainer.assignedMemberIds.includes(member.id)
                  );
                  
                  return (
                    <div 
                      key={trainer.id} 
                      className="border rounded-md p-3"
                    >
                      <div className="font-medium">{trainer.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{trainer.email}</div>
                      <div className="text-sm font-medium">Membros atribuídos ({assignedMembers.length}):</div>
                      <div className="mt-2 space-y-1">
                        {assignedMembers.length > 0 ? (
                          assignedMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between text-sm p-1 bg-gray-50 rounded">
                              <span>{member.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => assignMemberToTrainer(member.id, null)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">Nenhum membro atribuído</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}