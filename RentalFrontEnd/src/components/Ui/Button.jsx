import React from 'react';

export const Button = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded font-semibold focus:outline-none transition duration-300';

  // Define different button styles based on the variant
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    success: 'bg-green-500 text-white hover:bg-green-600',

  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
