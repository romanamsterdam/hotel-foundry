import { useState } from 'react';

interface SafeImageProps {
  src?: string;
  fallbackText: string;
  className?: string;
  alt?: string;
}

export default function SafeImage({ src, fallbackText, className = '', alt = '' }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    // Generate initials from fallback text
    const initials = fallbackText
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);

    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-400 to-accent-500 text-white font-bold ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}