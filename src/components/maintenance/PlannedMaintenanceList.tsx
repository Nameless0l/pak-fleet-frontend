'use client'

import { useQuery } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PlannedMaintenanceListProps {
  onNewOperation: (vehicleId: number) => void
}

export default function PlannedMaintenanceList({ onNewOperation }: PlannedMaintenanceListProps) {
  const { data: plannedOperations, isLoading } = useQuery({
    queryKey: ['planned-operations'],
    queryFn: maintenanceService.getPlannedOperations
  })

  if (isLoading) return <LoadingSpinner />

  if (!plannedOperations || plannedOperations.length === 0) {
    return (
      <EmptyState
        title="Aucune maintenance planifiée"
        description="Toutes les maintenances sont à jour"
      />
    )
  }

  const getUrgencyBadge = (nextDate: string) => {
    const daysUntil = differenceInDays(new Date(nextDate), new Date())
    
    if (daysUntil < 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        En retard
      </span>
    } else if (daysUntil <= 7) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Cette semaine
      </span>
    } else if (daysUntil <= 30) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Ce mois-ci
      </span>
    }
    return null
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {plannedOperations.map((item: any) => (
          <li key={item.vehicle.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.vehicle.registration_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.vehicle.brand} {item.vehicle.model}
                      </p>
                    </div>
                    <div className="ml-2 flex items-center space-x-2">
                      {getUrgencyBadge(item.next_maintenance_date)}
                      <p className="text-sm text-gray-500">
                        Prochaine maintenance: {format(new Date(item.next_maintenance_date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Opérations à effectuer:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.maintenance_types.map((type: any) => (
                        <span
                          key={type.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => onNewOperation(item.vehicle.id)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Effectuer maintenance
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}