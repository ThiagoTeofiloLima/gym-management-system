"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserIcon, Dumbbell } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  assignedWorkoutIds: string[];
}

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  level: string;
  assignedMemberIds: string[];
}

export function MemberWorkoutAssignment() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts and members from API
  const loadData = async () => {
    try {
      const [workoutsResponse, membersResponse] = await Promise.all([
        fetch('/api/workouts?userId=user-1'), // Using a placeholder user ID for now
        fetch('/api/members?userId=user-1') // Using a placeholder user ID for now
      ]);
      
      if (!workoutsResponse.ok || !membersResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const workoutsData = await workoutsResponse.json();
      const membersData = await membersResponse.json();
      
      setWorkouts(workoutsData);
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

  const assignMemberToWorkout = async (memberId: string, workoutId: string, assign: boolean) => {
    try {
      // Get current member data
      const memberResponse = await fetch(`/api/members/${memberId}`);
      if (!memberResponse.ok) {
        throw new Error('Failed to fetch member');
      }
      const member = await memberResponse.json();
      
      // Update member's assignedWorkoutIds
      const updatedWorkoutIds = assign
        ? [...(member.assignedWorkoutIds || []), workoutId]
        : (member.assignedWorkoutIds || []).filter((id: string) => id !== workoutId);
      
      const updateMemberResponse = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...member,
          assignedWorkoutIds: updatedWorkoutIds
        }),
      });

      if (!updateMemberResponse.ok) {
        throw new Error('Failed to update member');
      }

      // Get current workout data
      const workoutResponse = await fetch(`/api/workouts/${workoutId}`);
      if (!workoutResponse.ok) {
        throw new Error('Failed to fetch workout');
      }
      const workout = await workoutResponse.json();
      
      // Update workout's assignedMemberIds
      const updatedMemberIds = assign
        ? [...(workout.assignedMemberIds || []), memberId]
        : (workout.assignedMemberIds || []).filter((id: string) => id !== memberId);
      
      const updateWorkoutResponse = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...workout,
          assignedMemberIds: updatedMemberIds
        }),
      });

      if (!updateWorkoutResponse.ok) {
        throw new Error('Failed to update workout');
      }

      toast.success(assign ? "Membro adicionado ao treino com sucesso!" : "Membro removido do treino com sucesso!");
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Erro ao atualizar atribuição");
    }
  };

  const getWorkoutsForMember = (memberId: string) => {
    return workouts.filter(workout => 
      workout.assignedMemberIds?.includes(memberId)
    );
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
          <CardTitle>Atribuição de Treinos a Membros</CardTitle>
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
                  const assignedWorkouts = getWorkoutsForMember(member.id);
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
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              assignMemberToWorkout(member.id, e.target.value, true);
                              e.target.value = ""; // Reset selection
                            }
                          }}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="">Adicionar treino...</option>
                          {workouts
                            .filter(workout => !assignedWorkouts.some(w => w.id === workout.id))
                            .map(workout => (
                              <option key={workout.id} value={workout.id}>
                                {workout.name}
                              </option>
                            ))}
                        </select>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {assignedWorkouts.length > 0 ? (
                            assignedWorkouts.map(workout => (
                              <Badge key={workout.id} variant="secondary" className="text-xs flex items-center gap-1">
                                {workout.name}
                                <button
                                  type="button"
                                  onClick={() => assignMemberToWorkout(member.id, workout.id, false)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhum</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workouts List */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Treinos
              </h3>
              <div className="space-y-3">
                {workouts.map((workout) => {
                  const assignedMembers = members.filter(member => 
                    workout.assignedMemberIds?.includes(member.id)
                  );
                  
                  return (
                    <div 
                      key={workout.id} 
                      className="border rounded-md p-3"
                    >
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {workout.type} • {workout.duration} • {workout.level}
                      </div>
                      <div className="text-sm font-medium">Membros inscritos ({assignedMembers.length}):</div>
                      <div className="mt-2 space-y-1">
                        {assignedMembers.length > 0 ? (
                          assignedMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between text-sm p-1 bg-gray-50 rounded">
                              <span>{member.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => assignMemberToWorkout(member.id, workout.id, false)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">Nenhum membro inscrito</div>
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