export default function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink/80">{label}</label>
      )}
      <textarea
        className={`rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-accent outline-none transition-colors resize-y ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
