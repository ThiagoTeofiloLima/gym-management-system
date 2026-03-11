'use client'

import { useEffect, useState } from 'react'

interface Gym {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  isActive: boolean
  plan: string
  createdAt: string
  _count: {
    users: number
    members: number
    trainers: number
    workouts: number
    expenses: number
  }
}

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newGym, setNewGym] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    city: '',
    state: '',
  })

  useEffect(() => {
    fetchGyms()
  }, [])

  async function fetchGyms() {
    try {
      const res = await fetch('/api/gyms')
      if (res.ok) {
        const data = await res.json()
        setGyms(data)
      }
    } catch (error) {
      console.error('Erro ao buscar academias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGym(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/gyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGym),
      })
      if (res.ok) {
        setNewGym({ name: '', cnpj: '', email: '', phone: '', city: '', state: '' })
        setShowForm(false)
        fetchGyms()
      }
    } catch (error) {
      console.error('Erro ao criar academia:', error)
    }
  }

  async function toggleGymStatus(gymId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        fetchGyms()
      }
    } catch (error) {
      console.error('Erro ao atualizar academia:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando academias...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🏋️ Academias</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancelar' : 'Nova Academia'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateGym} className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Nova Academia</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome *"
              value={newGym.name}
              onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="CNPJ"
              value={newGym.cnpj}
              onChange={(e) => setNewGym({ ...newGym, cnpj: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={newGym.email}
              onChange={(e) => setNewGym({ ...newGym, email: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={newGym.phone}
              onChange={(e) => setNewGym({ ...newGym, phone: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Cidade"
              value={newGym.city}
              onChange={(e) => setNewGym({ ...newGym, city: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Estado"
              value={newGym.state}
              onChange={(e) => setNewGym({ ...newGym, state: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Criar Academia
          </button>
        </form>
      )}

      <div className="grid gap-6">
        {gyms.map((gym) => (
          <div
            key={gym.id}
            className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
              gym.isActive ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{gym.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{gym.cnpj || 'Sem CNPJ'}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  {gym.email && <span>📧 {gym.email}</span>}
                  {gym.phone && <span>📱 {gym.phone}</span>}
                  {gym.city && <span>📍 {gym.city} - {gym.state}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  gym.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {gym.isActive ? 'Ativa' : 'Inativa'}
                </span>
                <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-sm capitalize">
                  {gym.plan}
                </span>
                <button
                  onClick={() => toggleGymStatus(gym.id, gym.isActive)}
                  className="text-gray-400 hover:text-white"
                  title={gym.isActive ? 'Desativar' : 'Ativar'}
                >
                  {gym.isActive ? '🔓' : '🔒'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{gym._count.users}</div>
                <div className="text-sm text-gray-400">Usuários</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{gym._count.members}</div>
                <div className="text-sm text-gray-400">Membros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{gym._count.trainers}</div>
                <div className="text-sm text-gray-400">Treinadores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{gym._count.workouts}</div>
                <div className="text-sm text-gray-400">Treinos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{gym._count.expenses}</div>
                <div className="text-sm text-gray-400">Despesas</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`/app/gyms/${gym.id}/members`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Ver Membros →
              </a>
              <a
                href={`/app/gyms/${gym.id}/trainers`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Ver Treinadores →
              </a>
            </div>
          </div>
        ))}
      </div>

      {gyms.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          Nenhuma academia cadastrada
        </div>
      )}
    </div>
  )
}
