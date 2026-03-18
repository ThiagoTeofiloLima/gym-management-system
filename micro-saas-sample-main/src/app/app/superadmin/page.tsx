'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Plus,
    Pencil,
    Trash2,
    Search,
    CheckCircle2,
    XCircle,
    Crown,
    Calendar,
    RefreshCw,
    Eye,
    EyeOff,
    UserPlus,
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface SuperAdminStats {
    totalGyms: number
    activeGyms: number
    inactiveGyms: number
    totalMembers: number
    totalUsers: number
    totalTrainers: number
    totalWorkouts: number
    monthlyRevenue: number
    gymsByPlan: Record<string, number>
    gymsByState: Record<string, number>
    topGyms: Gym[]
    recentGyms: Gym[]
    gymsExpiringSoon: Gym[]
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
    isActive: boolean
    // Dados do gestor
    managerName: string
    managerEmail: string
    managerPhone: string
    managerPassword: string
}

const PLAN_OPTIONS = [
    { value: 'basic', label: 'Básico', maxMembers: 100, maxUsers: 5, color: 'bg-green-500' },
    { value: 'pro', label: 'Pro', maxMembers: 200, maxUsers: 10, color: 'bg-blue-500' },
    { value: 'enterprise', label: 'Enterprise', maxMembers: 500, maxUsers: 20, color: 'bg-purple-500' },
]

const STATE_OPTIONS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function SuperAdminPage() {
    const [stats, setStats] = useState<SuperAdminStats | null>(null)
    const [gyms, setGyms] = useState<Gym[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterPlan, setFilterPlan] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterState, setFilterState] = useState<string>('all')

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState<{
        gymName: string
        managerName: string
        managerEmail: string
        password: string
    } | null>(null)
    const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
    const [isAssignManagerDialogOpen, setIsAssignManagerDialogOpen] = useState(false)

    const [formData, setFormData] = useState<GymFormData>({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'SP',
        plan: 'basic',
        maxMembers: 100,
        maxUsers: 5,
        isActive: true,
        managerName: '',
        managerEmail: '',
        managerPhone: '',
        managerPassword: '',
    })

    // Funções de busca de dados
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/superadmin/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error)
        }
    }

    const fetchGyms = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append('search', searchTerm)
            if (filterPlan !== 'all') params.append('plan', filterPlan)
            if (filterStatus !== 'all') params.append('status', filterStatus)
            if (filterState !== 'all') params.append('state', filterState)

            const res = await fetch(`/api/superadmin/gyms?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setGyms(data)
            }
        } catch (error) {
            console.error('Erro ao buscar academias:', error)
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as academias',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    // Carregar dados iniciais
    useEffect(() => {
        loadAllData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Debounce para busca
    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchGyms()
        }, 500)
        return () => clearTimeout(debounce)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterPlan, filterStatus, filterState])

    const loadAllData = async () => {
        setIsRefreshing(true)
        await Promise.all([fetchStats(), fetchGyms()])
        setIsRefreshing(false)
    }

    const handleRefresh = async () => {
        await loadAllData()
        toast({
            title: 'Atualizado!',
            description: 'Dados atualizados com sucesso',
        })
    }

    // Criar academia
    const handleCreateGym = async () => {
        try {
            const res = await fetch('/api/superadmin/gyms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                const data = await res.json()
                
                // Armazenar credenciais criadas
                setCreatedCredentials({
                    gymName: data.gym.name,
                    managerName: data.manager.name,
                    managerEmail: data.manager.email,
                    password: data.temporaryPassword,
                })
                
                toast({
                    title: 'Sucesso!',
                    description: 'Academia e gestor criados com sucesso',
                })
                
                setIsCreateDialogOpen(false)
                setShowCredentialsDialog(true)
                await loadAllData()
                resetForm()
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Erro ao criar academia')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível criar a academia e gestor',
                variant: 'destructive',
            })
        }
    }

    // Atualizar academia
    const handleUpdateGym = async () => {
        if (!selectedGym) return

        try {
            const res = await fetch(`/api/superadmin/gyms/${selectedGym.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                toast({
                    title: 'Sucesso!',
                    description: 'Academia atualizada com sucesso',
                })
                setIsEditDialogOpen(false)
                await loadAllData()
                resetForm()
                setSelectedGym(null)
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Erro ao atualizar academia')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível atualizar a academia',
                variant: 'destructive',
            })
        }
    }

    // Excluir academia
    const handleDeleteGym = async () => {
        if (!selectedGym) return

        try {
            const res = await fetch(`/api/superadmin/gyms/${selectedGym.id}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast({
                    title: 'Sucesso!',
                    description: 'Academia excluída com sucesso',
                })
                setIsDeleteDialogOpen(false)
                await loadAllData()
                setSelectedGym(null)
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Erro ao excluir academia')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível excluir a academia',
                variant: 'destructive',
            })
        }
    }

    // Alternar status da academia
    const handleToggleGymStatus = async (gym: Gym) => {
        try {
            const res = await fetch(`/api/superadmin/gyms/${gym.id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !gym.isActive }),
            })

            if (res.ok) {
                toast({
                    title: 'Sucesso!',
                    description: `Academia ${!gym.isActive ? 'ativada' : 'desativada'} com sucesso`,
                })
                await loadAllData()
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Erro ao alterar status')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível alterar o status',
                variant: 'destructive',
            })
        }
    }

    // Regenerar senha do gestor
    const handleRegenerateManagerPassword = async () => {
        if (!selectedGym) return

        try {
            const res = await fetch(`/api/superadmin/gyms/${selectedGym.id}/regenerate-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })

            if (res.ok) {
                const data = await res.json()

                // Mostrar credenciais geradas
                setCreatedCredentials({
                    gymName: selectedGym.name,
                    managerName: data.manager.name,
                    managerEmail: data.manager.email,
                    password: data.temporaryPassword,
                })
                setShowCredentialsDialog(true)

                toast({
                    title: 'Sucesso!',
                    description: 'Nova senha gerada com sucesso',
                })
            } else {
                const error = await res.json()
                // Se erro for "nenhum usuário vinculado", abrir diálogo para atribuir gestor
                if (res.status === 404 && error.error?.includes('Nenhum usuário')) {
                    setIsAssignManagerDialogOpen(true)
                    return
                }
                throw new Error(error.error || 'Erro ao gerar nova senha')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível gerar nova senha',
                variant: 'destructive',
            })
        }
    }

    // Atribuir gestor para a academia
    const handleAssignManager = async () => {
        if (!selectedGym) return

        try {
            const res = await fetch('/api/superadmin/gyms/assign-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    gymId: selectedGym.id,
                    managerName: formData.managerName,
                    managerEmail: formData.managerEmail,
                    managerPhone: formData.managerPhone,
                }),
            })

            if (res.ok) {
                const data = await res.json()

                // Mostrar credenciais geradas
                setCreatedCredentials({
                    gymName: selectedGym.name,
                    managerName: data.manager.name,
                    managerEmail: data.manager.email,
                    password: data.temporaryPassword,
                })
                setShowCredentialsDialog(true)
                setIsAssignManagerDialogOpen(false)

                toast({
                    title: 'Sucesso!',
                    description: 'Gestor atribuído com sucesso',
                })
            } else {
                const error = await res.json()
                throw new Error(error.error || 'Erro ao atribuir gestor')
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível atribuir gestor',
                variant: 'destructive',
            })
        }
    }

    // Abrir diálogo de edição
    const openEditDialog = (gym: Gym) => {
        setSelectedGym(gym)
        setFormData({
            name: gym.name,
            cnpj: gym.cnpj || '',
            email: gym.email || '',
            phone: gym.phone || '',
            address: gym.address || '',
            city: gym.city || '',
            state: gym.state || 'SP',
            plan: gym.plan,
            maxMembers: gym.maxMembers,
            maxUsers: gym.maxUsers,
            isActive: gym.isActive,
            managerName: '',
            managerEmail: '',
            managerPhone: '',
            managerPassword: '',
        })
        setIsEditDialogOpen(true)
    }

    // Abrir diálogo de exclusão
    const openDeleteDialog = (gym: Gym) => {
        setSelectedGym(gym)
        setIsDeleteDialogOpen(true)
    }

    // Resetar formulário
    const resetForm = () => {
        setFormData({
            name: '',
            cnpj: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: 'SP',
            plan: 'basic',
            maxMembers: 100,
            maxUsers: 5,
            isActive: true,
            managerName: '',
            managerEmail: '',
            managerPhone: '',
            managerPassword: '',
        })
    }

    // Utilitários de plano
    const getPlanColor = (plan: string) => {
        const colors: Record<string, string> = {
            basic: 'bg-green-500',
            pro: 'bg-blue-500',
            enterprise: 'bg-purple-500',
        }
        return colors[plan] || 'bg-gray-500'
    }

    const getPlanLabel = (plan: string) => {
        const labels: Record<string, string> = {
            basic: '🟢 Básico',
            pro: '🔵 Pro',
            enterprise: '🟣 Enterprise',
        }
        return labels[plan] || plan
    }

    // Loading
    if (loading && !stats) {
        return (
            <div className="p-8 flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                    <Activity className="w-12 h-12 animate-pulse mx-auto" />
                    <p className="text-lg">Carregando painel do superadmin...</p>
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
                    <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-yellow-500" />
                        <div>
                            <h1 className="text-3xl font-bold">Painel Super Admin</h1>
                            <p className="text-muted-foreground mt-1">
                                Gerenciamento completo de todas as academias do sistema
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm px-4 py-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date().toLocaleDateString('pt-BR')}
                    </Badge>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total de Academias
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.totalGyms}</div>
                                <div className="flex items-center gap-3 text-xs mt-2">
                                    <span className="text-green-500 flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {stats.activeGyms} ativas
                                    </span>
                                    <span className="text-red-500 flex items-center">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        {stats.inactiveGyms} inativas
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Membros Totais
                                </CardTitle>
                                <Users className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.totalMembers.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Em todas as academias
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Receita Mensal
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Estimativa baseada nos planos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-orange-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Equipe Total
                                </CardTitle>
                                <Activity className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{(stats.totalUsers + stats.totalTrainers).toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {stats.totalUsers} admins • {stats.totalTrainers} treinadores
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Secundárias */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalWorkouts.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Programas de treino
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Média de Membros</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.totalGyms > 0 ? Math.round(stats.totalMembers / stats.totalGyms) : 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Por academia
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Academias Inativas</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.inactiveGyms}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Requerem atenção
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Distribuição por Plano */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Academias por Plano
                            </CardTitle>
                            <CardDescription>Distribuição dos planos das academias</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(stats.gymsByPlan).map(([plan, count]) => {
                                    const percentage = (count / stats.totalGyms) * 100
                                    return (
                                        <div key={plan}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">{getPlanLabel(plan)}</span>
                                                <span>{count} academias ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                                                <div
                                                    className={`${getPlanColor(plan)} h-3 rounded-full transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribuição por Estado */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Academias por Estado
                            </CardTitle>
                            <CardDescription>Distribuição geográfica</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-9">
                                {Object.entries(stats.gymsByState)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([state, count]) => (
                                        <div key={state} className="flex flex-col items-center p-3 bg-muted rounded-lg">
                                            <span className="font-bold text-lg">{state}</span>
                                            <Badge variant="secondary" className="mt-1">{count}</Badge>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Academias */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Top 5 Academias
                                    </CardTitle>
                                    <CardDescription>Maiores academias por número de membros</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.topGyms.map((gym, index) => (
                                    <div
                                        key={gym.id}
                                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                                    index === 1 ? 'bg-gray-400 text-gray-950' :
                                                        index === 2 ? 'bg-orange-500 text-orange-950' :
                                                            'bg-gray-700'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{gym.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {gym.city} - {gym.state}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="capitalize">{getPlanLabel(gym.plan)}</Badge>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-500">{gym._count.members}</p>
                                                <p className="text-xs text-muted-foreground">membros</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academias Expirando em Breve */}
                    {stats.gymsExpiringSoon.length > 0 && (
                        <Card className="border-yellow-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                    <Calendar className="w-5 h-5" />
                                    Planos Expirando em Breve
                                </CardTitle>
                                <CardDescription>Academias que precisam de renovação</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {stats.gymsExpiringSoon.map((gym) => (
                                        <div key={gym.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                            <div>
                                                <p className="font-medium">{gym.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Expira em: {new Date(gym.planExpiresAt!).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(gym)}>
                                                Renovar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Gerenciamento de Academias */}
            <Tabs defaultValue="all" className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="active">Ativas</TabsTrigger>
                        <TabsTrigger value="inactive">Inativas</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar academias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>

                        <Select value={filterPlan} onValueChange={setFilterPlan}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="basic">Básico</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterState} onValueChange={setFilterState}>
                            <SelectTrigger className="w-24">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {STATE_OPTIONS.map((state) => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Academia
                        </Button>
                    </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                    <GymsTable
                        gyms={gyms}
                        loading={loading}
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onToggleStatus={handleToggleGymStatus}
                        getPlanColor={getPlanColor}
                        getPlanLabel={getPlanLabel}
                    />
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    <GymsTable
                        gyms={gyms.filter(g => g.isActive)}
                        loading={loading}
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onToggleStatus={handleToggleGymStatus}
                        getPlanColor={getPlanColor}
                        getPlanLabel={getPlanLabel}
                    />
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                    <GymsTable
                        gyms={gyms.filter(g => !g.isActive)}
                        loading={loading}
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onToggleStatus={handleToggleGymStatus}
                        getPlanColor={getPlanColor}
                        getPlanLabel={getPlanLabel}
                    />
                </TabsContent>
            </Tabs>

            {/* Dialog de Criação */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nova Academia</DialogTitle>
                        <DialogDescription>
                            Preencha os dados para cadastrar uma nova academia no sistema
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome da academia"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input
                                    id="cnpj"
                                    value={formData.cnpj}
                                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contato@academia.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Endereço</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Rua, número, bairro"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade *</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Cidade"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">Estado *</Label>
                                <Select value={formData.state} onValueChange={(state) => setFormData({ ...formData, state })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATE_OPTIONS.map((state) => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan">Plano *</Label>
                                <Select
                                    value={formData.plan}
                                    onValueChange={(plan) => {
                                        const option = PLAN_OPTIONS.find(o => o.value === plan)
                                        setFormData({
                                            ...formData,
                                            plan,
                                            maxMembers: option?.maxMembers || 100,
                                            maxUsers: option?.maxUsers || 5,
                                        })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLAN_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxMembers">Máx. Membros</Label>
                                <Input
                                    id="maxMembers"
                                    type="number"
                                    value={formData.maxMembers}
                                    onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxUsers">Máx. Usuários</Label>
                                <Input
                                    id="maxUsers"
                                    type="number"
                                    value={formData.maxUsers}
                                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="isActive">Academia ativa</Label>
                        </div>

                        {/* Seção do Gestor */}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Dados do Gestor da Academia
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="managerName">Nome do Gestor *</Label>
                                    <Input
                                        id="managerName"
                                        value={formData.managerName}
                                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                                        placeholder="Nome completo do gestor"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="managerEmail">Email do Gestor *</Label>
                                    <Input
                                        id="managerEmail"
                                        type="email"
                                        value={formData.managerEmail}
                                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                                        placeholder="gestor@academia.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="managerPhone">Telefone do Gestor</Label>
                                    <Input
                                        id="managerPhone"
                                        value={formData.managerPhone}
                                        onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="managerPassword">
                                        🔐 Senha de Acesso do Gestor
                                    </Label>
                                    <Input
                                        id="managerPassword"
                                        type="password"
                                        value={formData.managerPassword}
                                        onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })}
                                        placeholder="Deixe em branco para gerar senha automática"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Mínimo 6 caracteres. Se não preencher, uma senha forte será gerada automaticamente.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>ℹ️ Importante:</strong> As credenciais de acesso serão exibidas após a criação. 
                                    Envie-as em segurança para o gestor da academia.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateGym}>
                            Criar Academia
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Academia</DialogTitle>
                        <DialogDescription>
                            Atualize os dados da academia
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-cnpj">CNPJ</Label>
                                <Input
                                    id="edit-cnpj"
                                    value={formData.cnpj}
                                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">E-mail</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Telefone</Label>
                                <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Endereço</Label>
                            <Input
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-city">Cidade *</Label>
                                <Input
                                    id="edit-city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-state">Estado *</Label>
                                <Select value={formData.state} onValueChange={(state) => setFormData({ ...formData, state })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATE_OPTIONS.map((state) => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan">Plano *</Label>
                                <Select
                                    value={formData.plan}
                                    onValueChange={(plan) => {
                                        const option = PLAN_OPTIONS.find(o => o.value === plan)
                                        setFormData({
                                            ...formData,
                                            plan,
                                            maxMembers: option?.maxMembers || 100,
                                            maxUsers: option?.maxUsers || 5,
                                        })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLAN_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-maxMembers">Máx. Membros</Label>
                                <Input
                                    id="edit-maxMembers"
                                    type="number"
                                    value={formData.maxMembers}
                                    onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-maxUsers">Máx. Usuários</Label>
                                <Input
                                    id="edit-maxUsers"
                                    type="number"
                                    value={formData.maxUsers}
                                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="edit-isActive">Academia ativa</Label>
                        </div>

                        {/* Seção de Segurança do Gestor */}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Crown className="w-5 h-5" />
                                🔐 Segurança do Gestor
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        Para alterar a senha de acesso do gestor, utilize o botão abaixo para gerar uma nova senha temporária.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleRegenerateManagerPassword}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Gerar Nova Senha para o Gestor
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateGym}>
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Academia</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir a academia &quot;{selectedGym?.name}&quot;? Esta ação não pode ser desfeita.
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                    ⚠️ Isso excluirá todos os dados associados (membros, treinos, usuários, etc.)
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteGym}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Credenciais Criadas */}
            <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-6 h-6" />
                            Academia e Gestor Criados com Sucesso!
                        </DialogTitle>
                        <DialogDescription>
                            As credenciais de acesso do gestor foram geradas. Envie-as em segurança para o responsável.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {createdCredentials && (
                        <div className="space-y-4">
                            {/* Informações da Academia */}
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-semibold mb-1">🏋️ Academia</p>
                                <p className="text-lg font-bold">{createdCredentials.gymName}</p>
                            </div>

                            {/* Informações do Gestor */}
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-semibold mb-1">👤 Gestor</p>
                                <p className="text-base">{createdCredentials.managerName}</p>
                            </div>

                            {/* Credenciais de Acesso */}
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                                <p className="text-sm font-semibold mb-3 text-blue-700 dark:text-blue-300">
                                    🔐 Credenciais de Acesso
                                </p>
                                
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Email de Login</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                value={createdCredentials.managerEmail}
                                                readOnly
                                                className="font-mono text-sm bg-white dark:bg-gray-900"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(createdCredentials.managerEmail)
                                                    toast({
                                                        title: 'Copiado!',
                                                        description: 'Email copiado para a área de transferência',
                                                    })
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-muted-foreground">Senha Temporária</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                value={createdCredentials.password}
                                                readOnly
                                                className="font-mono text-sm bg-white dark:bg-gray-900"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(createdCredentials.password)
                                                    toast({
                                                        title: 'Copiado!',
                                                        description: 'Senha copiada para a área de transferência',
                                                    })
                                                }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instruções */}
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    <strong>⚠️ Importante:</strong> Oriente o gestor a alterar a senha no primeiro acesso. 
                                    O login pode ser feito em <strong className="font-mono">/app</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (createdCredentials) {
                                    // Copiar todas as credenciais
                                    const credentialsText = `
Academia: ${createdCredentials.gymName}
Gestor: ${createdCredentials.managerName}
Email: ${createdCredentials.managerEmail}
Senha: ${createdCredentials.password}
                                    `.trim()
                                    navigator.clipboard.writeText(credentialsText)
                                    toast({
                                        title: 'Copiado!',
                                        description: 'Todas as credenciais copiadas',
                                    })
                                }
                            }}
                        >
                            Copiar Todas
                        </Button>
                        <Button onClick={() => setShowCredentialsDialog(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de Atribuir Gestor */}
            <Dialog open={isAssignManagerDialogOpen} onOpenChange={setIsAssignManagerDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-6 h-6" />
                            Atribuir Gestor para {selectedGym?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Esta academia não possui um gestor vinculado. Preencha os dados abaixo para criar e atribuir um gestor.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="managerName">Nome do Gestor *</Label>
                            <Input
                                id="managerName"
                                value={formData.managerName}
                                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="managerEmail">Email do Gestor *</Label>
                            <Input
                                id="managerEmail"
                                type="email"
                                value={formData.managerEmail}
                                onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                                placeholder="Ex: joao@academia.com.br"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="managerPhone">Telefone do Gestor</Label>
                            <Input
                                id="managerPhone"
                                value={formData.managerPhone}
                                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                                placeholder="Ex: (11) 99999-9999"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignManagerDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAssignManager}
                            disabled={!formData.managerName || !formData.managerEmail}
                        >
                            Atribuir e Gerar Senha
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Componente da Tabela de Academias
function GymsTable({
    gyms,
    loading,
    onEdit,
    onDelete,
    onToggleStatus,
    getPlanColor,
    getPlanLabel,
}: {
    gyms: Gym[]
    loading: boolean
    onEdit: (gym: Gym) => void
    onDelete: (gym: Gym) => void
    onToggleStatus: (gym: Gym) => void
    getPlanColor: (plan: string) => string
    getPlanLabel: (plan: string) => string
}) {
    const [managerPasswords, setManagerPasswords] = useState<Record<string, string>>({})
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

    // Buscar senhas dos gestores
    useEffect(() => {
        const fetchManagerPasswords = async () => {
          try {
            const res = await fetch('/api/superadmin/gyms/managers')
            if (res.ok) {
              const managers = await res.json()
              const passwordMap: Record<string, string> = {}
              managers.forEach((m: any) => {
                if (m.gymId && m.tempPassword) {
                  passwordMap[m.gymId] = m.tempPassword
                }
              })
              setManagerPasswords(passwordMap)
            }
          } catch (error) {
            console.error('Erro ao buscar senhas dos gestores:', error)
          }
        }
        fetchManagerPasswords()
    }, [])

    const togglePasswordVisibility = (gymId: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [gymId]: !prev[gymId]
        }))
    }

    const copyPassword = (gymId: string, password: string) => {
        navigator.clipboard.writeText(password)
        toast({
            title: 'Copiado!',
            description: 'Senha copiada para a área de transferência',
        })
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Activity className="w-8 h-8 animate-pulse mx-auto mb-4" />
                    <p>Carregando academias...</p>
                </CardContent>
            </Card>
        )
    }

    if (gyms.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhuma academia encontrada
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Membros</TableHead>
                            <TableHead>Gestor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gyms.map((gym) => {
                            const password = managerPasswords[gym.id]
                            const showPassword = visiblePasswords[gym.id]

                            return (
                            <TableRow key={gym.id}>
                                <TableCell className="font-medium">{gym.name}</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{gym.city || 'N/A'}</div>
                                        <div className="text-muted-foreground">{gym.state || 'N/A'}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${getPlanColor(gym.plan).replace('bg-', 'text-')} capitalize`}>
                                        {getPlanLabel(gym.plan)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>{gym._count.members}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {password ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm font-mono">
                                                    <span className="truncate">📧 {showPassword ? password : '••••••••••••'}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => togglePasswordVisibility(gym.id)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => copyPassword(gym.id, password)}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">🔐 Senha de acesso do gestor</p>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={gym.isActive ? 'default' : 'secondary'}>
                                            {gym.isActive ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                        <Switch
                                            checked={gym.isActive}
                                            onCheckedChange={() => onToggleStatus(gym)}
                                            className="scale-75"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(gym)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(gym)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
