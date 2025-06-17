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
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel')
  const [isExporting, setIsExporting] = useState(false)

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard-report', selectedYear],
    queryFn: () => dashboardService.getDashboard(selectedYear)
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (exportFormat === 'pdf') {
        generatePDF()
      } else if (exportFormat === 'excel') {
        generateExcel()
      } else {
        generateCSV()
      }
      toast.success(`Rapport exporté en ${exportFormat.toUpperCase()}`)
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Titre
    doc.setFontSize(20)
    doc.text('Rapport de Maintenance - Parc Automobile', 14, 22)
    doc.setFontSize(12)
    doc.text(`Année ${selectedYear}`, 14, 30)
    doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 14, 36)

    // Statistiques générales
    doc.setFontSize(16)
    doc.text('Statistiques Générales', 14, 50)
    doc.setFontSize(10)
    doc.text(`Nombre total de véhicules: ${dashboard?.stats.total_vehicles}`, 14, 58)
    doc.text(`Véhicules actifs: ${dashboard?.stats.active_vehicles}`, 14, 64)
    doc.text(`Coût total annuel: ${new Intl.NumberFormat('fr-CM', { 
      style: 'currency', 
      currency: 'XAF' 
    }).format(dashboard?.monthly_costs.reduce((sum, m) => sum + m.total_cost, 0) || 0)}`, 14, 70)

    // Tableau des coûts mensuels
    doc.setFontSize(16)
    doc.text('Coûts Mensuels', 14, 86)
    
    const monthlyData = dashboard?.monthly_costs.map(m => [
      m.month,
      m.operations_count.toString(),
      new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(m.total_cost)
    ]) || []

    doc.autoTable({
      startY: 92,
      head: [['Mois', 'Nombre d\'opérations', 'Coût total']],
      body: monthlyData,
    })

    // Tableau des coûts par catégorie
    const finalY = (doc as any).lastAutoTable.finalY || 92
    doc.setFontSize(16)
    doc.text('Coûts par Catégorie', 14, finalY + 16)

    const categoryData = dashboard?.costs_by_category.map(c => [
      c.category === 'preventive' ? 'Préventive' : c.category === 'corrective' ? 'Corrective' : 'Améliorative',
      c.operations_count.toString(),
      new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(c.total_cost)
    ]) || []

    doc.autoTable({
      startY: finalY + 22,
      head: [['Catégorie', 'Nombre d\'opérations', 'Coût total']],
      body: categoryData,
    })

    // Sauvegarder
    doc.save(`rapport-maintenance-${selectedYear}.pdf`)
  }

  const generateExcel = () => {
    const wb = XLSX.utils.book_new()

    // Feuille de statistiques générales
    const statsData = [
      ['Rapport de Maintenance - Parc Automobile'],
      [`Année: ${selectedYear}`],
      [`Date de génération: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`],
      [],
      ['Statistiques Générales'],
      ['Indicateur', 'Valeur'],
      ['Nombre total de véhicules', dashboard?.stats.total_vehicles || 0],
      ['Véhicules actifs', dashboard?.stats.active_vehicles || 0],
      ['Coût total annuel', dashboard?.monthly_costs.reduce((sum, m) => sum + m.total_cost, 0) || 0]
    ]
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistiques')

    // Feuille des coûts mensuels
    const monthlyData = [
      ['Coûts Mensuels'],
      ['Mois', 'Nombre d\'opérations', 'Coût total'],
      ...(dashboard?.monthly_costs.map(m => [
        m.month,
        m.operations_count,
        m.total_cost
      ]) || [])
    ]
    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Coûts Mensuels')

    // Feuille des coûts par catégorie
    const categoryData = [
      ['Coûts par Catégorie'],
      ['Catégorie', 'Nombre d\'opérations', 'Coût total'],
      ...(dashboard?.costs_by_category.map(c => [
        c.category === 'preventive' ? 'Préventive' : c.category === 'corrective' ? 'Corrective' : 'Améliorative',
        c.operations_count,
        c.total_cost
      ]) || [])
    ]
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Coûts par Catégorie')

    // Feuille des coûts par type de véhicule
    const vehicleTypeData = [
      ['Coûts par Type de Véhicule'],
      ['Type', 'Nombre d\'opérations', 'Coût total'],
      ...(dashboard?.costs_by_vehicle_type.map(v => [
        v.vehicle_type,
        v.operations_count,
        v.total_cost
      ]) || [])
    ]
    const vehicleTypeSheet = XLSX.utils.aoa_to_sheet(vehicleTypeData)
    XLSX.utils.book_append_sheet(wb, vehicleTypeSheet, 'Coûts par Type')

    // Sauvegarder
    XLSX.writeFile(wb, `rapport-maintenance-${selectedYear}.xlsx`)
  }

  const generateCSV = () => {
    const headers = ['Mois', 'Nombre d\'opérations', 'Coût total']
    const rows = dashboard?.monthly_costs.map(m => [
      m.month,
      m.operations_count,
      m.total_cost
    ]) || []

    let csvContent = headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport-maintenance-${selectedYear}.csv`
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Rapports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Génération et export de rapports
            </p>
          </div>
        </div>

        {/* Sélection de l'année */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Paramètres du rapport</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Année
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-500"
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
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Format d'export
              </label>
              <select
                id="format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-500"
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
            {/* Résumé */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé annuel {selectedYear}</h3>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Coût total</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {new Intl.NumberFormat('fr-CM', { 
                      style: 'currency', 
                      currency: 'XAF',
                      maximumFractionDigits: 0
                    }).format(dashboard?.monthly_costs.reduce((sum, m) => sum + m.total_cost, 0) || 0)}
                  </dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Opérations totales</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {dashboard?.monthly_costs.reduce((sum, m) => sum + m.operations_count, 0) || 0}
                  </dd>
                </div>
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Coût moyen par opération</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {new Intl.NumberFormat('fr-CM', { 
                      style: 'currency', 
                      currency: 'XAF',
                      maximumFractionDigits: 0
                    }).format(
                      (dashboard?.monthly_costs.reduce((sum, m) => sum + m.total_cost, 0) || 0) /
                      (dashboard?.monthly_costs.reduce((sum, m) => sum + m.operations_count, 0) || 1)
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tableau des coûts mensuels */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Détail mensuel
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mois
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opérations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coût total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboard?.monthly_costs.map((month) => (
                      <tr key={month.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {month.operations_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('fr-CM', { 
                            style: 'currency', 
                            currency: 'XAF' 
                          }).format(month.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}