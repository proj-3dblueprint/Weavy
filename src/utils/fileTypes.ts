/**
 * Accepted file types for upload and drag-and-drop operations
 * This configuration is used by FileUploaderV2 and Flow canvas drop handler
 */
export const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/webp': ['.webp'],
  'video/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'audio/*': ['.mp3', '.wav', '.ogg'],
  'model/gltf-binary': ['.glb'],
};

/**
 * Check if a file is accepted based on MIME type and extension
 * @param file - The file to check
 * @returns true if the file type is accepted, false otherwise
 */
export const isFileTypeAccepted = (file: File): boolean => {
  // First, check if the file's MIME type matches any of our accepted types
  const acceptedMimeTypes = Object.keys(ACCEPTED_FILE_TYPES);
  const mimeTypeMatch = acceptedMimeTypes.some((mimeType) => {
    if (mimeType.endsWith('/*')) {
      const baseType = mimeType.slice(0, -2); // Remove '/*'
      return file.type.startsWith(baseType + '/');
    }
    return file.type === mimeType;
  });

  if (mimeTypeMatch) {
    return true;
  }

  // If MIME type doesn't match, fall back to extension check
  const fileExtension = getFileExtension(file.name);
  if (fileExtension) {
    return acceptedMimeTypes.some((mimeType) => {
      return ACCEPTED_FILE_TYPES[mimeType as keyof typeof ACCEPTED_FILE_TYPES].includes(fileExtension);
    });
  }

  return false;
};

/**
 * Extract file extension safely, handling edge cases
 * @param fileName - The file name to extract extension from
 * @returns The file extension with leading dot, or null if no extension found
 */
const getFileExtension = (fileName: string): string | null => {
  // Handle empty or invalid file names
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }

  // Find the last dot that's not at the beginning or end
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return null; // No valid extension found
  }

  return '.' + fileName.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Filter accepted file types based on the specified file type category
 * @param acceptedFileType - The file type category ('image', 'video', 'audio', '3D')
 * @returns Filtered accepted file types configuration
 */
export const getFilteredAcceptedFileTypes = (acceptedFileTypeCategory?: string) => {
  if (!acceptedFileTypeCategory) {
    return ACCEPTED_FILE_TYPES;
  }

  const filteredTypes: Partial<typeof ACCEPTED_FILE_TYPES> = {};

  // Map acceptedFileType to MIME type prefixes
  const typePrefixMap: Record<string, string> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    '3D': 'model',
  };

  const prefix = typePrefixMap[acceptedFileTypeCategory];
  if (!prefix) {
    // If unknown type, return all accepted types
    return ACCEPTED_FILE_TYPES;
  }

  // Filter file types that match the prefix
  Object.entries(ACCEPTED_FILE_TYPES).forEach(([mimeType, extensions]) => {
    if (mimeType.startsWith(prefix)) {
      filteredTypes[mimeType as keyof typeof ACCEPTED_FILE_TYPES] = extensions;
    }
  });

  return filteredTypes;
};
