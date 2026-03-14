'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface GymContextType {
  activeGymId: string | null
  activeGym: Gym | null
  userGyms: Gym[]
  setGymId: (gymId: string) => void
  isLoading: boolean
}

interface Gym {
  id: string
  name: string
  plan: string
  isActive: boolean
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: ReactNode }) {
  const [activeGymId, setActiveGymId] = useState<string | null>(null)
  const [userGyms, setUserGyms] = useState<Gym[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetchUserGyms()
  }, [])

  async function fetchUserGyms() {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const session = await res.json()
        const gyms = session?.user?.gyms || []
        
        if (gyms.length > 0) {
          // Filtra apenas academias ativas
          const activeGyms = gyms
            .filter((g: any) => g.status === 'ACTIVE' && g.isActive)
            .map((g: any) => ({
              id: g.gymId,
              name: g.gymName,
              plan: g.plan,
              isActive: g.isActive,
            }))
          
          setUserGyms(activeGyms)
          
          // Se não tem academia selecionada, pega a primeira
          const storedGymId = localStorage.getItem('activeGymId')
          if (storedGymId && activeGyms.find((g: Gym) => g.id === storedGymId)) {
            setActiveGymId(storedGymId)
          } else if (activeGyms.length > 0) {
            setActiveGymId(activeGyms[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar academias:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function setGymId(gymId: string) {
    setActiveGymId(gymId)
    localStorage.setItem('activeGymId', gymId)
    
    // Recarrega a página atual para atualizar os dados
    router.refresh()
  }

  const activeGym = userGyms.find(g => g.id === activeGymId) || null

  return (
    <GymContext.Provider value={{ activeGymId, activeGym, userGyms, setGymId, isLoading }}>
      {children}
    </GymContext.Provider>
  )
}

export function useGym() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider')
  }
  return context
}
