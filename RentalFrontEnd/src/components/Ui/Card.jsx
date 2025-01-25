import React from 'react';

export const Card = ({ className, children }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children }) => {
  return (
    <div className={`p-4 flex items-center justify-between border-b ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ className, children }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export const CardFooter = ({ className, children }) => {
  return (
    <div className={`pt-40 ${className}`}>
      {children}
    </div>
  );
};