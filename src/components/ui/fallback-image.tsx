'use client';

import { useMemo, useState } from 'react';
import { ImageIcon } from 'lucide-react';

type FallbackImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  fallbackLabel?: string;
};

function buildInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function FallbackImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  fallbackLabel,
}: FallbackImageProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => buildInitials(fallbackLabel || alt), [alt, fallbackLabel]);
  const shouldShowImage = Boolean(src) && !failed;

  return (
    <div className={wrapperClassName}>
      {shouldShowImage ? (
        <img
          src={src || undefined}
          alt={alt}
          className={className}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-stone-100 to-white text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {initials || 'IMG'}
          </div>
        </div>
      )}
    </div>
  );
}
