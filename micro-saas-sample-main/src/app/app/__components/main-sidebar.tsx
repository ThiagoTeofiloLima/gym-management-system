"use client";

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
} from "@/components/dashboard/sidebar";
import {
    HomeIcon,
    GearIcon,
    PersonIcon,
    BarChartIcon,
    CalendarIcon,
    CardStackIcon
} from "@radix-ui/react-icons";
import { Dumbbell } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserDropdown } from "./user-dropdown";
import { Logo } from "@/components/logo";
import { Session } from "next-auth";

type MainSidebarProps = {
    user: Session["user"];
};

export function MainSidebar({ user }: MainSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <DashboardSidebar>
            <DashboardSidebarHeader>
                <Logo />
            </DashboardSidebarHeader>

            <DashboardSidebarMain className="flex flex-col flex-grow">
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
                            href="/app/analytics"
                            active={isActive("/app/analytics")}
                        >
                            <BarChartIcon />
                            Análises
                        </DashboardSidebarNavLink>
                        <DashboardSidebarNavLink
                            className="flex items-center gap-2"
                            href="/app/settings"
                            active={isActive("/app/settings")}
                        >
                            <GearIcon />
                            Configurações
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
                <UserDropdown user={user} />
            </DashboardSidebarFooter>
        </DashboardSidebar>
    );
}
