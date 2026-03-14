import { GymSwitcher } from '@/components/gym-switcher'
import { auth } from '@/services/auth'
import { getUserAccessibleGyms } from '@/lib/multi-tenant'
import { headers } from 'next/headers'

export async function AppHeader() {
  const session = await auth()
  const headersList = await headers()
  
  // Obter gymId da URL atual
  const fullUrl = headersList.get('x-url') || headersList.get('referer') || ''
  const url = new URL(fullUrl, 'http://localhost:3000')
  const currentGymId = url.searchParams.get('gymId')
  
  if (!session?.user) {
    return null
  }
  
  // Obter academias acessíveis
  const accessibleGyms = await getUserAccessibleGyms(session.user.id)
  
  // Se não tem múltiplas academias, não mostra o switcher
  if (accessibleGyms.length <= 1) {
    return null
  }
  
  // Format gyms for the switcher
  const userGyms = accessibleGyms.map(g => ({
    gymId: g.gymId,
    gymName: g.gymName,
    plan: g.plan,
    isActive: g.isActive,
  }))
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-14 items-center px-4 gap-4">
        <div className="flex-1" />
        <GymSwitcher 
          userGyms={userGyms}
          currentGymId={currentGymId}
        />
      </div>
    </header>
  )
}
