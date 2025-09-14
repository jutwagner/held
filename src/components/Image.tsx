import NextImage, { ImageProps } from 'next/image';

interface OptimizedImageProps extends ImageProps {
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export default function Image({ 
  priority = false, 
  placeholder = 'empty',
  loading = 'lazy',
  quality = 85,
  ...props 
}: OptimizedImageProps) {
  return (
    <NextImage 
      {...props}
      priority={priority}
      placeholder={placeholder}
      loading={loading}
      quality={quality}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
