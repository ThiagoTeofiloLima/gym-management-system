import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExitIcon, GearIcon, RocketIcon } from "@radix-ui/react-icons"
import { Session } from "next-auth"
import { signOut } from "next-auth/react"
import ThemeSwitch from "../settings/theme/__components/theme-switch"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { TenantContext } from "@/lib/multi-tenant"
import { Crown } from "lucide-react"

type UserDropdownProps = {
    user: Session["user"]
    context?: TenantContext
}

export function UserDropdown({ user, context }: UserDropdownProps) {
    if (!user) {
        return
    }

    const isSuperAdmin = user.role === "SUPER_ADMIN" || context?.isSuperAdmin
    const isGymAdmin = user.role === "GYM_ADMIN" || context?.isGymAdmin

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="link"
                    className="relative h-8 flex items-center space-x-2 !px-0 justify-between w-full"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                            src={user.image as string}
                            alt={user.name as string}
                        />
                        <AvatarFallback className="text-lg uppercase">
                            {user.email?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 text-left space-y-1 w-[80%]">
                        {user.name && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium leading-none overflow-hidden text-ellipsis flex items-center gap-1">
                                    {user.name}
                                    {isSuperAdmin && (
                                        <Crown className="h-3.5 w-3.5 text-yellow-500" />
                                    )}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                            {isSuperAdmin && (
                                <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-[10px] h-4">
                                    Super Admin
                                </Badge>
                            )}
                            {isGymAdmin && !isSuperAdmin && (
                                <Badge variant="secondary" className="text-[10px] h-4">
                                    Admin
                                </Badge>
                            )}
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56 ms-4 mb-2"
                align="end"
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none overflow-hidden text-ellipsis flex items-center gap-1">
                                {user.name}
                                {isSuperAdmin && (
                                    <Crown className="h-3.5 w-3.5 text-yellow-500" />
                                )}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                            {context?.gymName && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    🏋️ {context.gymName}
                                </p>
                            )}
                        </div>
                        <ThemeSwitch />
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem className="flex items-center gap-2">
                        <GearIcon />
                        <Link href="/app/settings">
                            Configurações
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-2">
                        <RocketIcon />
                        <Link href="/app/settings/billing">
                            Assinatura e Planos
                        </Link>
                    </DropdownMenuItem>
                    
                    {isSuperAdmin && (
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <Link href="/app/gyms">
                                Gerenciar Academias
                            </Link>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => signOut()}
                >
                    <ExitIcon />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
