/** Generic spark-in-circle ornament (not a third-party logo). */
export function CopilotSparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="var(--cp-spark-bg, #1f3d2f)" stroke="var(--cp-spark-stroke, #2ea043)" strokeWidth="1" />
      <path
        d="M12 5.5l1.1 2.4 2.6.3-2 1.7.6 2.5L12 10.5 9.7 12.4l.6-2.5-2-1.7 2.6-.3L12 5.5z"
        fill="var(--cp-spark-star, #7ee787)"
      />
    </svg>
  );
}
