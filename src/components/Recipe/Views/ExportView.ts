import { format } from 'date-fns';
import { FileKind, NodeId } from 'web';
import { getFileExtension } from '@/utils/urls';
import { downloadFile } from '@/components/Nodes/Utils';
import { getAxiosInstance } from '@/services/axiosConfig';
import type { FlowGraph } from '../FlowGraph';

const axiosInstance = getAxiosInstance();

export class ExportView {
  constructor(
    private graph: FlowGraph,
    private id: NodeId,
  ) {}

  async exportFile(file: FileKind): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      const timestamp = format(now, "yyyy-MM-dd 'at' HH.mm.ss");
      let fileName = 'export';
      const extension = getFileExtension(file.url, file.type);
      fileName = `export-${timestamp}${extension ? `.${extension}` : ''}`;

      await downloadFile(file.url, fileName, file.type);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export file';
      return { success: false, error: errorMessage };
    }
  }

  async exportVideo(recipeId: string, nodeId: NodeId, outputId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = format(new Date(), "yyyy-MM-dd 'at' HH.mm.ss");
      const suggestedName = `export-${timestamp}.mp4`;

      const res = await axiosInstance.get<Blob>(`/v1/recipes/${recipeId}/nodes/${nodeId}/${outputId}/download-video`, {
        responseType: 'blob',
        'axios-retry': { retries: 0 },
      });

      const blobUrl = URL.createObjectURL(res.data);
      try {
        await downloadFile(blobUrl, suggestedName, 'video');
        return { success: true };
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      const errorMessage = 'Failed to export video. If this problem persists, please contact support.';
      return { success: false, error: errorMessage };
    }
  }
}
