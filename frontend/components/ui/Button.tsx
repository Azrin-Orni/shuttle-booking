interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'ghost';
}

export default function Button({
  children,
  isLoading,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const base = 'w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    ghost: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${base} ${variants[variant]} ${props.className || ''}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}