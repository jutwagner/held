'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImage, blobToFile, readFileAsDataURL } from '@/lib/image-editor';

interface ImageEditorModalProps {
  open: boolean;
  file?: File | null;
  initialUrl?: string | null;
  fileName?: string;
  onClose: () => void;
  onApply: (file: File) => void;
  onUseOriginal?: (file: File) => void;
  aspect?: number;
}

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 3;

export function ImageEditorModal({
  open,
  file,
  initialUrl,
  fileName,
  onClose,
  onApply,
  onUseOriginal,
  aspect,
}: ImageEditorModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageAspect, setImageAspect] = useState<number | undefined>(undefined);
  const [lockAspect, setLockAspect] = useState(true);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const effectiveAspect = lockAspect ? aspect ?? imageAspect : undefined;

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setProcessing(false);
      setImageSrc(null);
      setImageAspect(undefined);
      setLockAspect(true);
      setCropSize(undefined);
      return;
    }

    let active = true;

    const resolveAspect = (src: string) => {
      const img = new Image();
      img.onload = () => {
        if (!active) return;
        if (img.width && img.height) {
          setImageAspect(img.width / img.height);
        } else {
          setImageAspect(undefined);
        }
      };
      img.src = src;
    };

    const loadSource = async () => {
      setLockAspect(true);
      if (file) {
        const dataUrl = await readFileAsDataURL(file);
        if (active) {
          setImageSrc(dataUrl);
          resolveAspect(dataUrl);
        }
      } else if (initialUrl) {
        setImageSrc(initialUrl);
        resolveAspect(initialUrl);
      }
    };

    void loadSource();

    return () => {
      active = false;
    };
  }, [open, file, initialUrl]);

  useEffect(() => {
    if (!open) return;

    const updateCropSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      if (containerWidth === 0 || containerHeight === 0) return;

      if (!effectiveAspect) {
        setCropSize({ width: containerWidth, height: containerHeight });
        return;
      }

      const containerAspect = containerWidth / containerHeight;
      if (containerAspect > effectiveAspect) {
        const height = containerHeight;
        const width = height * effectiveAspect;
        setCropSize({ width, height });
      } else {
        const width = containerWidth;
        const height = width / effectiveAspect;
        setCropSize({ width, height });
      }
    };

    updateCropSize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateCropSize) : null;
    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateCropSize);

    return () => {
      window.removeEventListener('resize', updateCropSize);
      observer?.disconnect();
    };
  }, [open, effectiveAspect]);

  const handleCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleApply = async () => {
    if (!imageSrc || !file || !croppedAreaPixels) {
      return;
    }
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation, file.type || 'image/jpeg');
      const editedFile = blobToFile(blob, fileName || file.name);
      onApply(editedFile);
    } catch (error) {
      console.error('Failed to crop image', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUseOriginal = () => {
    if (file && onUseOriginal) {
      onUseOriginal(file);
    }
  };

  const disableApply = !file || !croppedAreaPixels || processing;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !processing && onClose()}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Adjust photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div ref={containerRef} className="relative w-full h-[400px] bg-gray-900/90 rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={effectiveAspect}
                cropSize={cropSize}
                minZoom={DEFAULT_MIN_ZOOM}
                maxZoom={DEFAULT_MAX_ZOOM}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                restrictPosition
                showGrid
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Zoom</label>
              <input
                type="range"
                min={DEFAULT_MIN_ZOOM}
                max={DEFAULT_MAX_ZOOM}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(parseFloat(event.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rotation</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setRotation((prev) => prev - 90)} disabled={processing}>
                  Rotate left
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setRotation((prev) => prev + 90)} disabled={processing}>
                  Rotate right
                </Button>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(event) => setRotation(parseInt(event.target.value, 10))}
                  className="w-full"
                />
                <span className="text-sm w-12 text-right">{rotation}°</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Aspect ratio</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={lockAspect ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLockAspect(prev => !prev)}
                  disabled={!imageSrc}
                >
                  {lockAspect ? 'Locked' : 'Free'}
                </Button>
                {lockAspect && effectiveAspect ? (
                  <span className="text-xs text-gray-500">
                    {effectiveAspect.toFixed(2)}:1
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {onUseOriginal && (
              <Button type="button" variant="ghost" onClick={handleUseOriginal} disabled={!file || processing}>
                Use original
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => !processing && onClose()} disabled={processing}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApply} disabled={disableApply}>
                {processing ? 'Processing…' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageEditorModal;
