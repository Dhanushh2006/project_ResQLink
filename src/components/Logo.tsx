export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="ResQLink">
      <rect x="2.5" y="2.5" width="43" height="43" rx="11" fill="#16210D" stroke="#a3e635" strokeWidth="1.6" />
      <path d="M16 16 L32 16 M16 16 L24 32 M32 16 L24 32" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
      <circle cx="16" cy="16" r="3.2" fill="#bef264" />
      <circle cx="32" cy="16" r="3.2" fill="#4ADE80" />
      <circle cx="24" cy="32" r="3.2" fill="#a3e635" />
      <path d="M24 20.5 v7 M20.5 24 h7" stroke="#EEF3E6" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
