import toast from 'react-hot-toast';

export const useToast = () => {
  const success = (message) => toast.success(message, {
    iconTheme: { primary: '#10b981', secondary: '#fff' }
  });
  const error = (message) => toast.error(message, {
    iconTheme: { primary: '#ef4444', secondary: '#fff' }
  });
  const info = (message) => toast(message, {
    icon: 'ℹ️'
  });
  return { success, error, info };
};
