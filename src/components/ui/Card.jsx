export default function Card({ children, className = '', gradient = false, ...props }) {
  return (
    <div className={`glass rounded-2xl p-6 transition-all duration-300 hover:border-primary-500/20 ${gradient ? 'bg-gradient-to-br from-primary-500/10 to-purple-500/10' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
