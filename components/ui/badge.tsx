import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'new' | 'viewed' | 'resolved' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    critical: 'bg-red-100 text-red-800 border border-red-300',
    high: 'bg-orange-100 text-orange-800 border border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border border-blue-300',
    new: 'bg-blue-100 text-blue-800',
    viewed: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}