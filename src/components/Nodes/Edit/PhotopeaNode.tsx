import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { hasEditingPermissions } from '@/components/Nodes/Utils';
import { DynamicNode2 } from '@/components/Nodes/DynamicNode/DynamicNode2';
import { Flex } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { I18N_KEYS } from '@/language/keys';
import GalleryGradientOverlay from '@/components/Common/GalleryGradientOverlay';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { PencilLineIcon } from '@/UI/Icons/PencilLineIcon';
import { urlCanParse } from '@/utils/urls';
import NodeDetailsAccordion from '../Shared/NodeDetailsAccordion';
import type { BaseNodeData } from '@/types/node';
import type { MediaAsset } from '@/types/api/assets';

const TRANSITION_DURATION = '0.1s';

interface PhotopeaFile extends MediaAsset {
  originalUrl?: string;
  original?: string;
}

interface PhotopeaNodeData extends BaseNodeData {
  input: {
    file: PhotopeaFile;
  };
  result: Partial<PhotopeaFile>;
}

interface PhotopeaNodeContentProps {
  id: string;
  data: PhotopeaNodeData;
  openEditWindow: () => void;
  isSelected?: boolean;
  fileSrc: PhotopeaFile | undefined;
  fileOutput: Partial<PhotopeaFile> | undefined;
}

function PhotopeaNodeContent({ id, data, openEditWindow, isSelected, fileSrc, fileOutput }: PhotopeaNodeContentProps) {
  const { t } = useTranslation();

  const role = useUserWorkflowRole();

  return (
    <>
      <Box sx={{ mt: 0, position: 'relative', height: fileSrc ? undefined : '430px' }} className="media-container-dark">
        {fileSrc ? (
          <>
            <img
              src={fileOutput?.thumbnailUrl || fileSrc?.url || ''}
              draggable="false"
              width="100%"
              style={{ display: 'block' }}
            />

            <GalleryGradientOverlay isSelected={isSelected} />
          </>
        ) : null}
      </Box>
      <Box
        data-testid={`open-compositor-edit-button-container-${id}`}
        sx={{
          opacity: isSelected ? 1 : 0,
          transition: `all ${TRANSITION_DURATION} ease-in-out`,
          pointerEvents: isSelected ? 'auto' : 'none',
          cursor: isSelected ? 'auto' : 'default',
          mt: 2,
        }}
      >
        <Flex sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box data-testid="compositor-details-container">
            <NodeDetailsAccordion description={data.description || data.name} />
          </Box>
          <ButtonContained
            disabled={!hasEditingPermissions(role, data) || !fileSrc}
            mode="outlined"
            onClick={openEditWindow}
            sx={{ height: '36px' }}
            startIcon={<PencilLineIcon height="16px" width="16px" />}
          >
            {t(I18N_KEYS.RECIPE_MAIN.NODES.COMPOSITOR.EDIT_CTA)}
          </ButtonContained>
        </Flex>
      </Box>
    </>
  );
}

interface PhotopeaNodeProps {
  id: string;
  data: PhotopeaNodeData;
  updateNodeData: (id: string, data: Partial<PhotopeaNodeData>) => void;
  openEditWindow: (id: string) => void;
}

function PhotopeaNode({ id, data, updateNodeData, openEditWindow }: PhotopeaNodeProps) {
  const { input, result } = data;
  const [fileSrc, setFileSrc] = useState<PhotopeaFile | undefined>(input?.file);
  const [fileOutput, setFileOutput] = useState<Partial<PhotopeaFile> | undefined>(result);

  useEffect(() => {
    setFileOutput(result);
  }, [result]);

  //handle connection / disconnection
  useEffect(() => {
    if (input && input['file']) {
      setFileSrc(input['file']);
      const formattedOutput = {};
      formattedOutput['result'] = input['file'];
      updateNodeData(id, { result: fileOutput, output: formattedOutput });
    } else {
      setFileSrc(undefined);
      setFileOutput(undefined);
      updateNodeData(id, {
        result: {},
        output: {
          ['result']: null,
        },
      });
    }
  }, [input]);

  useEffect(() => {
    if (fileOutput && Object.keys(fileOutput).length > 0) {
      const originalUrl = fileOutput?.originalUrl || fileOutput?.original;
      if (!originalUrl || !urlCanParse(originalUrl)) return;

      const formattedOutput = {};
      // remove search params from the url due to Bria register issue
      const urlObj = new URL(originalUrl); // 9.8.24 fileOutput?.original for backward compatibility before exposing and renaming file properties
      urlObj.search = '';
      const cleanUrl = urlObj.toString();
      const output = {
        //  type:'image',
        url: cleanUrl,
        publicId: fileOutput.publicId,
        type: fileOutput.type,
        width: fileOutput.width,
        height: fileOutput.height,
        visualId: fileOutput.visualId,
      };
      formattedOutput['result'] = output;
      updateNodeData(id, { result: fileOutput, output: formattedOutput });
    }
  }, [fileOutput]);

  /// UI
  const handleOpenEditWindow = useCallback(() => {
    openEditWindow(id);
  }, [openEditWindow, id]);

  return (
    <DynamicNode2 id={id} data={data}>
      <PhotopeaNodeContent
        id={id}
        data={data}
        openEditWindow={handleOpenEditWindow}
        fileSrc={fileSrc}
        fileOutput={fileOutput}
      />
    </DynamicNode2>
  );
}

export default PhotopeaNode;
