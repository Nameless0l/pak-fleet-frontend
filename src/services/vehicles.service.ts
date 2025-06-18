import api from '@/lib/axios'
import { Vehicle, VehicleType, VehicleAnalytics, PaginatedResponse } from '@/types'

export const vehiclesService = {
  // Récupérer tous les véhicules avec pagination et filtres
  getVehicles: async (params?: {
    page?: number
    search?: string
    status?: string
    type?: string
  }): Promise<PaginatedResponse<Vehicle>> => {
    const { data } = await api.get('/vehicles', { params })
    return data
  },

  // Récupérer un véhicule par ID
  getVehicle: async (id: number): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`)
    return data
  },

  // Créer un nouveau véhicule (avec support FormData pour l'image)
  createVehicle: async (vehicleData: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const isFormData = vehicleData instanceof FormData
    const { data } = await api.post('/vehicles', vehicleData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : {}
    })
    return data
  },

  // Mettre à jour un véhicule (avec support FormData pour l'image)
  updateVehicle: async (id: number, vehicleData: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const isFormData = vehicleData instanceof FormData
    
    // Si c'est FormData, on doit utiliser POST avec _method=PUT pour Laravel
    if (isFormData) {
      vehicleData.append('_method', 'PUT')
      const { data } = await api.post(`/vehicles/${id}`, vehicleData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return data
    } else {
      const { data } = await api.put(`/vehicles/${id}`, vehicleData)
      return data
    }
  },

  // Supprimer un véhicule
  deleteVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`)
  },

  // Récupérer les types de véhicules
  getVehicleTypes: async (): Promise<VehicleType[]> => {
    const { data } = await api.get('/vehicle-types')
    return data
  },

  // Récupérer les analyses/statistiques
  getAnalytics: async (): Promise<VehicleAnalytics> => {
    const { data } = await api.get('/vehicles/analytics')
    return data
  },

  // Exporter les véhicules
  exportVehicles: async (format: 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    const { data } = await api.get('/vehicles/export', {
      params: { format },
      responseType: 'blob'
    })
    return data
  }
}