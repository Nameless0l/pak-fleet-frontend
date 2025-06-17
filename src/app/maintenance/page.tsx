'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import MaintenanceOperationModal from '@/components/maintenance/MaintenanceOperationModal'
import PlannedMaintenanceList from '@/components/maintenance/PlannedMaintenanceList'
import MaintenanceHistoryList from '@/components/maintenance/MaintenanceHistoryList'

export default function MaintenancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'planned' | 'history'>('planned')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)

  const handleNewOperation = (vehicleId?: number) => {
    setSelectedVehicleId(vehicleId || null)
    setIsModalOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestion des opérations de maintenance
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => handleNewOperation()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nouvelle opération
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('planned')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'planned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="inline-block w-5 h-5 mr-2" />
              Maintenances planifiées
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="inline-block w-5 h-5 mr-2" />
              Historique
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'planned' ? (
          <PlannedMaintenanceList onNewOperation={handleNewOperation} />
        ) : (
          <MaintenanceHistoryList />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <MaintenanceOperationModal
          vehicleId={selectedVehicleId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </DashboardLayout>
  )
}
