"use client"

import {
    DashboardSidebar,
    DashboardSidebarFooter,
    DashboardSidebarHeader,
    DashboardSidebarMain,
    DashboardSidebarNav,
    DashboardSidebarNavHeader,
    DashboardSidebarNavHeaderTitle,
    DashboardSidebarNavLink,
    DashboardSidebarNavMain,
} from "@/components/dashboard/sidebar"
import {
    HomeIcon,
    GearIcon,
    PersonIcon,
    BarChartIcon,
    CalendarIcon,
    CardStackIcon,
    DashboardIcon,
} from "@radix-ui/react-icons"
import { Dumbbell, Building2, Crown, Check, Building, DollarSign } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { UserDropdown } from "./user-dropdown"
import { Logo } from "@/components/logo"
import { Session } from "next-auth"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { TenantContext } from "@/lib/multi-tenant"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type MainSidebarProps = {
    user: Session["user"]
    context: TenantContext
    accessibleGyms: Array<{
        gymId: string
        gymName: string
        role: string
        plan: string
        isActive: boolean
    }>
}

export function MainSidebar({ user, context, accessibleGyms }: MainSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [selectedGym, setSelectedGym] = useState(context.gymId || "all")

    const isActive = (path: string) => {
        return pathname === path
    }

    const handleGymChange = (gymId: string) => {
        setSelectedGym(gymId)

        // Armazena a academia selecionada em localStorage
        if (gymId !== "all") {
            localStorage.setItem("activeGymId", gymId)
        } else {
            localStorage.removeItem("activeGymId")
        }

        // Adiciona gymId como query param na URL atual e recarrega
        const currentPath = window.location.pathname
        const currentParams = new URLSearchParams(window.location.search)

        if (gymId === "all") {
            currentParams.delete("gymId")
        } else {
            currentParams.set("gymId", gymId)
        }

        router.push(`${currentPath}?${currentParams.toString()}`)
        router.refresh()
    }

    // Verifica se é Super Admin
    const isSuperAdmin = user.role === "SUPER_ADMIN" || context.isSuperAdmin
    
    // Verifica se usuário tem múltiplas academias
    const hasMultipleGyms = accessibleGyms.length > 1
    
    // Debug log
    console.log('[Sidebar] User:', user.email)
    console.log('[Sidebar] Accessible Gyms:', accessibleGyms.length)
    console.log('[Sidebar] Has Multiple Gyms:', hasMultipleGyms)
    console.log('[Sidebar] Selected Gym:', selectedGym)

    return (
        <DashboardSidebar>
            <DashboardSidebarHeader>
                <Logo />
            </DashboardSidebarHeader>

            <DashboardSidebarMain className="flex flex-col flex-grow">
                {/* Seletor de Academia - Destaque para múltiplas academias */}
                {hasMultipleGyms && (
                    <div className="px-3 py-3">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-lg">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    <Building className="w-3 h-3" />
                                    Alternar Academia
                                </div>
                                <Select value={selectedGym} onValueChange={handleGymChange}>
                                    <SelectTrigger className="h-11 text-sm bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 shadow-sm">
                                        <Building2 className="h-4 w-4 mr-2 opacity-70" />
                                        <SelectValue placeholder="Selecione uma academia" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                                        {accessibleGyms.map((gym) => (
                                            <SelectItem key={gym.gymId} value={gym.gymId}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 opacity-70" />
                                                    <span className="font-medium truncate">{gym.gymName}</span>
                                                    {gym.gymId === selectedGym && (
                                                        <Check className="h-3.5 w-3.5 text-green-500 ml-auto flex-shrink-0" />
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Indicador visual da academia atual */}
                                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-blue-200 dark:border-blue-800">
                                    <span className="font-medium">Academia atual:</span>
                                    <Badge variant="secondary" className="text-xs max-w-[150px] truncate">
                                        {accessibleGyms.find(g => g.gymId === selectedGym)?.gymName || 'Todas'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                {/* Seletor simples para Super Admin */}
                {!hasMultipleGyms && isSuperAdmin && (
                    <div className="px-3 py-2">
                        <Select value={selectedGym} onValueChange={handleGymChange}>
                            <SelectTrigger className="h-9 text-xs">
                                <Building2 className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                <SelectValue placeholder="Selecionar academia" />
                            </SelectTrigger>
                            <SelectContent>
                                {isSuperAdmin && (
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-3.5 w-3.5 text-yellow-500" />
                                            <span>Todas as academias (Super Admin)</span>
                                        </div>
                                    </SelectItem>
                                )}
                                {accessibleGyms.map((gym) => (
                                    <SelectItem key={gym.gymId} value={gym.gymId}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3.5 w-3.5 opacity-70" />
                                            <span className="truncate">{gym.gymName}</span>
                                            {gym.role === "GYM_ADMIN" && (
                                                <span className="text-[10px] bg-primary/20 px-1 rounded">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <DashboardSidebarNav>
                    <DashboardSidebarNavMain>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app"
                            active={isActive("/app")}
                        >
                            <HomeIcon />
                            Dashboard
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/members"
                            active={isActive("/app/members")}
                        >
                            <PersonIcon />
                            Membros
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/trainers"
                            active={isActive("/app/trainers")}
                        >
                            <Dumbbell className="h-4 w-4" />
                            Personal Trainers
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/workouts"
                            active={isActive("/app/workouts")}
                        >
                            <Dumbbell className="h-4 w-4" />
                            Treinos
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/attendance"
                            active={isActive("/app/attendance")}
                        >
                            <CalendarIcon />
                            Frequência
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/financial"
                            active={isActive("/app/financial")}
                        >
                            <CardStackIcon />
                            Financeiro
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/expenses"
                            active={isActive("/app/expenses")}
                        >
                            <CardStackIcon />
                            Despesas
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/analytics"
                            active={isActive("/app/analytics")}
                        >
                            <BarChartIcon />
                            Análises
                        </DashboardSidebarNavLink>
                        
                        {/* Link exclusivo para Super Admin */}
                        {isSuperAdmin && (
                            <>
                                <DashboardSidebarNavLink
                                    className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400"
                                    href="/app/superadmin"
                                    active={Boolean(isActive("/app/superadmin") || (pathname && pathname.includes("/app/superadmin")))}
                                >
                                    <Crown className="h-4 w-4" />
                                    Painel Super Admin
                                </DashboardSidebarNavLink>
                                <DashboardSidebarNavLink
                                    className="flex items-center gap-2"
                                    href="/app/gyms"
                                    active={Boolean(isActive("/app/gyms") || (pathname && pathname.includes("/app/gyms")))}
                                >
                                    <Building2 className="h-4 w-4" />
                                    Gestão de Academias
                                </DashboardSidebarNavLink>
                            </>
                        )}
                        
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/settings"
                            active={isActive("/app/settings")}
                        >
                            <GearIcon />
                            Configurações
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/settings/pricing"
                            active={isActive("/app/settings/pricing")}
                        >
                            <DollarSign className="h-4 w-4" />
                            Planos e Preços
                        </DashboardSidebarNavLink>
                    </DashboardSidebarNavMain>
                </DashboardSidebarNav>

                <DashboardSidebarNav className="mt-auto">
                    <DashboardSidebarNavMain>
                        <DashboardSidebarNavHeader>
                            <DashboardSidebarNavHeaderTitle>
                                Links extras
                            </DashboardSidebarNavHeaderTitle>
                        </DashboardSidebarNavHeader>
                        <DashboardSidebarNavLink href="/">
                            Precisa de ajuda?
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink href="https://viniciusleonel.dev.br/">
                            Site
                        </DashboardSidebarNavLink>
                    </DashboardSidebarNavMain>
                </DashboardSidebarNav>
            </DashboardSidebarMain>

            <DashboardSidebarFooter>
                <UserDropdown user={user} context={context} />
            </DashboardSidebarFooter>
        </DashboardSidebar>
    )
}
