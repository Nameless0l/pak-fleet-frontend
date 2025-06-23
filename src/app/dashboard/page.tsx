'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import ForecastCompactWidget from '@/components/dashboard/ForecastCompactWidget';
import { 
  TruckIcon, 
  WrenchScrewdriverIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon 
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
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

  // Fonction pour préparer les données du graphique en secteurs
  const preparePieData = (data) => {
    if (!data || !Array.isArray(data)) return []
    
    return data
      .filter(item => parseFloat(item.total_cost) > 0) // Filtrer les valeurs nulles ou zéro
      .map(item => ({
        ...item,
        name: item.category || 'Catégorie inconnue', // Assurer qu'il y a un nom
        value: parseFloat(item.total_cost)// Recharts utilise 'value' par défaut
      }))
  }

  const pieData = preparePieData(dashboard?.costs_by_category)

  // Fonction de rendu personnalisée pour les labels
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null // Ne pas afficher les labels pour les petites portions (<5%)
    
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble du parc automobile et des opérations de maintenance
        </p>
      </div>

      {/* Stats cards */}
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
        {/* Graphique de tendance */}
        <div className="lg:col-span-2">
          <ForecastCompactWidget />
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly costs chart */}
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

        {/* Costs by category - Version améliorée */}
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
            <div>
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `Catégorie: ${label}`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Costs by vehicle type - Line chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Coûts par type de véhicule
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre d'opérations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coût total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coût moyen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.costs_by_vehicle_type?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.vehicle_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.operations_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.total_cost / item.operations_count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming maintenance */}
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
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {vehicle.registration_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Maintenance requise
                    </span>
                  </div>
                ))}
                {dashboard?.upcoming_maintenance?.length > 5 && (
                  <a href="/maintenance" className="text-sm text-blue-600 hover:text-blue-500">
                    Voir toutes les maintenances ({dashboard.upcoming_maintenance.length})
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
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
                      <p className="text-sm font-medium text-gray-900">
                        {part.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {part.quantity_in_stock} / Min: {part.minimum_stock}
                      </p>
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
  )
}