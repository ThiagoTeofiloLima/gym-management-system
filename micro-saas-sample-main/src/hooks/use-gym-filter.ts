'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Hook personalizado para gerenciar seleção de academia
 * - Lê gymId dos search params
 * - Fornece função para trocar de academia
 * - Dispara refresh automático quando muda
 */
export function useGymFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [gymId, setGymId] = useState<string | null>(null)

  useEffect(() => {
    const currentGymId = searchParams?.get('gymId') ?? null
    setGymId(currentGymId)
  }, [searchParams])

  const selectGym = (newGymId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString())
    
    if (newGymId) {
      params.set('gymId', newGymId)
    } else {
      params.delete('gymId')
    }
    
    // Atualiza URL sem recarregar página manualmente
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    // Refresh para recarregar dados
    router.refresh()
  }

  return { gymId, selectGym }
}

/**
 * Hook para fazer fetch de dados com filtro de academia
 */
export function useGymData<T>(endpoint: string) {
  const { gymId } = useGymFilter()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const url = gymId ? `${endpoint}?gymId=${gymId}` : endpoint
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${endpoint}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint, gymId])

  return { data, loading, error, gymId }
}
