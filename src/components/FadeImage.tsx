import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface FadeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
  lazyRootMargin?: string;
}

export const FadeImage: React.FC<FadeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  containerClassName = '',
  showSkeleton = true,
  lazyRootMargin = '200px',
  onLoad,
  onError,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset states whenever source changes
  useEffect(() => {
    if (!src || typeof src !== 'string' || src.trim() === '' || src === 'null' || src === 'undefined' || src === 'N/A') {
      setHasError(true);
      setIsLoaded(true);
      setCurrentSrc(undefined);
    } else {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src]);

  // IntersectionObserver to only load image when near viewport
  useEffect(() => {
    if (!containerRef.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: lazyRootMargin }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazyRootMargin]);

  // Check if image is already cached/complete when rendered
  useEffect(() => {
    if (isVisible && imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        handleErrorState();
      }
    }
  }, [currentSrc, isVisible]);

  const handleErrorState = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoaded(false);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    handleErrorState();
    if (onError) {
      onError(e);
    }
  };

  const isPositioned =
    containerClassName.includes('absolute') ||
    containerClassName.includes('fixed') ||
    containerClassName.includes('relative');

  const wrapperClass = isPositioned
    ? `overflow-hidden ${containerClassName}`
    : `relative overflow-hidden ${containerClassName}`;

  const isCircle = containerClassName.includes('rounded-full') || className.includes('rounded-full');

  return (
    <div ref={containerRef} className={wrapperClass}>
      {/* Background placeholder / skeleton while image is loading */}
      {(!isLoaded || !isVisible) && !hasError && showSkeleton && (
        <div className="absolute inset-0 bg-[#1f1f1f] animate-pulse pointer-events-none" />
      )}

      {/* Render Fallback UI if Image Has Error or Missing Src */}
      {hasError || !currentSrc ? (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#202020] via-[#161616] to-[#0e0e0e] border border-white/5 text-gray-400 p-2 text-center select-none overflow-hidden ${className}`}>
          <div className={`flex items-center justify-center text-gray-400 shrink-0 ${isCircle ? 'w-full h-full' : 'w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 mb-1 shadow-inner'}`}>
            <ImageOff className={isCircle ? 'w-1/2 h-1/2 text-gray-400' : 'w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-gray-400'} />
          </div>
          {!isCircle && (
            <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 leading-tight max-w-[95%] truncate tracking-tight">
              No Thumbnail Available
            </span>
          )}
        </div>
      ) : isVisible && currentSrc ? (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover block ${className} transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      ) : null}
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
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};
