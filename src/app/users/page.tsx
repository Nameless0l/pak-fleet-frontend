'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  PlusIcon, 
  PencilIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import UserModal from '@/components/users/UserModal'
import toast from 'react-hot-toast'
import { User } from '@/types'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['users', currentPage, search],
    queryFn: () => usersService.getUsers({ 
      page: currentPage, 
      search,
      per_page: 15 
    })
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      usersService.updateUser(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Statut mis à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    }
  })

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate({ id: user.id, isActive: user.is_active })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Utilisateurs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestion des techniciens et chefs de service
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Ajouter un utilisateur
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-lg">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-gray-500"
              placeholder="Rechercher par nom ou email..."
            />
          </div>
        </div>

        {/* Users list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {isLoading ? (
              <li className="px-6 py-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </li>
            ) : data?.data.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                Aucun utilisateur trouvé
              </li>
            ) : (
              data?.data.map((user) => (
                <li key={user.id}>
                  <div className="px-6 py-4 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email}
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'chief' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'chief' ? 'Chef de Service' : 'Technicien'}
                            </span>
                            {user.employee_id && (
                              <span className="text-xs text-gray-500">
                                ID: {user.employee_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-4">
                          <div className="flex items-center">
                            {user.is_active ? (
                              <span className="flex items-center text-sm text-green-600">
                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                Actif
                              </span>
                            ) : (
                              <span className="flex items-center text-sm text-red-600">
                                <XCircleIcon className="h-5 w-5 mr-1" />
                                Inactif
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`text-sm ${
                                user.is_active 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === data.last_page}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </DashboardLayout>
  )
}