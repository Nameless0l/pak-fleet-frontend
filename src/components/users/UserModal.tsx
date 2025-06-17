'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { User } from '@/types'
import toast from 'react-hot-toast'

interface UserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  name: string
  email: string
  password?: string
  employee_id: string
  role: 'chief' | 'technician'
}

export default function UserModal({ user, isOpen, onClose }: UserModalProps) {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        employee_id: user.employee_id || '',
        role: user.role
      })
    } else {
      reset({
        role: 'technician'
      })
    }
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => 
      user 
        ? usersService.updateUser(user.id, data)
        : usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(user ? 'Utilisateur modifié avec succès' : 'Utilisateur ajouté avec succès')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    }
  })

  const onSubmit = (data: FormData) => {
    if (!user && !data.password) {
      toast.error('Le mot de passe est requis pour un nouvel utilisateur')
      return
    }
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
                          {user ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                        </Dialog.Title>
                        <div className="mt-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Nom complet
                            </label>
                            <input
                              type="text"
                              {...register('name', { required: 'Le nom est requis' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            />
                            {errors.name && (
                              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              {...register('email', { 
                                required: 'L\'email est requis',
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Email invalide'
                                }
                              })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            />
                            {errors.email && (
                              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                          </div>

                          {!user && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Mot de passe
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  {...register('password', { 
                                    required: !user && 'Le mot de passe est requis',
                                    minLength: {
                                      value: 8,
                                      message: 'Le mot de passe doit contenir au moins 8 caractères'
                                    }
                                  })}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                  {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Identifiant employé
                            </label>
                            <input
                              type="text"
                              {...register('employee_id', { required: 'L\'identifiant employé est requis' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            />
                            {errors.employee_id && (
                              <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Rôle
                            </label>
                            <select
                              {...register('role', { required: 'Le rôle est requis' })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-500"
                            >
                              <option value="technician">Technicien</option>
                              <option value="chief">Chef de Service</option>
                            </select>
                            {errors.role && (
                              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
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