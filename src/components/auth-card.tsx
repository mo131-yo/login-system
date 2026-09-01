import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-center text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-4">{children}</div>
        </div>
        {footer && (
          <div className="border-t border-black/5 bg-gray-50/60 px-8 py-4 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthDivider({ label = "эсвэл" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
      {label}
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
    </div>
  );
}

export function AuthField({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...props}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30"
      />
    </div>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
    >
      {children}
      {!disabled && <span aria-hidden="true">→</span>}
    </button>
  );
}
