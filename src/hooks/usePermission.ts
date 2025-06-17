import { useAuth } from '@/contexts/AuthContext'

export function usePermission() {
  const { user } = useAuth()

  const can = (permission: string): boolean => {
    if (!user) return false

    const permissions = {
      'manage-vehicles': ['chief'],
      'validate-operations': ['chief'],
      'manage-users': ['chief'],
      'view-reports': ['chief'],
      'create-maintenance': ['chief', 'technician'],
      'update-stock': ['chief', 'technician'],
    }

    return permissions[permission]?.includes(user.role) || false
  }

  const canAny = (permissions: string[]): boolean => {
    return permissions.some(permission => can(permission))
  }

  const canAll = (permissions: string[]): boolean => {
    return permissions.every(permission => can(permission))
  }

  return { can, canAny, canAll }
}
