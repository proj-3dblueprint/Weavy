import type { UploadedAsset } from '@/types/api/assets';

export const copyImage = async (file: UploadedAsset) => {
  if (file?.type === 'image' && 'url' in file) {
    let url = file.url;

    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Replace the extension (anything after the last dot) with `.png`
    parsed.pathname = pathname.replace(/\.[^/.]+$/, '.png');

    url = parsed.toString();

    const makeImagePromise = async () => {
      const response = await fetch(url);
      return await response.blob();
    };

    const clipboardItem = new ClipboardItem({
      'image/png': makeImagePromise(),
    });

    await navigator.clipboard.write([clipboardItem]);
  }
};

export const getResultId = (publicId: string) => publicId.substring(publicId.indexOf('/') + 1);
