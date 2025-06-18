'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { reportsService } from '@/services/reports.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel')
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'costs' | 'vehicles' | 'spare_parts'>('summary')
  const [isExporting, setIsExporting] = useState(false)

  // Récupérer les données du rapport annuel
  const { data: annualReport, isLoading } = useQuery({
    queryKey: ['annual-report', selectedYear],
    queryFn: () => reportsService.getAnnualSummary(selectedYear)
  })

  // Calculer les variations par rapport à l'année précédente
  const { data: previousYearReport } = useQuery({
    queryKey: ['annual-report', selectedYear - 1],
    queryFn: () => reportsService.getAnnualSummary(selectedYear - 1),
    enabled: selectedYear > 2020
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await reportsService.exportReport(exportFormat, {
        year: selectedYear,
        type: reportType
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${reportType}-${selectedYear}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Rapport exporté en ${exportFormat.toUpperCase()}`)
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CM', { 
      style: 'currency', 
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const calculateVariation = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getVariationColor = (variation: number) => {
    return variation >= 0 ? 'text-red-600' : 'text-green-600'
  }

  const getVariationIcon = (variation: number) => {
    return variation >= 0 ? (
      <ArrowTrendingUpIcon className="h-4 w-4 text-red-600" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4 text-green-600" />
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Rapports</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Génération et analyse des rapports de maintenance
            </p>
          </div>
        </div>

        {/* Paramètres du rapport */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Paramètres du rapport</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Année
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:text-sm"
              >
                {[...Array(5)].map((_, i) => {
                  const year = currentYear - i
                  return (
                    <option key={year} value={year}>{year}</option>
                  )
                })}
              </select>
            </div>

            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type de rapport
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:text-sm"
              >
                <option value="summary">Résumé</option>
                <option value="detailed">Détaillé</option>
                <option value="costs">Analyse des coûts</option>
                <option value="vehicles">Par véhicule</option>
                <option value="spare_parts">Pièces détachées</option>
              </select>
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Format d'export
              </label>
              <select
                id="format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:text-sm"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={isLoading || isExporting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                {isExporting ? 'Export en cours...' : 'Exporter'}
              </button>
            </div>
          </div>
        </div>

        {/* Aperçu des données */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs avec variations */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Coût total annuel
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(annualReport?.stats.total_cost || 0)}
                          </div>
                          {previousYearReport && (
                            <div className="ml-2 flex items-baseline text-sm">
                              {getVariationIcon(calculateVariation(
                                annualReport?.stats.total_cost || 0,
                                previousYearReport.stats.total_cost
                              ))}
                              <span className={`ml-1 ${getVariationColor(calculateVariation(
                                annualReport?.stats.total_cost || 0,
                                previousYearReport.stats.total_cost
                              ))}`}>
                                {Math.abs(calculateVariation(
                                  annualReport?.stats.total_cost || 0,
                                  previousYearReport.stats.total_cost
                                )).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Opérations totales
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {annualReport?.stats.total_operations || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Coût moyen/opération
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualReport?.stats.average_cost_per_operation || 0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TruckIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Véhicules actifs
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {annualReport?.stats.active_vehicles || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Évolution mensuelle */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Évolution mensuelle des coûts
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={annualReport?.monthly_costs}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_cost" 
                      stroke="#3B82F6" 
                      name="Coût total"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="labor_cost" 
                      stroke="#10B981" 
                      name="Main d'œuvre"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="parts_cost" 
                      stroke="#F59E0B" 
                      name="Pièces"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Répartition par catégorie */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Répartition par catégorie
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={annualReport?.costs_by_category}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total_cost"
                    >
                      {annualReport?.costs_by_category.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 véhicules par coût */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Top 10 véhicules par coût de maintenance
                </h3>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Opérations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Coût total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Coût moyen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {annualReport?.top_vehicles_by_cost?.map((vehicle: any) => (
                      <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.registration_number}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.brand} {vehicle.model}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vehicle.operations_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(vehicle.total_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(vehicle.total_cost / vehicle.operations_count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consommation de pièces détachées */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Top 10 pièces détachées consommées
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={annualReport?.spare_parts_consumption?.slice(0, 10)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="total_value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}