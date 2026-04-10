export type ToastType = 'success' | 'error' | 'info'

export interface ToastEvent {
  message: string
  type: ToastType
  id: number
}

let counter = 0

export function toast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ToastEvent>('app:toast', {
      detail: { message, type, id: ++counter },
    })
  )
}
