export default function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-surface rounded-2xl shadow-xl border border-line w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
      >
        <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink/50 hover:text-ink text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
