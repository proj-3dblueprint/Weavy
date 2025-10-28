import { getAxiosInstance } from '@/services/axiosConfig';
import { log } from '@/logger/logger';

const axiosInstance = getAxiosInstance();
const logger = log.getLogger('loraUploadUtils');

export type PresignResponse = {
  url: string; // pre-signed PUT url
  loraId: string; // <timestamp>-<filename>
};

/**
 * Get a presigned URL for uploading a LoRA file
 */
export const getPresignedUrl = async (fileName: string): Promise<PresignResponse> => {
  const res = await axiosInstance.post(`/v1/assets/loras/presign-url`, {
    fileName,
  });
  return res.data;
};

/**
 * Update LoRA metadata (trigger word)
 */
export const updateLoraMetadata = async (loraId: string, trigger: string): Promise<void> => {
  try {
    await axiosInstance.patch(`/v1/assets/loras/${encodeURIComponent(loraId)}/metadata`, {
      trigger,
    });
  } catch (error) {
    logger.error('Failed to update LoRA metadata', error);
    throw error;
  }
};

/**
 * Upload a LoRA file using presigned URL
 */
export const uploadLoraUsingPreSignedUrl = async (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const { url, loraId } = await getPresignedUrl(file.name);

  await axiosInstance.put(url, file, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    transformRequest: [
      (data, headers) => {
        delete (headers as any).Authorization;
        return data;
      },
    ],
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    },
  });

  return loraId;
};
