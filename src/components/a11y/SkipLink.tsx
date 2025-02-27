// src/components/a11y/SkipLink.tsx

import React from 'react';

export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600"
  >
    Skip to main content
  </a>
);

// src/components/a11y/LiveRegion.tsx

import React from 'react';

export const LiveRegion = ({ children, priority = 'polite' }) => (
  <div
    role="status"
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {children}
  </div>
);

// src/hooks/useKeyboardNavigation.ts

import { useEffect } from 'react';

export const useKeyboardNavigation = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
};

// src/components/ui/button.tsx
// Update existing button component with enhanced accessibility

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
        aria-busy={loading}
        disabled={props.disabled || loading}
      >
        {loading ? (
          <span className="mr-2" aria-hidden="true">
            Loading...
          </span>
        ) : null}
        {props.children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

// src/components/matches/MatchCard.tsx
// Update existing match card with enhanced accessibility

export const MatchCard = ({ match, onSelect }) => (
  <div
    role="article"
    aria-labelledby={`match-name-${match.id}`}
    className="p-4 border rounded-lg"
  >
    <h3 id={`match-name-${match.id}`} className="text-lg font-bold">
      {match.name}
    </h3>
    <div aria-label="Match details">
      <p>Compatibility: {match.compatibility}%</p>
      <p>Industry: {match.industry}</p>
    </div>
    <button
      onClick={() => onSelect(match)}
      aria-label={`View details for ${match.name}`}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
    >
      View Details
    </button>
  </div>
);

// src/components/ui/dialog.tsx
// Update existing dialog with enhanced accessibility

export const Dialog = ({ isOpen, onClose, title, children }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
  >
    <div 
      className="fixed inset-0 bg-black bg-opacity-50"
      onClick={onClose}
      aria-hidden="true"
    />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 id="dialog-title" className="text-lg font-bold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  </div>
);

// src/components/form/TextInput.tsx
// Enhanced accessible form input

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    hint?: string;
  }
>(({ label, error, hint, id, ...props }, ref) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        className={`block w-full rounded-md border ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});