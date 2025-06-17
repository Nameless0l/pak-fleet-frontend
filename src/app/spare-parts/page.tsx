'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sparePartsService } from '@/services/spareParts.service'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import SparePartModal from '@/components/spareParts/SparePartModal'
import StockUpdateModal from '@/components/spareParts/StockUpdateModal'
import toast from 'react-hot-toast'
import { SparePart } from '@/types'

export default function SparePartsPage() {
  const { isChief } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['spare-parts', currentPage, search, showLowStock],
    queryFn: () => sparePartsService.getSpareParts({ 
      page: currentPage, 
      search,
      low_stock: showLowStock ? true : undefined,
      per_page: 15 
    })
  })

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part)
    setIsModalOpen(true)
  }

  const handleUpdateStock = (part: SparePart) => {
    setSelectedPart(part)
    setIsStockModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedPart(null)
    setIsModalOpen(true)
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      filtration: 'Filtration',
      lubrification: 'Lubrification',
      pneumatique: 'Pneumatique',
      batterie: 'Batterie',
      autre: 'Autre'
    }
    return labels[category] || category
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pièces détachées</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestion du stock de pièces détachées
            </p>
          </div>
          {isChief() && (
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Ajouter une pièce
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-lg">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-gray-500"
                placeholder="Rechercher par nom ou code..."
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="low-stock"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="low-stock" className="ml-2 text-sm text-gray-700">
              Stock faible uniquement
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code / Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unitaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune pièce trouvée
                  </td>
                </tr>
              ) : (
                data?.data.map((part) => (
                  <tr key={part.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{part.name}</div>
                        <div className="text-sm text-gray-500">{part.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryLabel(part.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {part.quantity_in_stock} {part.unit}
                        </div>
                        <div className="text-sm text-gray-500">
                          Min: {part.minimum_stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('fr-CM', { 
                        style: 'currency', 
                        currency: 'XAF' 
                      }).format(part.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {part.is_low_stock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Stock faible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Stock OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateStock(part)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Mettre à jour le stock"
                        >
                          <ArrowUpIcon className="h-5 w-5" />
                        </button>
                        {isChief() && (
                          <button
                            onClick={() => handleEdit(part)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Modals */}
      {isModalOpen && (
        <SparePartModal
          sparePart={selectedPart}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      
      {isStockModalOpen && selectedPart && (
        <StockUpdateModal
          sparePart={selectedPart}
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
        />
      )}
    </DashboardLayout>
  )
}