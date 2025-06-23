'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { vehiclesService } from '@/services/vehicles.service'
import { maintenanceService } from '@/services/maintenance.service'
import ForecastCompactWidget from '@/components/dashboard/ForecastCompactWidget';
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  TruckIcon, 
  WrenchScrewdriverIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DashboardPage() {
  const router = useRouter()
  const [searchVehicleId, setSearchVehicleId] = useState('')

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard()
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-list-for-dashboard-search'],
    queryFn: () => vehiclesService.getVehicles({ per_page: 1000 })
  })

  const { data: historyPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['maintenance-history-preview', searchVehicleId],
    queryFn: () => maintenanceService.getOperations({
      vehicle_id: searchVehicleId,
      per_page: 3,
      page: 1
    }),
    enabled: !!searchVehicleId,
  })

  useEffect(() => {
    if (!searchVehicleId && dashboard?.upcoming_maintenance && dashboard.upcoming_maintenance.length > 0) {
      setSearchVehicleId(dashboard.upcoming_maintenance[0].id.toString())
    }
  }, [dashboard, searchVehicleId])

  if (isLoadingDashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CM', { 
      style: 'currency', 
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleSearchHistory = () => {
    if (searchVehicleId) {
      router.push(`/maintenance?tab=history&vehicleId=${searchVehicleId}`)
    }
  }

  const preparePieData = (data: any) => {
    if (!data || !Array.isArray(data)) return []
    
    return data
      .filter(item => parseFloat(item.total_cost) > 0)
      .map(item => ({
        ...item,
        name: item.category || 'Catégorie inconnue',
        value: parseFloat(item.total_cost)
      }))
  }

  const pieData = preparePieData(dashboard?.costs_by_category)

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble du parc automobile et des opérations de maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Véhicules actifs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {dashboard?.stats.active_vehicles}
                    </div>
                    <div className="ml-2 text-sm text-gray-600">
                      / {dashboard?.stats.total_vehicles}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/vehicles" className="font-medium text-blue-600 hover:text-blue-500">
                Voir tous les véhicules
              </a>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Opérations ce mois
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {dashboard?.stats.total_operations_this_month}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/maintenance" className="font-medium text-blue-600 hover:text-blue-500">
                Voir les opérations
              </a>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Coût mensuel
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(dashboard?.stats.total_cost_this_month || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/reports" className="font-medium text-blue-600 hover:text-blue-500">
                Voir les rapports
              </a>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En attente
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {dashboard?.stats.pending_validations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="/validations" className="font-medium text-red-600 hover:text-red-500">
                Valider maintenant
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="">
        <ForecastCompactWidget />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Évolution mensuelle des coûts
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard?.monthly_costs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Bar dataKey="total_cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Répartition par catégorie
          </h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <p className="text-lg">Aucune donnée disponible</p>
                <p className="text-sm">Les coûts par catégorie n'ont pas encore été enregistrés</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Historique d'un véhicule
            </h3>
            <div className="space-y-4">
              <select
                value={searchVehicleId}
                onChange={(e) => setSearchVehicleId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
              >
                <option value="">-- Sélectionnez un véhicule --</option>
                {vehiclesData?.data.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} ({v.brand} {v.model})
                  </option>
                ))}
              </select>

              <div className="mt-4 flex-grow min-h-[150px]">
                {isLoadingPreview && (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                )}
                
                {!isLoadingPreview && historyPreview?.data && historyPreview.data.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Dernières interventions :</h4>
                    <ul className="divide-y divide-gray-200">
                      {historyPreview.data.map((op: any) => (
                        <li key={op.id} className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{op.maintenance_type.name}</p>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400"/>
                                {format(new Date(op.operation_date), 'd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatCurrency(op.total_cost)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {!isLoadingPreview && searchVehicleId && (!historyPreview?.data || historyPreview.data.length === 0) && (
                  <div className="flex items-center justify-center h-full text-center text-gray-500">
                    <div>
                      <p>Aucune intervention récente</p>
                      <p className="text-xs">pour ce véhicule.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={handleSearchHistory}
                disabled={!searchVehicleId}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Voir l'historique complet
              </button>
            </div>
          </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Coûts par type de véhicule
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opérations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût moyen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard?.costs_by_vehicle_type?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vehicle_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.operations_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total_cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.total_cost / (item.operations_count || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Maintenances à venir
            </h3>
            {dashboard?.upcoming_maintenance?.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune maintenance planifiée</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.upcoming_maintenance?.slice(0, 5).map((vehicle: any) => (
                  <div 
                    key={vehicle.id} 
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => router.push(`/maintenance?tab=planned`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vehicle.registration_number}</p>
                      <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Maintenance requise
                    </span>
                  </div>
                ))}
                {dashboard?.upcoming_maintenance?.length > 5 && (
                  <a href="/maintenance?tab=planned" className="text-sm text-blue-600 hover:text-blue-500">
                    Voir toutes les maintenances ({dashboard.upcoming_maintenance.length})
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Alertes de stock
            </h3>
            {dashboard?.low_stock_alerts?.length === 0 ? (
              <p className="text-sm text-gray-500">Tous les stocks sont suffisants</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.low_stock_alerts?.slice(0, 5).map((part: any) => (
                  <div key={part.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{part.name}</p>
                      <p className="text-sm text-gray-500">Stock: {part.quantity_in_stock} / Min: {part.minimum_stock}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Stock faible
                    </span>
                  </div>
                ))}
                {dashboard?.low_stock_alerts?.length > 5 && (
                  <a href="/spare-parts?low_stock=true" className="text-sm text-blue-600 hover:text-blue-500">
                    Voir toutes les alertes ({dashboard.low_stock_alerts.length})
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}