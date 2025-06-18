'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vehiclesService } from '@/services/vehicles.service'
import { Vehicle } from '@/types'
import toast from 'react-hot-toast'

interface VehicleModalProps {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
}

export default function VehicleModal({ vehicle, isOpen, onClose }: VehicleModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Partial<Vehicle>>()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const underWarranty = watch('under_warranty')

  const { data: vehicleTypes } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: vehiclesService.getVehicleTypes
  })

  useEffect(() => {
    if (vehicle) {
      reset(vehicle)
      // Si le véhicule a déjà une image, afficher le preview
      if (vehicle.image_path) {
        setImagePreview(`${process.env.NEXT_PUBLIC_API_URL}/storage/${vehicle.image_path}`)
      }
    } else {
      reset({
        status: 'active',
        under_warranty: false
      })
      setImagePreview(null)
    }
    setImageFile(null)
  }, [vehicle, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide')
        return
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille de l\'image ne doit pas dépasser 5MB')
        return
      }

      setImageFile(file)
      
      // Créer un preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      const formData = new FormData()
      
      // Ajouter tous les champs du véhicule
      Object.keys(data).forEach(key => {
        if (data[key as keyof Vehicle] !== undefined) {
          formData.append(key, String(data[key as keyof Vehicle]))
        }
      })
      
      // Ajouter l'image si elle existe
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      return vehicle 
        ? vehiclesService.updateVehicle(vehicle.id, formData)
        : vehiclesService.createVehicle(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success(vehicle ? 'Véhicule modifié avec succès' : 'Véhicule ajouté avec succès')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const onSubmit = (data: Partial<Vehicle>) => {
    // S'assurer que under_warranty est un booléen
    const processedData = {
      ...data,
      under_warranty: Boolean(data.under_warranty)
    }
    
    // Si pas sous garantie, supprimer la date de fin de garantie
    if (!processedData.under_warranty) {
      delete processedData.warranty_end_date
    }
    
    mutation.mutate(processedData)
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
                          {vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
                        </Dialog.Title>
                        
                        <div className="mt-6 space-y-4">
                          {/* Upload d'image */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Photo du véhicule
                            </label>
                            <div className="flex items-center space-x-4">
                              {imagePreview ? (
                                <div className="relative">
                                  <img
                                    src={imagePreview}
                                    alt="Aperçu"
                                    className="h-24 w-24 rounded-lg object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageFile(null)
                                      setImagePreview(null)
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <label
                                  htmlFor="vehicle-image"
                                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Choisir une image
                                </label>
                                <input
                                  id="vehicle-image"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="sr-only"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG jusqu'à 5MB
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Immatriculation
                            </label>
                            <input
                              type="text"
                              {...register('registration_number', { required: 'L\'immatriculation est requise' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            />
                            {errors.registration_number && (
                              <p className="mt-1 text-sm text-red-600">{errors.registration_number.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Marque
                              </label>
                              <input
                                type="text"
                                {...register('brand', { required: 'La marque est requise' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              />
                              {errors.brand && (
                                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Modèle
                              </label>
                              <input
                                type="text"
                                {...register('model', { required: 'Le modèle est requis' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              />
                              {errors.model && (
                                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Type de véhicule
                            </label>
                            <select
                              {...register('vehicle_type_id', { 
                                required: 'Le type est requis',
                                valueAsNumber: true 
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            >
                              <option value="">Sélectionner un type</option>
                              {vehicleTypes?.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                            {errors.vehicle_type_id && (
                              <p className="mt-1 text-sm text-red-600">{errors.vehicle_type_id.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Année
                              </label>
                              <input
                                type="number"
                                {...register('year', { 
                                  valueAsNumber: true,
                                  min: { value: 1900, message: 'Année invalide' },
                                  max: { value: new Date().getFullYear() + 1, message: 'Année invalide' }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              />
                              {errors.year && (
                                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Date d'acquisition
                              </label>
                              <input
                                type="date"
                                {...register('acquisition_date')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Statut
                            </label>
                            <select
                              {...register('status')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            >
                              <option value="active">Actif</option>
                              <option value="maintenance">En maintenance</option>
                              <option value="out_of_service">Hors service</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('under_warranty')}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              Sous garantie
                            </label>
                          </div>

                          {underWarranty && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Date de fin de garantie
                              </label>
                              <input
                                type="date"
                                {...register('warranty_end_date', {
                                  required: underWarranty ? 'La date de fin de garantie est requise' : false
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                              />
                              {errors.warranty_end_date && (
                                <p className="mt-1 text-sm text-red-600">{errors.warranty_end_date.message}</p>
                              )}
                            </div>
                          )}
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
                      {mutation.isPending ? 'En cours...' : (vehicle ? 'Modifier' : 'Ajouter')}
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