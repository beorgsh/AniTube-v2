import React, { useState, useEffect, useRef } from 'react';

interface FadeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
}

export const FadeImage: React.FC<FadeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  containerClassName = '',
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset states whenever source changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Check if image is already cached/complete when rendered
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoaded(false);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Background placeholder / skeleton while image is loading */}
      {!isLoaded && showSkeleton && (
        <div className="absolute inset-0 bg-[#1f1f1f] animate-pulse pointer-events-none" />
      )}

      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`${className} transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

export const VerifiedBadge: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 shrink-0',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="Verified"
    >
      <circle cx="12" cy="12" r="10" fill="#3ea6ff" />
      <path
        d="M8.5 12.2L10.8 14.5L15.8 9.5"
        stroke="#0f0f0f"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
