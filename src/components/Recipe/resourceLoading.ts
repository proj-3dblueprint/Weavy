import { Web } from 'web';
import { log } from '@/logger/logger.ts';

const logger = log.getLogger('Wasm');

// Generic loading state and cache management
const loadingPromises = new Map<string, Promise<unknown>>();

interface LoaderConfig<T> {
  loader: (url: string) => Promise<T>;
}

/**
 * Generic file loader with caching and promise deduplication
 */
async function loadFile<T>(url: string, config: LoaderConfig<T>): Promise<T> {
  const cacheKey = url;

  // Check if resource is currently being loaded
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey) as Promise<T>;
  }

  // Create new loading promise
  const loadingPromise = config
    .loader(url)
    .then((result) => {
      loadingPromises.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      loadingPromises.delete(cacheKey);
      throw error;
    });

  loadingPromises.set(cacheKey, loadingPromise);
  return loadingPromise;
}

// Specific loader implementations
function createImageLoader(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + url));
    img.src = url;
  });
}

function createVideoLoader(url: string): Promise<HTMLVideoElement> {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'Anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = false;

    video.onloadeddata = () => resolve(video);
    video.onerror = () =>
      reject(new Error('Failed to load video: ' + url + (video.error ? ': ' + video.error.message : '')));
    video.src = url;
  });
}

function createThreeDModelLoader(url: string): Promise<Uint8Array> {
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.bytes();
    })
    .catch((error) => {
      throw new Error('Failed to load 3D model: ' + url + (error.message ? ': ' + error.message : ''));
    });
}

function createFontLoader(resourceKey: string): Promise<Uint8Array> {
  const url = '/fonts/' + resourceKey;
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.bytes();
    })
    .catch((error) => {
      throw new Error('Failed to load font: ' + resourceKey + (error.message ? ': ' + error.message : ''));
    });
}

export async function loadResources(wasm: Web) {
  return Promise.all([
    loadImageResources(wasm),
    loadVideoResources(wasm),
    loadThreeDModelResources(wasm),
    loadFontResources(wasm),
  ]);
}

export async function loadImageResources(wasm: Web) {
  const imagesToLoad = wasm.imagesToLoad();

  await Promise.all(
    imagesToLoad.map(async (imageUrl) => {
      try {
        const img = await loadFile(imageUrl, {
          loader: createImageLoader,
        });
        wasm.addImageResource(imageUrl, img);
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Failed to load image resource: ' + imageUrl + ': ' + e.message, e);
        } else {
          logger.error('Failed to load image resource: ' + imageUrl);
        }
      }
    }),
  );
}

function hasVideoAudio(
  video: HTMLVideoElement & { mozHasAudio?: boolean; webkitAudioDecodedByteCount?: number; audioTracks?: unknown[] },
): boolean {
  return (
    video.mozHasAudio ||
    Boolean(video.webkitAudioDecodedByteCount) ||
    Boolean(video.audioTracks && video.audioTracks.length)
  );
}

export async function loadVideoResources(wasm: Web) {
  const urlsToLoad = wasm.videosToLoad();

  await Promise.all(
    urlsToLoad.map(async (url) => {
      try {
        const video = await loadFile(url, {
          loader: createVideoLoader,
        });
        const hasAudio = hasVideoAudio(video);
        wasm.addVideoResource(url, video, hasAudio);
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Failed to load video resource: ' + url + ': ' + e.message, e);
        } else {
          logger.error('Failed to load video resource: ' + url);
        }
      }
    }),
  );
}

export async function loadThreeDModelResources(wasm: Web) {
  const urlsToLoad = wasm.threeDModelsToLoad();

  await Promise.all(
    urlsToLoad.map(async (url) => {
      try {
        const modelBytes = await loadFile(url, {
          loader: createThreeDModelLoader,
        });
        wasm.addThreeDModelResource(url, modelBytes);
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Failed to load 3D model resource: ' + url + ': ' + e.message, e);
        } else {
          logger.error('Failed to load 3D model resource: ' + url);
        }
      }
    }),
  );
}

export async function loadFontResources(wasm: Web) {
  const resourceKeysToLoad = wasm.fontsToLoad();

  await Promise.all(
    resourceKeysToLoad.map(async (resourceKey) => {
      try {
        const fontBytes = await loadFile(resourceKey, {
          loader: createFontLoader,
        });
        wasm.addFontResource(resourceKey, fontBytes);
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Failed to load font resource: ' + resourceKey + ': ' + e.message, e);
        } else {
          logger.error('Failed to load font resource: ' + resourceKey);
        }
      }
    }),
  );
}
