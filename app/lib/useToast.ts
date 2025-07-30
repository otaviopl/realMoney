import { toast } from 'react-hot-toast'

export const useToast = () => {
  return {
    success: (message: string, duration?: number) => 
      toast.success(message, { duration: duration || 6000 }),
    error: (message: string, duration?: number) => 
      toast.error(message, { duration: duration || 8000 }),
    info: (message: string, duration?: number) => 
      toast(message, { 
        duration: duration || 5000,
        icon: 'ℹ️',
      }),
    loading: (message: string) => toast.loading(message),
    dismiss: () => toast.dismiss(),
  }
}
