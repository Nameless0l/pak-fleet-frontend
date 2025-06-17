'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sparePartsService } from '@/services/spareParts.service'
import { SparePart } from '@/types'
import toast from 'react-hot-toast'

interface StockUpdateModalProps {
  sparePart: SparePart
  isOpen: boolean
  onClose: () => void
}

export default function StockUpdateModal({ sparePart, isOpen, onClose }: StockUpdateModalProps) {
  const queryClient = useQueryClient()
  const [operation, setOperation] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState(1)

  const mutation = useMutation({
    mutationFn: () => sparePartsService.updateStock(sparePart.id, quantity, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] })
      toast.success('Stock mis à jour avec succès')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const handleSubmit = () => {
    mutation.mutate()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Mettre à jour le stock
                      </Dialog.Title>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          {sparePart.name} - Stock actuel: {sparePart.quantity_in_stock} {sparePart.unit}
                        </p>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Opération
                          </label>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setOperation('add')}
                              className={`inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
                                operation === 'add'
                                  ? 'border-transparent bg-green-600 text-white'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <ArrowUpIcon className="h-4 w-4 mr-2" />
                              Ajouter
                            </button>
                            <button
                              type="button"
                              onClick={() => setOperation('remove')}
                              className={`inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
                                operation === 'remove'
                                  ? 'border-transparent bg-red-600 text-white'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <ArrowDownIcon className="h-4 w-4 mr-2" />
                              Retirer
                            </button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                            Quantité
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            min="1"
                            max={operation === 'remove' ? sparePart.quantity_in_stock : undefined}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                          />
                        </div>

                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600">
                            Nouveau stock: {
                              operation === 'add' 
                                ? sparePart.quantity_in_stock + quantity
                                : Math.max(0, sparePart.quantity_in_stock - quantity)
                            } {sparePart.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={mutation.isPending || quantity <= 0}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                  >
                    {mutation.isPending ? 'Mise à jour...' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}