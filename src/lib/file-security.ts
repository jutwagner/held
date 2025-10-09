// File upload security utilities

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

// Allowed MIME types for images
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// Maximum file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// File signature validation (magic numbers)
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
};

/**
 * Validates file type, size, and content
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 2MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Validate file signature (magic numbers)
  const isValidSignature = await validateFileSignature(file);
  if (!isValidSignature) {
    return {
      isValid: false,
      error: 'File content does not match declared type. Possible malicious file.'
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);

  return {
    isValid: true,
    sanitizedFilename
  };
}

/**
 * Validates file signature against declared MIME type
 */
async function validateFileSignature(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 8)); // Read first 8 bytes
      
      const expectedSignature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
      if (!expectedSignature) {
        resolve(false);
        return;
      }

      // Check if file starts with expected signature
      const matches = expectedSignature.every((byte, index) => bytes[index] === byte);
      resolve(matches);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
}

/**
 * Sanitizes filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  
  // Remove or replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');
  
  // Limit length
  sanitized = sanitized.slice(0, 100);
  
  // Ensure it's not empty
  if (!sanitized || sanitized === '.') {
    sanitized = 'upload_' + Date.now();
  }
  
  return sanitized;
}

/**
 * Additional security: Check for suspicious file patterns
 */
export function isSuspiciousFile(file: File): boolean {
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(file.name));
}

/**
 * Generate secure storage path
 */
export function generateSecureStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = sanitizeFilename(filename);
  
  return `users/${userId}/uploads/${timestamp}_${randomId}_${sanitizedFilename}`;
}
