import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface UseConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  type?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<UseConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<{
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = (options: UseConfirmOptions): Promise<boolean> => {
    setOptions(options)
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolvePromise({ resolve })
    })
  }

  const handleConfirm = () => {
    resolvePromise?.resolve(true)
    handleClose()
  }

  const handleClose = () => {
    resolvePromise?.resolve(false)
    setIsOpen(false)
    setOptions(null)
    setResolvePromise(null)
  }

  const ConfirmDialogComponent = () => {
    if (!options) return null

    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...options}
      />
    )
  }

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}