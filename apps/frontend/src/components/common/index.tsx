import React from 'react';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => (
  <div
    className={`bg-white rounded-lg shadow-md p-4 ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <textarea
      className={`
        block w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'}
        px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed resize-none
        ${className}
      `}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
  </div>
);

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      className={`
        block w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'}
        px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// Avatar Component
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', fallback, online }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };
  
  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold`}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{fallback || alt?.charAt(0).toUpperCase() || '?'}</span>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

// Spinner Component
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizes[size]} border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin`} />
    </div>
  );
};

// Divider Component
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-gray-200 ${className}`} />
);

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && <div className="text-gray-400 mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-gray-600 mb-4 max-w-md">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
