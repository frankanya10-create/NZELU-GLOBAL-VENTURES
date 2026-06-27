export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} border-2 border-surface-200 border-t-ngv-700 rounded-full animate-spin`} />
      {text && <p className="text-sm text-surface-500">{text}</p>}
    </div>
  );
}
