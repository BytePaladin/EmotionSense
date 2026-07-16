export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full border-2 border-dark-600 border-t-primary-500 animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-dark-400 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
