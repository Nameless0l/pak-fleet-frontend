'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { FunnelIcon } from '@heroicons/react/24/outline'

export default function MaintenanceHistoryList() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    status: '',
    vehicle_id: '',
    date_from: '',
    date_to: ''
  })
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-operations', currentPage, filters],
    queryFn: () => maintenanceService.getOperations({
      page: currentPage,
      ...filters
    })
  })

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const statusLabels = {
      pending: 'En attente',
      validated: 'Validée',
      rejected: 'Rejetée'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    )
  }

  const getCategoryBadge = (category: string) => {
    const categoryStyles = {
      preventive: 'bg-blue-100 text-blue-800',
      corrective: 'bg-orange-100 text-orange-800',
      ameliorative: 'bg-purple-100 text-purple-800'
    }
    const categoryLabels = {
      preventive: 'Préventive',
      corrective: 'Corrective',
      ameliorative: 'Améliorative'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category as keyof typeof categoryStyles]}`}>
        {categoryLabels[category as keyof typeof categoryLabels]}
      </span>
    )
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="validated">Validée</option>
              <option value="rejected">Rejetée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date début</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date fin</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {data?.data.length === 0 ? (
          <EmptyState title="Aucune opération trouvée" />
        ) : (
          <ul className="divide-y divide-gray-200">
            {data?.data.map((operation) => (
              <li key={operation.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {operation.vehicle?.registration_number} - {operation.maintenance_type?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {operation.vehicle?.brand} {operation.vehicle?.model}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center space-x-2">
                          {getCategoryBadge(operation.maintenance_type?.category || '')}
                          {getStatusBadge(operation.status)}
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-6">
                          <p className="flex items-center text-sm text-gray-500">
                            Date: {format(new Date(operation.operation_date), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            Technicien: {operation.technician?.name}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            Coût total: {new Intl.NumberFormat('fr-CM', { 
                              style: 'currency', 
                              currency: 'XAF' 
                            }).format(operation.total_cost)}
                          </p>
                        </div>
                      </div>
                      
                      {operation.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{operation.description}</p>
                        </div>
                      )}
                      
                      {operation.validation_comment && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Commentaire de validation:</span> {operation.validation_comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
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
  )
}