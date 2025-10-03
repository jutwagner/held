'use client';

import type { Area } from 'react-easy-crop';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  fileType = 'image/jpeg'
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const rotRad = getRadianAngle(rotation);

  // Use a "safe area" so rotated images never get clipped before cropping
  const maxSize = Math.max(image.width, image.height);
  const safeArea = Math.ceil(2 * (maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const { x, y, width, height } = {
    x: Math.round(pixelCrop.x),
    y: Math.round(pixelCrop.y),
    width: Math.max(1, Math.round(pixelCrop.width)),
    height: Math.max(1, Math.round(pixelCrop.height)),
  };

  const cropX = Math.min(
    Math.max(0, safeArea / 2 - width / 2 + x),
    safeArea - width
  );
  const cropY = Math.min(
    Math.max(0, safeArea / 2 - height / 2 + y),
    safeArea - height
  );

  const data = ctx.getImageData(cropX, cropY, width, height);

  canvas.width = width;
  canvas.height = height;

  ctx.putImageData(data, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((file) => {
      if (!file) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(file);
    }, fileType);
  });
}

export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

export const readFileAsDataURL = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(String(reader.result));
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
};
