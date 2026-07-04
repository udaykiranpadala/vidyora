const VARIANTS = {
  draft: "bg-warning-soft text-warning",
  published: "bg-success-soft text-success",
  closed: "bg-line text-ink/60",
  mcq: "bg-accent-soft text-accent",
  coding: "bg-ink/5 text-ink/70",
};

export default function Badge({ children, variant = "draft" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
