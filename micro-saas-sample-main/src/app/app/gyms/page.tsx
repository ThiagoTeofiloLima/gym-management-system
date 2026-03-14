'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Plus, Pencil, Trash2, Users, Dumbbell, Heart, DollarSign, Building2, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Gym {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  isActive: boolean
  plan: string
  planExpiresAt: string | null
  maxMembers: number
  maxUsers: number
  createdAt: string
  _count: {
    users: number
    members: number
    trainers: number
    workouts: number
    expenses: number
  }
}

interface GymFormData {
  name: string
  cnpj: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  plan: string
  maxMembers: number
  maxUsers: number
}

const PLAN_OPTIONS = [
  { value: 'basic', label: 'Básico', maxMembers: 100, maxUsers: 5 },
  { value: 'pro', label: 'Pro', maxMembers: 200, maxUsers: 10 },
  { value: 'enterprise', label: 'Enterprise', maxMembers: 500, maxUsers: 20 },
]

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  
  const [formData, setFormData] = useState<GymFormData>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    plan: 'basic',
    maxMembers: 100,
    maxUsers: 5,
  })

  useEffect(() => {
    fetchGyms()
    checkPermissions()
  }, [])

  async function checkPermissions() {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const session = await res.json()
        setIsSuperAdmin(session?.user?.role === 'SUPER_ADMIN')
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
    }
  }

  useEffect(() => {
    if (selectedGym) {
      setFormData({
        name: selectedGym.name,
        cnpj: selectedGym.cnpj || '',
        email: selectedGym.email || '',
        phone: selectedGym.phone || '',
        address: selectedGym.address || '',
        city: selectedGym.city || '',
        state: selectedGym.state || '',
        plan: selectedGym.plan,
        maxMembers: selectedGym.maxMembers,
        maxUsers: selectedGym.maxUsers,
      })
    }
  }, [selectedGym])

  async function fetchGyms() {
    try {
      const res = await fetch('/api/gyms')
      if (res.ok) {
        const data = await res.json()
        setGyms(data)
      }
    } catch (error) {
      console.error('Erro ao buscar academias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGym(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Academia criada com sucesso.',
          variant: 'success',
        })
        setFormData({
          name: '',
          cnpj: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          plan: 'basic',
          maxMembers: 100,
          maxUsers: 5,
        })
        setIsCreateDialogOpen(false)
        fetchGyms()
      } else {
        const error = await res.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao criar academia',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao criar academia:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar academia',
        variant: 'destructive',
      })
    }
  }

  async function handleUpdateGym(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGym) return

    try {
      const res = await fetch(`/api/gyms/${selectedGym.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Academia atualizada com sucesso.',
          variant: 'success',
        })
        setIsEditDialogOpen(false)
        setSelectedGym(null)
        fetchGyms()
      } else {
        const error = await res.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao atualizar academia',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar academia:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar academia',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteGym() {
    if (!selectedGym) return

    try {
      const res = await fetch(`/api/gyms/${selectedGym.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Academia deletada com sucesso.',
          variant: 'success',
        })
        setIsDeleteDialogOpen(false)
        setSelectedGym(null)
        fetchGyms()
      } else {
        const error = await res.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao deletar academia',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao deletar academia:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao deletar academia',
        variant: 'destructive',
      })
    }
  }

  async function toggleGymStatus(gymId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: `Academia ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
          variant: 'success',
        })
        fetchGyms()
      }
    } catch (error) {
      console.error('Erro ao atualizar academia:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da academia',
        variant: 'destructive',
      })
    }
  }

  function handlePlanChange(plan: string) {
    const planOption = PLAN_OPTIONS.find(p => p.value === plan)
    if (planOption) {
      setFormData({
        ...formData,
        plan,
        maxMembers: planOption.maxMembers,
        maxUsers: planOption.maxUsers,
      })
    }
  }

  function openEditDialog(gym: Gym) {
    setSelectedGym(gym)
    setIsEditDialogOpen(true)
  }

  function openDeleteDialog(gym: Gym) {
    setSelectedGym(gym)
    setIsDeleteDialogOpen(true)
  }

  // Filtrar academias
  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.cnpj?.includes(searchTerm) ||
                         gym.city?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = filterPlan === 'all' || gym.plan === filterPlan
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && gym.isActive) ||
                         (filterStatus === 'inactive' && !gym.isActive)
    return matchesSearch && matchesPlan && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: gyms.length,
    active: gyms.filter(g => g.isActive).length,
    inactive: gyms.filter(g => !g.isActive).length,
    totalMembers: gyms.reduce((acc, g) => acc + g._count.members, 0),
    totalUsers: gyms.reduce((acc, g) => acc + g._count.users, 0),
    totalRevenue: gyms.reduce((acc, g) => {
      const planPrices: Record<string, number> = { basic: 99, pro: 199, enterprise: 399 }
      return acc + (planPrices[g.plan] || 0)
    }, 0),
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <Building2 className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-lg">Carregando academias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Toaster />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🏋️ Academias</h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin 
              ? 'Gerencie todas as academias do sistema' 
              : 'Visualize suas academias'
            }
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Academia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Academia</DialogTitle>
                <DialogDescription>
                  Preencha os dados para cadastrar uma nova academia no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGym}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome da Academia *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Iron Gym"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@academia.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="plan">Plano *</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={handlePlanChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label} - R$ {plan.value === 'basic' ? '99' : plan.value === 'pro' ? '199' : '399'}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Academia
                </Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Academias</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active} ativas • {stats.inactive} inativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em todas as academias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários do Sistema</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Instrutores, gerentes e admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimativa baseada nos planos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gyms List */}
      <div className="grid gap-6">
        {filteredGyms.map((gym) => (
          <Card key={gym.id} className={cn(
            "border-l-4 transition-all hover:shadow-lg",
            gym.isActive ? "border-l-green-500" : "border-l-red-500"
          )}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{gym.name}</CardTitle>
                  <CardDescription className="flex gap-4 flex-wrap">
                    {gym.cnpj && <span>📋 CNPJ: {gym.cnpj}</span>}
                    {gym.email && <span>📧 {gym.email}</span>}
                    {gym.phone && <span>📱 {gym.phone}</span>}
                  </CardDescription>
                  {(gym.address || gym.city) && (
                    <p className="text-sm text-muted-foreground">
                      📍 {gym.address}{gym.address && gym.city && ', '}{gym.city} - {gym.state}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={gym.isActive ? "default" : "secondary"}>
                    {gym.isActive ? "✅ Ativa" : "❌ Inativa"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {gym.plan === 'basic' && '🟢 Básico'}
                    {gym.plan === 'pro' && '🔵 Pro'}
                    {gym.plan === 'enterprise' && '🟣 Enterprise'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-4 py-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-500">{gym._count.users}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">{gym._count.members}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Membros</p>
                  <p className="text-xs text-muted-foreground">
                    de {gym.maxMembers} máx.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Dumbbell className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-500">{gym._count.trainers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Treinadores</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-500">{gym._count.workouts}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Treinos</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">{gym._count.expenses}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t gap-4 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/app/members?gymId=${gym.id}`}>
                      <Users className="w-4 h-4 mr-2" />
                      Membros
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/app/trainers?gymId=${gym.id}`}>
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Treinadores
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/app/workouts?gymId=${gym.id}`}>
                      <Heart className="w-4 h-4 mr-2" />
                      Treinos
                    </a>
                  </Button>
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGymStatus(gym.id, gym.isActive)}
                    >
                      {gym.isActive ? '🔒 Desativar' : '🔓 Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(gym)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(gym)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {/* Plan Info */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Plano <strong className="capitalize">{gym.plan}</strong> • 
                    Vence em: <strong>{gym.planExpiresAt ? new Date(gym.planExpiresAt).toLocaleDateString('pt-BR') : 'N/A'}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Limite usuários: <strong>{gym.maxUsers}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGyms.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma academia encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterPlan !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando uma nova academia'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Academia</DialogTitle>
            <DialogDescription>
              Atualize os dados da academia {selectedGym?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateGym}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name">Nome da Academia *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <Input
                  id="edit-cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-plan">Plano *</Label>
                <Select
                  value={formData.plan}
                  onValueChange={handlePlanChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">Estado</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a academia <strong>{selectedGym?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          {selectedGym && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação não pode ser desfeita. A academia só pode ser excluída se não possuir dados associados.
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Usuários:</span>
                  <strong>{selectedGym._count.users}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Membros:</span>
                  <strong>{selectedGym._count.members}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Treinadores:</span>
                  <strong>{selectedGym._count.trainers}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Treinos:</span>
                  <strong>{selectedGym._count.workouts}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Despesas:</span>
                  <strong>{selectedGym._count.expenses}</strong>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteGym}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Academia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
