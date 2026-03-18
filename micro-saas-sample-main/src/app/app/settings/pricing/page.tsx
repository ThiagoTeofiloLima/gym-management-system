'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from "@/components/dashboard/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, DollarSign, Calendar, Users } from 'lucide-react';

interface GymPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  maxMembers: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PricingSettingsPage() {
  const [plans, setPlans] = useState<GymPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GymPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    maxMembers: '',
    isActive: true,
  });

  // Load plans
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/gym-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (plan?: GymPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        duration: plan.duration.toString(),
        maxMembers: plan.maxMembers?.toString() || '',
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '30',
        maxMembers: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingPlan ? `/api/gym-plans/${editingPlan.id}` : '/api/gym-plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration: parseInt(formData.duration) || 30,
          maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: editingPlan ? 'Plano atualizado com sucesso' : 'Plano criado com sucesso',
        });
        setIsDialogOpen(false);
        loadPlans();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar plano');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o plano',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (plan: GymPlan) => {
    try {
      const res = await fetch(`/api/gym-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Status do plano atualizado',
        });
        loadPlans();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (plan: GymPlan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) return;

    try {
      const res = await fetch(`/api/gym-plans/${plan.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Sucesso!',
          description: data.warning || 'Plano excluído com sucesso',
        });
        loadPlans();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao excluir plano');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o plano',
        variant: 'destructive',
      });
    }
  };

  const getDurationLabel = (days: number) => {
    if (days === 30) return 'Mensal';
    if (days === 90) return 'Trimestral';
    if (days === 180) return 'Semestral';
    if (days === 365) return 'Anual';
    return `${days} dias`;
  };

  if (isLoading) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Planos e Preços</DashboardPageHeaderTitle>
        </DashboardPageHeader>
        <DashboardPageMain>
          <p>Carregando...</p>
        </DashboardPageMain>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Planos e Preços</DashboardPageHeaderTitle>
      </DashboardPageHeader>

      <DashboardPageMain>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Planos da Academia</h3>
              <p className="text-sm text-muted-foreground">
                Configure os planos e preços para seus membros
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Planos Cadastrados</CardTitle>
              <CardDescription>
                Gerencie os planos disponíveis para seus membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum plano cadastrado</p>
                  <p className="text-sm">Crie seu primeiro plano para começar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            {plan.description && (
                              <div className="text-sm text-muted-foreground">
                                {plan.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {getDurationLabel(plan.duration)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {plan.maxMembers ? (
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              {plan.maxMembers}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Ilimitado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                              {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Switch
                              checked={plan.isActive}
                              onCheckedChange={() => handleToggleStatus(plan)}
                              className="scale-75"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(plan)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(plan)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardPageMain>

      {/* Dialog de Criar/Editar Plano */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Atualize as informações do plano' : 'Crie um novo plano para sua academia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano Mensal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Acesso completo à academia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (dias)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Limite de Membros (opcional)</Label>
              <Input
                id="maxMembers"
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.price}
            >
              {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
}
