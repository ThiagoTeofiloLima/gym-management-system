'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Building2, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Gym {
  gymId: string
  gymName: string
  plan: string
  isActive: boolean
}

interface GymSwitcherProps {
  userGyms: Gym[]
  currentGymId: string | null
}

export function GymSwitcher({ userGyms, currentGymId }: GymSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Se não tem múltiplas academias, não mostra o switcher
  if (userGyms.length <= 1) {
    return null
  }
  
  const currentGym = userGyms.find(g => g.gymId === currentGymId)
  
  const handleSelectGym = (gymId: string) => {
    startTransition(() => {
      // Criar nova URL com gymId
      const params = new URLSearchParams(searchParams?.toString())
      params.set('gymId', gymId)
      
      // Mostrar toast de carregamento
      const selectedGym = userGyms.find(g => g.gymId === gymId)
      toast.loading(`Carregando dados de ${selectedGym?.gymName}...`, {
        id: 'gym-switch',
        duration: 2000,
      })
      
      // Atualizar URL e fazer refresh
      router.push(`${pathname}?${params.toString()}`)
      router.refresh()
      
      toast.success(`Academia alterada para ${selectedGym?.gymName}`, {
        id: 'gym-switch',
      })
      
      setOpen(false)
    })
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-10 px-4 border-2 hover:border-blue-500 transition-colors"
          disabled={isPending}
        >
          {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
          <Building2 className="w-4 h-4" />
          <span className="font-medium">
            {currentGym ? currentGym.gymName : 'Todas as academias'}
          </span>
          <Badge variant="secondary" className="ml-2">
            {userGyms.length} academias
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm">Selecionar Academia</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha qual academia deseja gerenciar
          </p>
        </div>
        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
          {userGyms.map((gym) => (
            <Button
              key={gym.gymId}
              variant={gym.gymId === currentGymId ? 'secondary' : 'ghost'}
              className="w-full justify-start h-auto py-3 px-3"
              onClick={() => handleSelectGym(gym.gymId)}
            >
              <div className="flex items-center gap-3 w-full">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gym.gymName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {gym.plan} • {gym.isActive ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
                {gym.gymId === currentGymId && (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </Button>
          ))}
        </div>
        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            {currentGymId 
              ? `Visualizando: ${currentGym?.gymName}`
              : 'Visualizando todas as academias'
            }
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
