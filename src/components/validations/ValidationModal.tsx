'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceService } from '@/services/maintenance.service'
import { MaintenanceOperation } from '@/types'
import toast from 'react-hot-toast'

interface ValidationModalProps {
  operation: MaintenanceOperation
  action: 'validate' | 'reject'
  isOpen: boolean
  onClose: () => void
}

export default function ValidationModal({ 
  operation, 
  action, 
  isOpen, 
  onClose 
}: ValidationModalProps) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: (data: { status: 'validated' | 'rejected'; comment?: string }) => 
      maintenanceService.validateOperation(operation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-validations'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-operations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(
        action === 'validate' 
          ? 'Opération validée avec succès' 
          : 'Opération rejetée'
      )
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const handleSubmit = () => {
    mutation.mutate({
      status: action === 'validate' ? 'validated' : 'rejected',
      comment: comment || undefined
    })
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
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                      action === 'validate' ? 'bg-green-100' : 'bg-red-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                      {action === 'validate' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {action === 'validate' ? 'Valider l\'opération' : 'Rejeter l\'opération'}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Vous êtes sur le point de {action === 'validate' ? 'valider' : 'rejeter'} l'opération de maintenance pour le véhicule {operation.vehicle?.registration_number}.
                        </p>
                        
                        <div className="mt-4">
                          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                            Commentaire {action === 'reject' && '(requis)'}
                          </label>
                          <textarea
                            id="comment"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder={action === 'validate' 
                              ? 'Commentaire optionnel...' 
                              : 'Veuillez expliquer la raison du rejet...'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={mutation.isPending || (action === 'reject' && !comment)}
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50 ${
                      action === 'validate' 
                        ? 'bg-green-600 hover:bg-green-500' 
                        : 'bg-red-600 hover:bg-red-500'
                    }`}
                  >
                    {mutation.isPending ? 'Traitement...' : 'Confirmer'}
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