'use client'

import { Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sparePartsService } from '@/services/spareParts.service'
import { SparePart } from '@/types'
import toast from 'react-hot-toast'

interface SparePartModalProps {
  sparePart: SparePart | null
  isOpen: boolean
  onClose: () => void
}

export default function SparePartModal({ sparePart, isOpen, onClose }: SparePartModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<SparePart>>()

  useEffect(() => {
    if (sparePart) {
      reset(sparePart)
    } else {
      reset({
        category: 'autre',
        minimum_stock: 5,
        quantity_in_stock: 0
      })
    }
  }, [sparePart, reset])

  const mutation = useMutation({
    mutationFn: (data: Partial<SparePart>) => 
      sparePart 
        ? sparePartsService.updateSparePart(sparePart.id, data)
        : sparePartsService.createSparePart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] })
      toast.success(sparePart ? 'Pièce modifiée avec succès' : 'Pièce ajoutée avec succès')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const onSubmit = (data: Partial<SparePart>) => {
    mutation.mutate(data)
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          {sparePart ? 'Modifier la pièce' : 'Ajouter une pièce'}
                        </Dialog.Title>
                        <div className="mt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Code
                              </label>
                              <input
                                type="text"
                                {...register('code', { required: 'Le code est requis' })}
                                disabled={!!sparePart}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                              />
                              {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Catégorie
                              </label>
                              <select
                                {...register('category', { required: 'La catégorie est requise' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                <option value="filtration">Filtration</option>
                                <option value="lubrification">Lubrification</option>
                                <option value="pneumatique">Pneumatique</option>
                                <option value="batterie">Batterie</option>
                                <option value="autre">Autre</option>
                              </select>
                              {errors.category && (
                                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Nom
                            </label>
                            <input
                              type="text"
                              {...register('name', { required: 'Le nom est requis' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.name && (
                              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              {...register('description')}
                              rows={2}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Unité
                              </label>
                              <input
                                type="text"
                                {...register('unit', { required: 'L\'unité est requise' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="pièce, litre, kg..."
                              />
                              {errors.unit && (
                                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Prix unitaire (XAF)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                {...register('unit_price', { 
                                  required: 'Le prix est requis',
                                  valueAsNumber: true,
                                  min: { value: 0, message: 'Le prix doit être positif' }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              {errors.unit_price && (
                                <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Stock actuel
                              </label>
                              <input
                                type="number"
                                {...register('quantity_in_stock', { 
                                  required: 'Le stock est requis',
                                  valueAsNumber: true,
                                  min: { value: 0, message: 'Le stock doit être positif' }
                                })}
                                disabled={!!sparePart}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                              />
                              {errors.quantity_in_stock && (
                                <p className="mt-1 text-sm text-red-600">{errors.quantity_in_stock.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Stock minimum
                              </label>
                              <input
                                type="number"
                                {...register('minimum_stock', { 
                                  required: 'Le stock minimum est requis',
                                  valueAsNumber: true,
                                  min: { value: 0, message: 'Le stock minimum doit être positif' }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              {errors.minimum_stock && (
                                <p className="mt-1 text-sm text-red-600">{errors.minimum_stock.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                    >
                      {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}