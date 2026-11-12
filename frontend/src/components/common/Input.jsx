import React from 'react';

export function Input({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {React.isValidElement(Icon) ? Icon : <Icon className="text-lg" />}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full rounded-xl border ${
            error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
          } ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;
