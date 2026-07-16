import toast from 'react-hot-toast';

export const useToast = () => {
  const success = (message) => toast.success(message, {
    style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(99, 102, 241, 0.3)' },
    iconTheme: { primary: '#10b981', secondary: '#f1f5f9' }
  });
  const error = (message) => toast.error(message, {
    style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(239, 68, 68, 0.3)' },
    iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' }
  });
  const info = (message) => toast(message, {
    style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(99, 102, 241, 0.3)' },
    icon: 'ℹ️'
  });
  return { success, error, info };
};
