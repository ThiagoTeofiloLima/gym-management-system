'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Heart, Dumbbell, DollarSign, TrendingUp, TrendingDown, Activity, Calendar, AlertCircle, CheckCircle2, Clock, UserCheck, UserX, Percent } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Gym {
  id: string
  name: string
  city: string
  state: string
  plan: string
  isActive: boolean
  _count: {
    users: number
    members: number
    trainers: number
    workouts: number
    expenses: number
  }
}

interface ManagerMetrics {
  activeMembers: number
  inactiveMembers: number
  pendingMembers: number
  renewalsIn7Days: number
  renewalsIn30Days: number
  delinquentMembers: number
  newMembersThisMonth: number
  visitedLast7Days: number
  frequencyRate: number
  membersByPlan: Record<string, number>
  occupancyRate: number
  totalCapacity: number
}

interface DashboardData {
  gyms: Gym[]
  stats: {
    totalGyms: number
    activeGyms: number
    inactiveGyms: number
    totalMembers: number
    totalUsers: number
    totalTrainers: number
    totalWorkouts: number
    totalExpenses: number
  }
  monthlyRevenue: number
  managerMetrics: ManagerMetrics | null
  gymsByPlan: Record<string, number>
  gymsByState: Record<string, number>
  topGyms: Gym[]
  recentGyms: Gym[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [gymId, setGymId] = useState<string | null>(null)

  useEffect(() => {
    // Pega o gymId da URL
    const params = new URLSearchParams(window.location.search)
    const selectedGymId = params.get('gymId')
    setGymId(selectedGymId)
    fetchDashboardData(selectedGymId)
  }, [])

  // Adicionar listener para mudanças na URL
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search)
      const selectedGymId = params.get('gymId')
      setGymId(selectedGymId)
      fetchDashboardData(selectedGymId)
    }

    // Ouvir evento de popstate (voltar/avançar)
    window.addEventListener('popstate', handleUrlChange)
    
    // Polling para detectar mudanças na URL
    const interval = setInterval(() => {
      const currentGymId = new URLSearchParams(window.location.search).get('gymId')
      if (currentGymId !== gymId) {
        handleUrlChange()
      }
    }, 500)

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
      clearInterval(interval)
    }
  }, [gymId])

  async function fetchDashboardData(selectedGymId: string | null) {
    setLoading(true)
    try {
      const url = selectedGymId
        ? `/api/dashboard?gymId=${selectedGymId}`
        : '/api/dashboard'

      console.log('[Dashboard] Fetching data for gymId:', selectedGymId)
      
      const res = await fetch(url)
      if (res.ok) {
        const dashboardData = await res.json()
        console.log('[Dashboard] Received data:', dashboardData.stats)
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 animate-pulse mx-auto" />
          <p className="text-lg">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Erro ao carregar dados do dashboard
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, monthlyRevenue, gymsByPlan, gymsByState, topGyms, recentGyms, gyms } = data

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {gymId 
              ? `Dados de: ${recentGyms[0]?.name || 'sua academia'}`
              : stats.totalGyms === 1 
                ? `Visão geral da ${recentGyms[0]?.name || 'sua academia'}`
                : `Visão consolidada de ${stats.totalGyms} academias`
            }
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('pt-BR')}
        </Badge>
      </div>
      
      {/* Indicador de academia selecionada vs consolidado */}
      {!gymId && stats.totalGyms > 1 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Visualizando {stats.totalGyms} academias
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dados consolidados de todas as suas academias
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.totalMembers} membros • {stats.totalWorkouts} treinos • {stats.totalExpenses} despesas
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Principais */}
      {data?.managerMetrics ? (
        // DASHBOARD PARA GESTORES (GYM ADMIN / USER)
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.activeMembers.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="text-red-500 flex items-center">
                  <UserX className="w-3 h-3 mr-1" />
                  {data.managerMetrics.inactiveMembers} inativos
                </span>
                <span className="text-yellow-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {data.managerMetrics.pendingMembers} pendentes
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renovações Próximas</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.renewalsIn7Days}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Próximos 7 dias • {data.managerMetrics.renewalsIn30Days} nos próximos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.delinquentMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamento vencido (+7 dias)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frequência</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.frequencyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.managerMetrics.visitedLast7Days} membros vieram nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // DASHBOARD PARA SUPER ADMIN
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats.totalGyms === 1 ? 'Sua Academia' : 'Total de Academias'}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGyms}</div>
              {stats.totalGyms > 1 && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-green-500 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stats.activeGyms} ativas
                  </span>
                  <span className="text-red-500 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {stats.inactiveGyms} inativas
                  </span>
                </div>
              )}
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
                {stats.totalGyms === 1
                  ? 'Membros da academia'
                  : 'Em todas as academias'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalGyms === 1
                  ? 'Plano da academia'
                  : 'Estimativa baseada nos planos'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipe Total</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalUsers + stats.totalTrainers).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers} admins • {stats.totalTrainers} treinadores
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Secundárias */}
      {data?.managerMetrics ? (
        // Stats adicionais para gestores
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <Percent className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.managerMetrics.activeMembers} de {data.managerMetrics.totalCapacity} vagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.managerMetrics.newMembersThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Neste mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distribuição por Plano</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.managerMetrics.membersByPlan).map(([plan, count]) => (
                  <Badge key={plan} variant="outline" className="capitalize">
                    {plan}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Stats secundárias para Super Admin
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Despesas Registradas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalGyms === 1
                  ? 'Da sua academia'
                  : 'Em todas as academias'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membros por Academia</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalGyms > 0 ? Math.round(stats.totalMembers / stats.totalGyms) : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média de membros
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações Recomendadas - Apenas para gestores */}
      {data?.managerMetrics && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Ações Recomendadas para Hoje
            </CardTitle>
            <CardDescription>
              Baseado nos dados da sua academia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.managerMetrics.delinquentMembers > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Cobrar {data.managerMetrics.delinquentMembers} membros inadimplentes
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      Pagamento vencido há mais de 7 dias
                    </p>
                  </div>
                </div>
              )}
              
              {data.managerMetrics.renewalsIn7Days > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      Contatar {data.managerMetrics.renewalsIn7Days} membros com renovação próxima
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      Plano vence nos próximos 7 dias
                    </p>
                  </div>
                </div>
              )}
              
              {data.managerMetrics.pendingMembers > 0 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                      Ativar {data.managerMetrics.pendingMembers} membros pendentes
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      Aguardando confirmação de cadastro
                    </p>
                  </div>
                </div>
              )}
              
              {data.managerMetrics.frequencyRate < 30 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                      Campanha de reengajamento
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                      Frequência abaixo de 30% ({data.managerMetrics.frequencyRate}%)
                    </p>
                  </div>
                </div>
              )}
              
              {data.managerMetrics.delinquentMembers === 0 && 
               data.managerMetrics.renewalsIn7Days === 0 && 
               data.managerMetrics.pendingMembers === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Tudo em ordem! 🎉
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Nenhuma ação pendente para hoje
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Plano - Apenas para Super Admin */}
      {stats.totalGyms > 1 && Object.keys(gymsByPlan).length > 0 && (
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
              {Object.entries(gymsByPlan).map(([plan, count]) => {
                const percentage = (count / stats.totalGyms) * 100
                const colors: Record<string, string> = {
                  basic: 'bg-green-500',
                  pro: 'bg-blue-500',
                  enterprise: 'bg-purple-500',
                }
                const labels: Record<string, string> = {
                  basic: '🟢 Básico',
                  pro: '🔵 Pro',
                  enterprise: '🟣 Enterprise',
                }
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{labels[plan] || plan}</span>
                      <span>{count} academias ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`${colors[plan] || 'bg-blue-500'} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Estado - Apenas para Super Admin */}
      {stats.totalGyms > 1 && Object.keys(gymsByState).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Academias por Estado
            </CardTitle>
            <CardDescription>Distribuição geográfica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(gymsByState)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-bold text-lg">{state}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Academias - Apenas para Super Admin */}
      {stats.totalGyms > 1 && topGyms.length > 0 && (
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
              <Link href="/app/gyms">
                <Badge variant="outline" className="cursor-pointer">
                  Ver todas →
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topGyms.map((gym, index) => (
                <div
                  key={gym.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-yellow-950' :
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
                    <Badge variant="outline" className="capitalize">{gym.plan}</Badge>
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
      )}

      {/* Lista de Academias */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {stats.totalGyms === 1 ? 'Sua Academia' : 'Academias no Sistema'}
              </CardTitle>
              <CardDescription>
                {stats.totalGyms === 1 
                  ? 'Dados da sua academia'
                  : 'Todas as academias cadastradas'
                }
              </CardDescription>
            </div>
            {stats.totalGyms > 1 && (
              <Link href="/app/gyms">
                <Badge variant="outline" className="cursor-pointer">
                  Gerenciar →
                </Badge>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentGyms.map((gym) => (
              <div
                key={gym.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold truncate flex-1">{gym.name}</h4>
                  <Badge variant={gym.isActive ? 'default' : 'secondary'} className="ml-2 text-xs">
                    {gym.isActive ? '✓' : '✗'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {gym.city} - {gym.state}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="capitalize">{gym.plan}</Badge>
                  <span className="text-muted-foreground">
                    {gym._count.members} membros
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links Rápidos - Mostrar baseados no contexto */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.totalGyms > 1 ? (
          <Link href="/app/gyms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Gerenciar Academias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie, edite e gerencie todas as academias do sistema
                </p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          recentGyms[0] && (
            <Link href={`/app/members?gymId=${recentGyms[0].id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-blue-500" />
                    Membros da Academia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os membros da {recentGyms[0].name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        )}

        <Link href="/app/members">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-green-500" />
                Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie membros
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/trainers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="w-5 h-5 text-yellow-500" />
                Treinadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie treinadores e suas especialidades
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/expenses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-5 h-5 text-red-500" />
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acompanhe despesas
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
