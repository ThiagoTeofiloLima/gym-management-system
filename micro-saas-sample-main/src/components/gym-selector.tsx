'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGym } from "@/contexts/gym-context"
import { Building2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function GymSelector() {
  const { activeGymId, userGyms, setGymId, activeGym } = useGym()

  if (userGyms.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground uppercase">
        <Building2 className="w-3 h-3" />
        Academia
      </div>
      <Select value={activeGymId || undefined} onValueChange={setGymId}>
        <SelectTrigger className="w-full h-10 justify-start">
          <SelectValue placeholder="Selecione uma academia" />
        </SelectTrigger>
        <SelectContent>
          {userGyms.map((gym) => (
            <SelectItem key={gym.id} value={gym.id}>
              <div className="flex items-center gap-2">
                <span className="truncate">{gym.name}</span>
                {gym.id === activeGymId && (
                  <Check className="w-3 h-3 ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeGym && (
        <div className="px-3 py-1.5 bg-muted rounded-md">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Plano:</span>
            <Badge variant="outline" className="capitalize text-xs">
              {activeGym.plan}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
