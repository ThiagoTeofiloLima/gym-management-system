"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

interface Trainer {
  id: string;
  name: string;
  specialty: string;
}

interface Workout {
  id: string;
  name: string;
  type: string;
  assignedTrainerId?: string;
}

export function TrainerWorkoutAssignment() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts and trainers from API
  const loadData = async () => {
    try {
      const [workoutsResponse, trainersResponse] = await Promise.all([
        fetch('/api/workouts?userId=user-1'), // Using a placeholder user ID for now
        fetch('/api/trainers?userId=user-1') // Using a placeholder user ID for now
      ]);
      
      if (!workoutsResponse.ok || !trainersResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const workoutsData = await workoutsResponse.json();
      const trainersData = await trainersResponse.json();
      
      setWorkouts(workoutsData);
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

  const assignTrainerToWorkout = async (workoutId: string, trainerId: string | null) => {
    try {
      // Update workout with trainerId
      const workoutResponse = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainerId: trainerId || undefined }),
      });

      if (!workoutResponse.ok) {
        throw new Error('Failed to update workout');
      }

      toast.success("Treinador atribuído com sucesso!");
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Erro ao atualizar atribuição");
    }
  };

  const getTrainerForWorkout = (workoutId: string) => {
    return trainers.find(trainer => trainer.id === workouts.find(w => w.id === workoutId)?.assignedTrainerId);
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
          <CardTitle>Atribuição de Treinadores a Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Workouts List */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Treinos
              </h3>
              <div className="space-y-3">
                {workouts.map((workout) => {
                  const assignedTrainer = getTrainerForWorkout(workout.id);
                  return (
                    <div 
                      key={workout.id} 
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{workout.name}</div>
                        <div className="text-sm text-muted-foreground">{workout.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignedTrainer ? (
                          <Badge variant="secondary">
                            {assignedTrainer.name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem treinador</span>
                        )}
                        <select
                          value={assignedTrainer?.id || ''}
                          onChange={(e) => assignTrainerToWorkout(workout.id, e.target.value || null)}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="">Sem treinador</option>
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
                  const assignedWorkouts = workouts.filter(workout => 
                    workout.assignedTrainerId === trainer.id
                  );
                  
                  return (
                    <div 
                      key={trainer.id} 
                      className="border rounded-md p-3"
                    >
                      <div className="font-medium">{trainer.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{trainer.specialty}</div>
                      <div className="text-sm font-medium">Treinos atribuídos ({assignedWorkouts.length}):</div>
                      <div className="mt-2 space-y-1">
                        {assignedWorkouts.length > 0 ? (
                          assignedWorkouts.map(workout => (
                            <div key={workout.id} className="flex items-center justify-between text-sm p-1 bg-gray-50 rounded">
                              <span>{workout.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => assignTrainerToWorkout(workout.id, null)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">Nenhum treino atribuído</div>
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