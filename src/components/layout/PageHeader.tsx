// src/components/layout/PageHeader.tsx

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-2xl font-bold text-gray-900 dark:text-white"
            id="page-title"
          >
            {title}
          </h1>
          {description && (
            <p 
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              id="page-description"
            >
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="ml-4 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;