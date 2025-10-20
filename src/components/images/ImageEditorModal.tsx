'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImage, blobToFile, readFileAsDataURL } from '@/lib/image-editor';
import { RotateCcw, RotateCw, Maximize, ZoomIn, RotateCcw as RotateLeftIcon, RotateCw as RotateRightIcon } from 'lucide-react';

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

const ASPECT_RATIO_OPTIONS = [
  { label: 'Original', value: undefined, icon: Maximize },
  { label: '1:1', value: 1, icon: Maximize },
  { label: '4:3', value: 4/3, icon: Maximize },
  { label: '3:4', value: 3/4, icon: Maximize },
  { label: '16:9', value: 16/9, icon: Maximize },
  { label: '9:16', value: 9/16, icon: Maximize },
  { label: '3:2', value: 3/2, icon: Maximize },
  { label: '2:3', value: 2/3, icon: Maximize },
];

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
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | undefined>(undefined);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const effectiveAspect = selectedAspectRatio ?? aspect ?? imageAspect;

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setProcessing(false);
      setImageSrc(null);
      setImageAspect(undefined);
      setCropSize(undefined);
      setSelectedAspectRatio(undefined);
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
      <DialogContent className="max-w-3xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col md:rounded-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-medium">Adjust photo</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div ref={containerRef} className="relative w-full flex-1 min-h-[300px] md:h-[400px] bg-gray-900/90 rounded-lg overflow-hidden">
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

          {/* Modern Controls */}
          <div className="space-y-6">
            {/* Zoom Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Zoom</span>
                </div>
                <span className="text-sm text-gray-500 font-mono">{zoom.toFixed(1)}x</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={DEFAULT_MIN_ZOOM}
                  max={DEFAULT_MAX_ZOOM}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(parseFloat(event.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right,rgb(0, 0, 0) 0%,rgb(0, 0, 0) ${((zoom - DEFAULT_MIN_ZOOM) / (DEFAULT_MAX_ZOOM - DEFAULT_MIN_ZOOM)) * 100}%, #e5e7eb ${((zoom - DEFAULT_MIN_ZOOM) / (DEFAULT_MAX_ZOOM - DEFAULT_MIN_ZOOM)) * 100}%,rgb(0, 0, 0) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Rotation</span>
                <span className="text-sm text-gray-500 font-mono">{rotation}°</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Quick rotation buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => prev - 90)}
                    disabled={processing}
                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateLeftIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => prev + 90)}
                    disabled={processing}
                    className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateRightIcon className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                
                {/* Fine rotation slider */}
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(event) => setRotation(parseInt(event.target.value, 10))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rotation + 180) / 360) * 100}%, #e5e7eb ${((rotation + 180) / 360) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Aspect Ratio Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-6">
                <span className="text-sm font-medium text-gray-700">Aspect Ratio</span>
              </div>
              
              <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedAspectRatio(option.value)}
                    disabled={!imageSrc}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      selectedAspectRatio === option.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={option.label}
                  >
                    {option.label === 'Original' ? '∞' : option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {onUseOriginal && (
              <button
                type="button"
                onClick={handleUseOriginal}
                disabled={!file || processing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use original
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => !processing && onClose()}
                disabled={processing}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={disableApply}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {processing ? 'Processing…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageEditorModal;
