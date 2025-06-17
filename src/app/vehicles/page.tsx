'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesService } from '@/services/vehicles.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import VehicleModal from '@/components/vehicles/VehicleModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { Vehicle } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'

export default function VehiclesPage() {
  const { isChief } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    type_id: '',
    status: ''
  })

  const debouncedSearch = useDebounce(search, 500)

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', currentPage, debouncedSearch, filters],
    queryFn: () => vehiclesService.getVehicles({ 
      page: currentPage, 
      search: debouncedSearch,
      ...filters,
      per_page: 10 
    }),
    keepPreviousData: true
  })

  const { data: vehicleTypes } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: vehiclesService.getVehicleTypes
  })

  const deleteMutation = useMutation({
    mutationFn: vehiclesService.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Véhicule supprimé avec succès')
      setVehicleToDelete(null)
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    }
  })

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedVehicle(null)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (vehicleToDelete) {
      deleteMutation.mutate(vehicleToDelete.id)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      out_of_service: 'bg-red-100 text-red-800'
    }
    const statusLabels = {
      active: 'Actif',
      maintenance: 'En maintenance',
      out_of_service: 'Hors service'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    )
  }
if (isLoading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Véhicules</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestion du parc automobile - {data?.total || 0} véhicule(s)
            </p>
          </div>
          {isChief() && (
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Ajouter un véhicule
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-gray-500"
                  placeholder="Rechercher par immatriculation, marque ou modèle..."
                />
              </div>
            </div>
            
            <div>
              <select
                value={filters.type_id}
                onChange={(e) => setFilters({ ...filters, type_id: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-500"
              >
                <option value="">Tous les types</option>
                {vehicleTypes?.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="maintenance">En maintenance</option>
                <option value="out_of_service">Hors service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-6">
              <LoadingSpinner />
            </div>
          ) : data?.data.length === 0 ? (
            <EmptyState
              title="Aucun véhicule trouvé"
              description="Aucun véhicule ne correspond à vos critères de recherche"
              action={isChief() ? {
                label: "Ajouter un véhicule",
                onClick: handleAdd
              } : undefined}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernière maintenance
                      </th>
                      {isChief() && (
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.registration_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.vehicle_type?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(vehicle.status)}
                            {vehicle.under_warranty && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Garantie
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.last_maintenance ? (
                            <div>
                              <div>{vehicle.last_maintenance.maintenance_type?.name}</div>
                              <div className="text-xs">
                                {new Date(vehicle.last_maintenance.operation_date).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Aucune</span>
                          )}
                        </td>
                        {isChief() && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(vehicle)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setVehicleToDelete(vehicle)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.last_page > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === data.last_page}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de{' '}
                        <span className="font-medium">{(currentPage - 1) * data.per_page + 1}</span> à{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * data.per_page, data.total)}
                        </span>{' '}
                        sur <span className="font-medium">{data.total}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Précédent</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {/* Page numbers */}
                        {[...Array(Math.min(5, data.last_page))].map((_, i) => {
                          const pageNumber = i + 1
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNumber
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === data.last_page}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Suivant</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <VehicleModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le véhicule"
        message={`Êtes-vous sûr de vouloir supprimer le véhicule ${vehicleToDelete?.registration_number} ? Cette action est irréversible.`}
        type="danger"
        confirmLabel="Supprimer"
      />
    </DashboardLayout>
  )
}