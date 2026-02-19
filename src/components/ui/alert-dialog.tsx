'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelLabel?: string
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onConfirm: () => void
  isLoading?: boolean
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  confirmVariant = 'destructive',
  onConfirm,
  isLoading = false,
}: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
