'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import { vehiclesService } from '@/services/vehicles.service'
import { sparePartsService } from '@/services/spareParts.service'
import toast from 'react-hot-toast'

interface MaintenanceOperationModalProps {
  vehicleId: number | null
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  vehicle_id: number
  maintenance_type_id: number
  operation_date: string
  description: string
  spare_parts: Array<{
    spare_part_id: number
    quantity_used: number
  }>
}

export default function MaintenanceOperationModal({ 
  vehicleId, 
  isOpen, 
  onClose 
}: MaintenanceOperationModalProps) {
  const queryClient = useQueryClient()
  const [selectedParts, setSelectedParts] = useState<Array<{
    spare_part_id: number
    quantity_used: number
  }>>([])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>()

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: () => vehiclesService.getVehicles({ per_page: 100 })
  })

  const { data: maintenanceTypes } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: maintenanceService.getMaintenanceTypes
  })

  const { data: spareParts } = useQuery({
    queryKey: ['spare-parts-list'],
    queryFn: () => sparePartsService.getSpareParts({ per_page: 100 })
  })

  useEffect(() => {
    if (vehicleId) {
      setValue('vehicle_id', vehicleId)
    }
    setValue('operation_date', new Date().toISOString().split('T')[0])
  }, [vehicleId, setValue])

  const mutation = useMutation({
    mutationFn: (data: FormData) => maintenanceService.createOperation({
      ...data,
      spare_parts: selectedParts
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-operations'] })
      queryClient.invalidateQueries({ queryKey: ['planned-operations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Opération de maintenance enregistrée avec succès')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { spare_part_id: 0, quantity_used: 1 }])
  }

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index))
  }

  const handlePartChange = (index: number, field: 'spare_part_id' | 'quantity_used', value: any) => {
    const newParts = [...selectedParts]
    newParts[index] = {
      ...newParts[index],
      [field]: field === 'spare_part_id' ? parseInt(value) : parseInt(value)
    }
    setSelectedParts(newParts)
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Nouvelle opération de maintenance
                        </Dialog.Title>
                        
                        <div className="mt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Véhicule
                              </label>
                              <select
                                {...register('vehicle_id', { 
                                  required: 'Le véhicule est requis',
                                  valueAsNumber: true 
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              >
                                <option value="">Sélectionner un véhicule</option>
                                {vehicles?.data.map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.registration_number} - {vehicle.brand} {vehicle.model}
                                  </option>
                                ))}
                              </select>
                              {errors.vehicle_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.vehicle_id.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Type de maintenance
                              </label>
                              <select
                                {...register('maintenance_type_id', { 
                                  required: 'Le type est requis',
                                  valueAsNumber: true 
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              >
                                <option value="">Sélectionner un type</option>
                                {maintenanceTypes?.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.name} ({type.category})
                                  </option>
                                ))}
                              </select>
                              {errors.maintenance_type_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.maintenance_type_id.message}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Date de l'opération
                            </label>
                            <input
                              type="date"
                              {...register('operation_date', { required: 'La date est requise' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            />
                            {errors.operation_date && (
                              <p className="mt-1 text-sm text-red-600">{errors.operation_date.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              {...register('description')}
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              placeholder="Description de l'opération..."
                            />
                          </div>

                          {/* Pièces détachées */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Pièces détachées utilisées
                              </label>
                              <button
                                type="button"
                                onClick={handleAddPart}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Ajouter une pièce
                              </button>
                            </div>

                            {selectedParts.length > 0 && (
                              <div className="space-y-2">
                                {selectedParts.map((part, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <select
                                      value={part.spare_part_id}
                                      onChange={(e) => handlePartChange(index, 'spare_part_id', e.target.value)}
                                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                      <option value="0">Sélectionner une pièce</option>
                                      {spareParts?.data.map((sp) => (
                                        <option key={sp.id} value={sp.id}>
                                          {sp.name} (Stock: {sp.quantity_in_stock})
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      value={part.quantity_used}
                                      onChange={(e) => handlePartChange(index, 'quantity_used', e.target.value)}
                                      min="1"
                                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePart(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <XMarkIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
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