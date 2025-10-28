import mimeDB from 'mime-db';

/**
 * Appends elements to a URLSearchParams object.
 * @param key - The key to append the elements to.
 * @param arr - The array of elements to append.
 * @param searchParams - The URLSearchParams object to append to.
 * @returns A new URLSearchParams object with the elements appended.
 * @example
 * key = 'id'
 * arr = ['1', '2', '3']
 * will create search params for a URL in the form of ?id=1&id=2&id=3
 */
export const appendQsFromArray = (key: string, arr: (string | number | boolean)[], searchParams?: URLSearchParams) => {
  const copy = new URLSearchParams(searchParams || undefined); // dont allow null, 0
  arr.forEach((e) => copy.append(key, String(e)));
  return copy;
};

export const urlCanParse = (url: string) => {
  try {
    if ('canParse' in URL && typeof URL.canParse === 'function') {
      return URL.canParse(url);
    } else {
      new URL(url);
      return true;
    }
  } catch (_e) {
    return false;
  }
};

type MimeDb = Record<string, { source?: string; charset?: string; compressible?: boolean; extensions?: string[] }>;

const LEGITIMATE_EXTENSIONS = Object.values(mimeDB as MimeDb)
  .flatMap((mime) => mime.extensions || [])
  .map((ext) => ext.toLocaleLowerCase());

export const getFileExtension = (fileUrl: string, fileType: string): string => {
  if (urlCanParse(fileUrl)) {
    const url = new URL(fileUrl);
    const urlFileName = url.pathname.split('/').pop();
    const split = urlFileName?.split('.');
    const extension = split?.length && split.length > 1 ? split.pop() : '';
    if (extension && LEGITIMATE_EXTENSIONS.includes(extension.toLocaleLowerCase())) {
      return extension;
    }

    if (url.hostname.includes('cloudinary') || url.hostname.includes('media.weavy.ai')) {
      return url.pathname.includes('/image/') ? 'png' : 'mp4';
    }
  } else {
    const split = fileUrl.toLowerCase().split('.');
    const extension = split?.length && split.length > 1 ? split.pop()?.split('?')[0] : '';
    if (extension && LEGITIMATE_EXTENSIONS.includes(extension.toLocaleLowerCase())) {
      return extension;
    }
  }

  if (fileType) {
    switch (fileType) {
      case 'image':
        return 'png';
      case 'video':
        return 'mp4';
      default:
        return '';
    }
  }

  return '';
};

export const getRecipeIdFromPath = (path: string) => (path.startsWith('/flow/') ? path.split('/')[2] : undefined);
