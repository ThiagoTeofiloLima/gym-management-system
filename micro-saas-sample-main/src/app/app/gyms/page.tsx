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
  // Dados do gestor
  managerName: string
  managerEmail: string
  managerPassword: string
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  
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
    managerName: '',
    managerEmail: '',
    managerPassword: '',
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
        managerName: '',
        managerEmail: '',
        managerPassword: '',
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
      // Preparar dados para envio (converter strings vazias para null)
      const dataToSend = {
        ...formData,
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        managerPassword: formData.managerPassword || undefined,
      }

      const res = await fetch('/api/superadmin/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })
      if (res.ok) {
        const data = await res.json()
        toast({
          title: 'Sucesso!',
          description: data.message || 'Academia criada com sucesso.',
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
          managerName: '',
          managerEmail: '',
          managerPassword: '',
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
    console.log('🔴 handleDeleteGym chamada')
    console.log('🔴 selectedGym:', selectedGym?.name)
    console.log('🔴 isPasswordDialogOpen antes:', isPasswordDialogOpen)
    
    if (!selectedGym) {
      console.error('❌ selectedGym é null!')
      return
    }

    // Abrir dialog de senha
    console.log('🟢 Abrindo password dialog...')
    setIsDeleteDialogOpen(false)
    setIsPasswordDialogOpen(true)
    setDeletePassword('')
    
    console.log('🟢 isPasswordDialogOpen depois:', true)
  }

  async function confirmDeleteWithPassword() {
    if (!deletePassword || deletePassword.trim() === '') {
      toast({
        title: 'Erro',
        description: 'Digite sua senha do Super Admin para confirmar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch(`/api/superadmin/gyms/${selectedGym?.id}?password=${encodeURIComponent(deletePassword.trim())}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Academia deletada com sucesso.',
          variant: 'success',
        })
        setIsPasswordDialogOpen(false)
        setDeletePassword('')
        setSelectedGym(null)
        fetchGyms()
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao deletar academia',
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
    totalMembers: gyms.reduce((acc, g) => acc + (g._count?.members || 0), 0),
    totalUsers: gyms.reduce((acc, g) => acc + (g._count?.users || 0), 0),
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

                {/* Seção do Gestor */}
                <div className="col-span-2 mt-6 border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Dados do Gestor da Academia
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Se o email já estiver cadastrado, a academia será vinculada a este gestor.
                  </p>
                </div>

                <div>
                  <Label htmlFor="managerName">Nome do Gestor *</Label>
                  <Input
                    id="managerName"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="managerEmail">Email do Gestor *</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    placeholder="gestor@academia.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="managerPassword">Senha (opcional)</Label>
                  <Input
                    id="managerPassword"
                    type="password"
                    value={formData.managerPassword}
                    onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })}
                    placeholder="Deixe em branco para gerar automaticamente"
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
                    <span className="text-2xl font-bold text-blue-500">{gym._count?.users || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">{gym._count?.members || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Membros</p>
                  <p className="text-xs text-muted-foreground">
                    de {gym.maxMembers} máx.
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Dumbbell className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-500">{gym._count?.trainers || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Treinadores</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-500">{gym._count?.workouts || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Treinos</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">{gym._count?.expenses || 0}</span>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedGym?.name ? (
                <>
                  Tem certeza que deseja excluir a academia{' '}
                  <strong className="text-foreground">{selectedGym.name}</strong>?
                </>
              ) : (
                'Tem certeza que deseja excluir esta academia?'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>⚠️ Esta ação não pode ser desfeita.</p>
              <p className="mt-1">A academia só pode ser excluída se não possuir dados vinculados.</p>
            </div>

            {selectedGym && (
              <div className="bg-muted/50 border rounded-lg p-3 space-y-2 text-sm">
                <p className="font-semibold mb-2">📊 Dados da academia:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários:</span>
                    <strong>{selectedGym._count.users}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membros:</span>
                    <strong>{selectedGym._count.members}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treinadores:</span>
                    <strong>{selectedGym._count.trainers}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treinos:</span>
                    <strong>{selectedGym._count.workouts}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Despesas:</span>
                    <strong>{selectedGym._count.expenses}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                🔐 Autenticação Necessária
              </p>
              <p className="text-yellow-700 dark:text-yellow-500">
                Após confirmar, você precisará digitar sua senha de Super Admin para concluir a exclusão.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedGym(null)
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGym}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Prosseguir com Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog - Popup para senha do Super Admin */}
      <Dialog 
        open={isPasswordDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔐 Password Dialog onOpenChange:', open)
          setIsPasswordDialogOpen(open)
          if (!open) {
            setDeletePassword('')
            setSelectedGym(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🔐</span>
              Autenticação de Super Admin
            </DialogTitle>
            <DialogDescription className="pt-3">
              Para excluir a academia{' '}
              <strong className="text-foreground">{selectedGym?.name}</strong>,
              {' '}digite sua senha de Super Admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
              <p className="font-semibold text-red-800 dark:text-red-400 mb-1">
                ⚠️ Ação Irreversível
              </p>
              <p className="text-red-700 dark:text-red-500">
                Esta ação não pode ser desfeita. Tenha certeza que deseja excluir esta academia.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Senha do Super Admin *
              </Label>
              <Input
                id="password"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  console.log('🔑 Password changed:', e.target.value ? '***' : 'vazio')
                  setDeletePassword(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('⏎ Enter pressionado, chamando confirmDeleteWithPassword')
                    confirmDeleteWithPassword()
                  }
                }}
                placeholder="Digite sua senha"
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('❌ Cancelar clicado no Password Dialog')
                setIsPasswordDialogOpen(false)
                setDeletePassword('')
                setSelectedGym(null)
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('🗑️ Excluir Permanentemente clicado')
                console.log('🗑️ deletePassword:', deletePassword ? '***' : 'vazio')
                confirmDeleteWithPassword()
              }}
              disabled={!deletePassword || deletePassword.trim() === ''}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
