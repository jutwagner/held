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

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  fileType = 'image/jpeg'
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Canvas context not available');
  }

  tempCanvas.width = bBoxWidth;
  tempCanvas.height = bBoxHeight;

  tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  tempCtx.rotate(rotRad);
  tempCtx.translate(-image.width / 2, -image.height / 2);
  tempCtx.drawImage(image, 0, 0);

  const cropX = Math.max(0, Math.min(Math.round(pixelCrop.x), Math.max(0, Math.floor(bBoxWidth - pixelCrop.width))));
  const cropY = Math.max(0, Math.min(Math.round(pixelCrop.y), Math.max(0, Math.floor(bBoxHeight - pixelCrop.height))));
  const cropWidth = Math.min(Math.round(pixelCrop.width), Math.floor(bBoxWidth - cropX));
  const cropHeight = Math.min(Math.round(pixelCrop.height), Math.floor(bBoxHeight - cropY));

  const data = tempCtx.getImageData(cropX, cropY, cropWidth, cropHeight);

  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) {
    throw new Error('Canvas context not available');
  }

  outputCanvas.width = cropWidth;
  outputCanvas.height = cropHeight;
  outputCtx.putImageData(data, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((file) => {
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
