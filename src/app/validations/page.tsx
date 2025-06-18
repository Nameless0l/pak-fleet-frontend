'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import ValidationModal from '@/components/validations/ValidationModal'
import { MaintenanceOperation } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ValidationsPage() {
  const queryClient = useQueryClient()
  const [selectedOperation, setSelectedOperation] = useState<MaintenanceOperation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [validationAction, setValidationAction] = useState<'validate' | 'reject' | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['pending-validations', currentPage],
    queryFn: () => maintenanceService.getPendingValidations({ page: currentPage })
  })

  const handleValidation = (operation: MaintenanceOperation, action: 'validate' | 'reject') => {
    setSelectedOperation(operation)
    setValidationAction(action)
    setIsModalOpen(true)
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

  if (isLoading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Validations en attente</h1>
            <p className="mt-1 text-sm text-gray-500">
              Opérations de maintenance à valider
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {data?.total || 0} opération(s) en attente
              </span>
            </div>
          </div>
        </div>

        {/* Liste des opérations */}
        {data?.data.length === 0 ? (
          <EmptyState
            title="Aucune validation en attente"
            description="Toutes les opérations ont été validées"
          />
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.data.map((operation) => (
                <li key={operation.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">
                            {operation.vehicle?.registration_number} - {operation.maintenance_type?.name}
                          </h3>
                          <div className="ml-2 flex items-center space-x-2">
                            {getCategoryBadge(operation.maintenance_type?.category || '')}
                            <span className="text-sm text-gray-500">
                              {format(new Date(operation.operation_date), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Véhicule: {operation.vehicle?.brand} {operation.vehicle?.model}</p>
                          <p>Technicien: {operation.technician?.name}</p>
                          <p className="font-medium">
                            Coût total: {new Intl.NumberFormat('fr-CM', { 
                              style: 'currency', 
                              currency: 'XAF' 
                            }).format(operation.total_cost)}
                          </p>
                        </div>

                        {operation.description && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">{operation.description}</p>
                          </div>
                        )}

                        {/* Pièces utilisées */}
                        {operation.spare_part_usages && operation.spare_part_usages.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-700">Pièces utilisées:</h4>
                            <ul className="mt-1 space-y-1">
                              {operation.spare_part_usages.map((usage) => (
                                <li key={usage.id} className="text-sm text-gray-600">
                                  • {usage.spare_part?.name} - Quantité: {usage.quantity_used} - 
                                  Total: {new Intl.NumberFormat('fr-CM', { 
                                    style: 'currency', 
                                    currency: 'XAF' 
                                  }).format(usage.total_price)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Détails des coûts */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-700">Main d'œuvre:</span>
                              <p className="font-medium text-gray-800">
                                {new Intl.NumberFormat('fr-CM', { 
                                  style: 'currency', 
                                  currency: 'XAF' 
                                }).format(operation.labor_cost)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-700">Pièces:</span>
                              <p className="font-medium text-gray-800">
                                {new Intl.NumberFormat('fr-CM', { 
                                  style: 'currency', 
                                  currency: 'XAF' 
                                }).format(operation.parts_cost)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-700">Total:</span>
                              <p className="font-semibold text-gray-900">
                                {new Intl.NumberFormat('fr-CM', { 
                                  style: 'currency', 
                                  currency: 'XAF' 
                                }).format(operation.total_cost)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleValidation(operation, 'validate')}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircleIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Valider
                        </button>
                        <button
                          onClick={() => handleValidation(operation, 'reject')}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircleIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

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

      {/* Modal de validation */}
      {isModalOpen && selectedOperation && validationAction && (
        <ValidationModal
          operation={selectedOperation}
          action={validationAction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOperation(null)
            setValidationAction(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
