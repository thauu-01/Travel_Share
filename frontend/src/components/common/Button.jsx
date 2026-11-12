import React from 'react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
    ghost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-400'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    return <Icon className="text-lg" />;
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : (
        renderIcon()
      )}
      {children}
    </button>
  );
}

export default Button;
