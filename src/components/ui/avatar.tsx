"use client";

import * as React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback?: string;
}

export function Avatar({ className = '', fallback, children, ...props }: AvatarProps) {
  return (
    <div
      className={`relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 text-gray-600 ${className}`}
      {...props}
    >
      {children}
      {!children && fallback ? (
        <span className="flex h-full w-full items-center justify-center text-sm font-medium">
          {fallback}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarImage({ className = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={`h-full w-full object-cover ${className}`} {...props} />;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AvatarFallback({ className = '', children, ...props }: AvatarFallbackProps) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center bg-gray-300 text-sm font-medium text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
