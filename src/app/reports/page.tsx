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

  // Fonction améliorée pour formater l'axe Y
  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }
  const getMaxY = (data) => {
  if (!data) return 0;
  let max = 0;
  data.forEach((month) => {
    max = Math.max(
      max,
      month.total_cost || 0,
      month.labor_cost || 0,
      month.parts_cost || 0
    );
  });
  return Math.ceil(max * 1.1); // +10%
};

  // Fonction pour formater les montants dans le PDF (sans caractères spéciaux)
    const formatCurrencyForPDF = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
    }

  // Export Excel amélioré
  const exportToExcel = async () => {
    if (!annualReport) return

    const workbook = XLSX.utils.book_new()

    // Feuille 1: Résumé
    const summaryData = [
      ['Rapport de Maintenance - Année ' + selectedYear],
      [''],
      ['RÉSUMÉ GÉNÉRAL'],
      ['Coût total annuel', formatCurrency(annualReport.stats.total_cost || 0)],
      ['Nombre d\'opérations', annualReport.stats.total_operations || 0],
      ['Coût moyen par opération', formatCurrency(calculateAverageCost())],
      ['Véhicules actifs', annualReport.stats.active_vehicles || 0],
      [''],
      ['ÉVOLUTION MENSUELLE'],
      ['Mois', 'Coût Total', 'Main d\'œuvre', 'Pièces']
    ]

    if (annualReport.monthly_costs) {
      annualReport.monthly_costs.forEach((month: any) => {
        summaryData.push([
          month.month,
          month.total_cost || 0,
          month.labor_cost || 0,
          month.parts_cost || 0
        ])
      })
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé')

    // Feuille 2: Top véhicules
    if (annualReport.top_vehicles_by_cost) {
      const vehiclesData = [
        ['TOP VÉHICULES PAR COÛT'],
        [''],
        ['N° Immatriculation', 'Marque', 'Modèle', 'Opérations', 'Coût Total', 'Coût Moyen']
      ]

      annualReport.top_vehicles_by_cost.forEach((vehicle: any) => {
        vehiclesData.push([
          vehicle.registration_number,
          vehicle.brand,
          vehicle.model,
          vehicle.operations_count,
          vehicle.total_cost,
          vehicle.total_cost / vehicle.operations_count
        ])
      })

      const vehiclesSheet = XLSX.utils.aoa_to_sheet(vehiclesData)
      XLSX.utils.book_append_sheet(workbook, vehiclesSheet, 'Top Véhicules')
    }

    // Feuille 3: Pièces détachées
    if (annualReport.spare_parts_consumption) {
      const partsData = [
        ['CONSOMMATION PIÈCES DÉTACHÉES'],
        [''],
        ['Pièce', 'Quantité', 'Valeur Totale']
      ]

      annualReport.spare_parts_consumption.forEach((part: any) => {
        partsData.push([
          part.name,
          part.quantity,
          part.total_value
        ])
      })

      const partsSheet = XLSX.utils.aoa_to_sheet(partsData)
      XLSX.utils.book_append_sheet(workbook, partsSheet, 'Pièces Détachées')
    }
    if (annualReport.forecast_next_year) {
  const forecastData = [
    [`PRÉVISION BUDGÉTAIRE ${annualReport.forecast_next_year.year}`],
    [''],
    ['Méthode de calcul', annualReport.forecast_next_year.calculation_method],
    [''],
    ['DÉTAILS DU CALCUL'],
    ['Véhicule de référence', annualReport.forecast_next_year.reference_vehicle?.registration_number || 'N/A'],
    ['Marque/Modèle', `${annualReport.forecast_next_year.reference_vehicle?.brand || ''} ${annualReport.forecast_next_year.reference_vehicle?.model || ''}`],
    ['Coût annuel du véhicule le plus élevé', formatCurrency(annualReport.forecast_next_year.highest_vehicle_cost)],
    ['Nombre de véhicules dans le parc', annualReport.forecast_next_year.vehicles_count],
    [''],
    ['BUDGET PRÉVISIONNEL', formatCurrency(annualReport.forecast_next_year.forecast_amount)],
    [''],
    ['Note: Cette prévision est basée sur le coût du véhicule ayant généré les dépenses les plus élevées multiplié par le nombre total de véhicules.']
  ]
  
  const forecastSheet = XLSX.utils.aoa_to_sheet(forecastData)
  XLSX.utils.book_append_sheet(workbook, forecastSheet, 'Prévision')
}
    // Sauvegarder le fichier
    XLSX.writeFile(workbook, `rapport-${reportType}-${selectedYear}.xlsx`)
  }
  
  // Export PDF amélioré et plus convivial
  const exportToPDF = async () => {
    if (!annualReport) return

    const doc = new jsPDF()
    
    // Couleurs
    const primaryColor = [59, 130, 246] // Bleu
    const secondaryColor = [107, 114, 128] // Gris
    const lightGray = [249, 250, 251]
    
    // En-tête avec fond coloré
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 40, 'F')
    
    // Titre principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text("RAPPORT DE MAINTENANCE", 20, 20)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Année ${selectedYear} • Type: ${reportType}`, 20, 30)
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 20, 36)

    let yPosition = 55

    // Section Résumé général
    doc.setTextColor(0, 0, 0)
    doc.setFillColor(...lightGray)
    doc.rect(15, yPosition - 5, 180, 8, 'F')
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('RÉSUMÉ GÉNÉRAL', 20, yPosition)
    yPosition += 15

    // Boîtes KPI avec bordures
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    
    const kpis = [
      {
        label: 'Coût total annuel',
        value: formatCurrencyForPDF(annualReport.stats.total_cost || 0),
        x: 20, y: yPosition
      },
      {
        label: 'Nombre d\'opérations',
        value: `${annualReport.stats.total_operations || 0} opérations`,
        x: 110, y: yPosition
      },
      {
        label: 'Coût moyen par opération',
        value: formatCurrencyForPDF(calculateAverageCost()),
        x: 20, y: yPosition + 25
      },
      {
        label: 'Véhicules actifs',
        value: `${annualReport.stats.active_vehicles || 0} véhicules`,
        x: 110, y: yPosition + 25
      }
    ]

    kpis.forEach((kpi) => {
      // Bordure de la boîte KPI
      doc.setDrawColor(...secondaryColor)
      doc.setLineWidth(0.5)
      doc.rect(kpi.x - 2, kpi.y - 10, 85, 20)
      
      // Label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...secondaryColor)
      doc.text(kpi.label, kpi.x, kpi.y - 5)
      
      // Valeur
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(kpi.value, kpi.x, kpi.y + 3)
    })

    yPosition += 50

    // Section Évolution mensuelle
    if (annualReport.monthly_costs && annualReport.monthly_costs.length > 0) {
      doc.setFillColor(...lightGray)
      doc.rect(15, yPosition - 5, 180, 8, 'F')
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('ÉVOLUTION MENSUELLE', 20, yPosition)
      yPosition += 15

      // En-têtes du tableau avec fond
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPosition - 8, 155, 12, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Mois', 25, yPosition - 2)
      doc.text('Coût Total', 55, yPosition - 2)
      doc.text('Main d\'œuvre', 95, yPosition - 2)
      doc.text('Pièces', 135, yPosition - 2)
      yPosition += 8

      // Données mensuelles avec alternance de couleurs
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      annualReport.monthly_costs.slice(0, 8).forEach((month: any, index: number) => {
        if (yPosition > 250) return
        
        // Fond alterné
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(20, yPosition - 5, 155, 8, 'F')
        }
        
        doc.setTextColor(0, 0, 0)
        doc.text(month.month || 'N/A', 25, yPosition)
        doc.text(formatCurrencyForPDF(month.total_cost || 0), 55, yPosition)
        doc.text(formatCurrencyForPDF(month.labor_cost || 0), 95, yPosition)
        doc.text(formatCurrencyForPDF(month.parts_cost || 0), 135, yPosition)
        yPosition += 8
      })
      
      yPosition += 10
    }

    // Nouvelle page si nécessaire
    if (yPosition > 200 && annualReport.top_vehicles_by_cost) {
      doc.addPage()
      yPosition = 25
    }

    // Section Top véhicules
    if (annualReport.top_vehicles_by_cost && annualReport.top_vehicles_by_cost.length > 0) {
      doc.setFillColor(...lightGray)
      doc.rect(15, yPosition - 5, 180, 8, 'F')
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('TOP 5 VÉHICULES PAR COÛT', 20, yPosition)
      yPosition += 15

      // En-têtes
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPosition - 8, 155, 12, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Immatriculation', 25, yPosition - 2)
      doc.text('Véhicule', 70, yPosition - 2)
      doc.text('Opér.', 120, yPosition - 2)
      doc.text('Coût Total', 140, yPosition - 2)
      yPosition += 8

      // Données véhicules
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      annualReport.top_vehicles_by_cost.slice(0, 5).forEach((vehicle: any, index: number) => {
        if (yPosition > 270) return
        
        // Fond alterné
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(20, yPosition - 5, 155, 8, 'F')
        }
        
        doc.setTextColor(0, 0, 0)
        doc.text(vehicle.registration_number || 'N/A', 25, yPosition)
        
        const vehicleName = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'N/A'
        doc.text(vehicleName.substring(0, 20), 70, yPosition)
        
        doc.text(vehicle.operations_count?.toString() || '0', 120, yPosition)
        doc.text(formatCurrencyForPDF(vehicle.total_cost || 0), 140, yPosition)
        yPosition += 8
      })
    }
    if (annualReport.forecast_next_year) {
  // Nouvelle page pour la prévision
  doc.addPage()
  yPosition = 25
  
  // Titre de la section
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`PRÉVISION BUDGÉTAIRE ${annualReport.forecast_next_year.year}`, 20, 25)
  
  yPosition = 60
  
  // Montant prévisionnel
  doc.setFillColor(...lightGray)
  doc.rect(15, yPosition - 10, 180, 40, 'F')
  
  doc.setTextColor(...primaryColor)
  doc.setFontSize(14)
  doc.text('Budget prévisionnel:', 20, yPosition)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrencyForPDF(annualReport.forecast_next_year.forecast_amount), 20, yPosition + 15)
  
  yPosition += 50
  doc.setFontSize(10)
}

    // Pied de page stylé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Ligne de séparation
      doc.setDrawColor(...secondaryColor)
      doc.setLineWidth(0.5)
      doc.line(20, 280, 190, 280)
      
      // Texte du pied de page
      doc.setFontSize(8)
      doc.setTextColor(...secondaryColor)
      doc.setFont('helvetica', 'normal')
      doc.text('Système de Gestion de Maintenance', 20, 285)
      doc.text(`Page ${i} sur ${pageCount}`, 170, 285)
    }

    doc.save(`rapport-maintenance-${reportType}-${selectedYear}.pdf`)
  }

  // Export CSV amélioré
  const exportToCSV = async () => {
    if (!annualReport) return

    let csvContent = `Rapport de Maintenance - Année ${selectedYear}\n\n`
    
    csvContent += 'RÉSUMÉ GÉNÉRAL\n'
    csvContent += `Coût total annuel,${annualReport.stats.total_cost || 0}\n`
    csvContent += `Nombre d'opérations,${annualReport.stats.total_operations || 0}\n`
    csvContent += `Coût moyen par opération,${calculateAverageCost()}\n`
    csvContent += `Véhicules actifs,${annualReport.stats.active_vehicles || 0}\n\n`

    if (annualReport.monthly_costs) {
      csvContent += 'ÉVOLUTION MENSUELLE\n'
      csvContent += 'Mois,Coût Total,Main d\'œuvre,Pièces\n'
      annualReport.monthly_costs.forEach((month: any) => {
        csvContent += `${month.month},${month.total_cost || 0},${month.labor_cost || 0},${month.parts_cost || 0}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-${reportType}-${selectedYear}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Fonction pour calculer le coût moyen correct
  const calculateAverageCost = () => {
    if (!annualReport?.stats.total_operations || annualReport.stats.total_operations === 0) {
      return 0
    }
    return (annualReport.stats.total_cost || 0) / annualReport.stats.total_operations
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      switch (exportFormat) {
        case 'excel':
          await exportToExcel()
          break
        case 'pdf':
          await exportToPDF()
          break
        case 'csv':
          await exportToCSV()
          break
        default:
          // Fallback vers le service original si disponible
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
      }
      
      toast.success(`Rapport exporté en ${exportFormat.toUpperCase()}`)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
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
                          {formatCurrency(calculateAverageCost())}
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
            {annualReport?.forecast_next_year && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg p-6 border border-blue-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Prévision budgétaire {annualReport.forecast_next_year.year}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Basée sur les données de {selectedYear}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget prévisionnel</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(annualReport.forecast_next_year.forecast_amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Pour l'année {annualReport.forecast_next_year.year}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Méthode de calcul</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(annualReport.forecast_next_year.highest_vehicle_cost)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      × {annualReport.forecast_next_year.vehicles_count} véhicules
                    </p>
                  </div>
                  
                  {annualReport.forecast_next_year.reference_vehicle && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Véhicule de référence</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {annualReport.forecast_next_year.reference_vehicle.registration_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {annualReport.forecast_next_year.reference_vehicle.brand} {annualReport.forecast_next_year.reference_vehicle.model}
                      </p>
                    </div>
                  )}
                </div>
                
              </div>
            )}
            {annualReport?.forecast_next_year && previousYearReport?.forecast_next_year && (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Prévision vs Réalisation
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={[
          {
            name: `Prévision ${selectedYear}`,
            value: previousYearReport.forecast_next_year?.forecast_amount || 0,
            type: 'forecast'
          },
          {
            name: `Réel ${selectedYear}`,
            value: annualReport.stats.total_cost || 0,
            type: 'actual'
          },
          {
            name: `Prévision ${selectedYear + 1}`,
            value: annualReport.forecast_next_year.forecast_amount,
            type: 'forecast'
          }
        ]}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatYAxisValue} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Bar dataKey="value">
          {data => data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.type === 'forecast' ? '#3B82F6' : '#10B981'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    {previousYearReport?.forecast_next_year && (
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Écart prévision/réel {selectedYear}: {' '}
          <span className={`font-semibold ${
            annualReport.stats.total_cost > previousYearReport.forecast_next_year.forecast_amount
              ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(annualReport.stats.total_cost - previousYearReport.forecast_next_year.forecast_amount))}
            {' '}({((annualReport.stats.total_cost - previousYearReport.forecast_next_year.forecast_amount) / previousYearReport.forecast_next_year.forecast_amount * 100).toFixed(1)}%)
          </span>
        </p>
      </div>
    )}
  </div>
)}
            {/* Graphiques */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Évolution mensuelle */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Évolution mensuelle des coûts
                </h3>
               <ResponsiveContainer width="100%" height={350}>
  <LineChart 
    data={annualReport?.monthly_costs}
    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis
      tickFormatter={formatYAxisValue}
      domain={[0, getMaxY(annualReport?.monthly_costs)]}
      padding={{ top: 0, bottom: 0 }}
    />
    <Tooltip 
      formatter={(value) => formatCurrency(value)}
      labelStyle={{ color: '#000' }}
    />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="total_cost" 
      stroke="#3B82F6" 
      name="Coût total"
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
    <Line 
      type="monotone" 
      dataKey="labor_cost" 
      stroke="#10B981" 
      name="Main d'œuvre"
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
    <Line 
      type="monotone" 
      dataKey="parts_cost" 
      stroke="#F59E0B" 
      name="Pièces"
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
              </div>

              {/* Répartition par catégorie */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Répartition par catégorie
                </h3>
                {annualReport?.costs_by_category && annualReport.costs_by_category.length > 0 ? (
                  <>
                    {(() => {
                      const chartData = annualReport.costs_by_category.map((item: any) => ({
                        name: item.category === 'preventive' ? 'Préventive' : 
                              item.category === 'corrective' ? 'Corrective' : 
                              item.category === 'ameliorative' ? 'Améliorative' : item.category,
                        value: parseFloat(item.total_cost) || 0,
                        operations_count: parseInt(item.operations_count) || 0,
                        average_cost: parseFloat(item.average_cost) || 0,
                        originalCategory: item.category
                      }));
                      
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
                                const percent = total > 0 ? ((value / total) * 100).toFixed(0) : '0';

                                return (
                                  <text 
                                    x={x} 
                                    y={y} 
                                    fill="white" 
                                    textAnchor={x > cx ? 'start' : 'end'} 
                                    dominantBaseline="central"
                                    fontSize="14"
                                    fontWeight="bold"
                                  >
                                    {`${percent}%`}
                                  </text>
                                );
                              }}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [formatCurrency(value), 'Coût total']}
                              content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0];
                                  return (
                                    <div className="bg-white p-2 border rounded shadow dark:bg-gray-800 dark:border-gray-700">
                                      <p className="font-semibold">{data.name}</p>
                                      <p className="text-sm">Coût total: {formatCurrency(data.value)}</p>
                                      <p className="text-sm">Opérations: {data.payload.operations_count}</p>
                                      <p className="text-sm">Coût moyen: {formatCurrency(data.payload.average_cost)}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                    {/* Légende */}
                    <div className="flex justify-center mt-4 space-x-4 flex-wrap">
                      {annualReport.costs_by_category.map((item: any, index: number) => (
                        <div key={item.category} className="flex items-center mb-2">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category === 'preventive' ? 'Préventive' : 
                             item.category === 'corrective' ? 'Corrective' : 
                             item.category === 'ameliorative' ? 'Améliorative' : item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
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
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={formatYAxisValue}
                    domain={[0, 'dataMax + 5%']}
                  />
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