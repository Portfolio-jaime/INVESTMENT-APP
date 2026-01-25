import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function Header({ title, description, actions, breadcrumbs }: HeaderProps) {
  return (
    <div className="border-b bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-foreground">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}