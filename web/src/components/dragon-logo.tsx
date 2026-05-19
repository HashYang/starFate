interface DragonLogoProps {
  size?: number;
  className?: string;
}

export function DragonLogo({ size = 120, className = "" }: DragonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
    >
      {/* Outer rings */}
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="0.4" opacity="0.12" />
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="0.2" opacity="0.08" />

      {/* Coiled dragon body — flowing brush-stroke-like arcs */}
      <path
        d="M40 72 C28 52, 42 28, 64 28 C86 28, 96 48, 86 66 C78 82, 60 90, 46 86 C34 82, 32 70, 38 60 C44 50, 56 46, 64 49"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Dragon head / muzzle */}
      <path
        d="M64 49 C68 47, 74 44, 78 46"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />

      {/* Antlers */}
      <path
        d="M76 44 C80 38, 86 36, 88 40"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M78 46 C82 40, 88 38, 90 42"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />

      {/* Whiskers / flames */}
      <path
        d="M68 56 C72 60, 74 64, 72 68"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M70 56 C74 60, 76 64, 74 68"
        stroke="currentColor"
        strokeWidth="0.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />

      {/* Dragon pearl */}
      <circle cx="68" cy="42" r="2.5" fill="currentColor" opacity="0.4" />

      {/* Auspicious cloud wisps */}
      <path
        d="M20 40 Q26 36, 30 40 Q34 44, 28 46"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />
      <path
        d="M86 80 Q92 76, 96 80 Q100 84, 94 86"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />
    </svg>
  );
}
