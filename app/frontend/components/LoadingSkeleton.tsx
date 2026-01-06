import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
);

export const QuoteCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    <div className="space-y-3">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-5 w-24" />
    </div>

    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

export const MarketOverviewSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>

    <Skeleton className="h-80 w-full rounded-lg" />

    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-24 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const WatchlistSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <QuoteCardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 7
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="py-3 px-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-200 dark:border-slate-700">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-3 px-4">
                  <Skeleton className="h-4 w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const PortfolioSummarySkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-32" />
      </div>
    ))}
  </div>
);

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md'
}) => {
  const spinnerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerSizes = {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-96'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} space-y-4`}>
      <div className={`${spinnerSizes[size]} border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin`} />
      <div className="text-slate-600 dark:text-slate-300 text-center">{message}</div>
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {icon && (
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
    {description && (
      <p className="text-slate-600 dark:text-slate-300 text-center mb-6 max-w-md">
        {description}
      </p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);
