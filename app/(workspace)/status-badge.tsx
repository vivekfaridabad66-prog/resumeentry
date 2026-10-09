export default function StatusBadge({ status }: { status: string }) {
  const normalized =
    status.toUpperCase() === "COMPLETE" ? "COMPLETED" : status.toUpperCase();
  const known = [
    "COMPLETED",
    "REVIEW",
    "PENDING",
    "PROCESSING",
    "DUPLICATE",
    "FAILED",
    "CANCELLED",
  ];
  const tone = known.includes(normalized)
    ? normalized.toLowerCase()
    : "neutral";
  return (
    <span className={`status-pill status-${tone}`}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}
