import { useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { MultiLoRACoreData } from '@/types/node';
import LoRA from './MultiLoRA/LoRA';

const minWeight = 0.0;
const maxWeight = 4.0;
const stepWeight = 0.01;

interface MultiLoRACorePropertiesProps {
  id: string;
  data: MultiLoRACoreData;
  updateNodeData: (id: string, data: Partial<MultiLoRACoreData>) => void;
}

function MultiLoRACoreProperties({ id, data, updateNodeData }: MultiLoRACorePropertiesProps) {
  const { t } = useTranslation();

  const { handles, isLocked, selectedLora, weight = 0, loras = [] } = data;

  const updateSelectedLora = useCallback(
    (newValue) => {
      updateNodeData(id, {
        selectedLora: newValue,
      });
    },
    [id, updateNodeData],
  );

  const updateLoras = useCallback(
    (newLoras) => {
      updateNodeData(id, {
        loras: newLoras,
      });
    },
    [id, updateNodeData],
  );

  useEffect(() => {
    if (selectedLora) {
      const updatedSelectedLora = loras.find((l) => l.id === selectedLora.id);
      if (updatedSelectedLora && JSON.stringify(updatedSelectedLora) !== JSON.stringify(selectedLora)) {
        updateSelectedLora(updatedSelectedLora);
      }
    }
  }, [selectedLora, loras, updateSelectedLora]);

  const updateLora = (lora) => {
    const updatedLoras = loras.map((l) => (l.id === lora.id ? lora : l));
    updateLoras(updatedLoras);
  };

  useEffect(() => {
    updateNodeData(id, {
      minWeight,
      maxWeight,
      stepWeight,
      output: {
        type: 'lora',
        [handles?.output?.[0]]: selectedLora ? `weavy-lora::${selectedLora.file}` : '',
        [handles?.output?.[1]]: weight,
      },
    });
  }, [handles.output, id, selectedLora, updateNodeData, weight]);

  const handleItemAdd = () => {
    updateLoras([
      ...loras,
      {
        id: uuidv4(),
        file: '',
        name: 'Untitled',
        coverImage: '',
        trigger: '',
        defaultWeight: 0.5,
      },
    ]);
  };

  const deleteLora = (loraId) => {
    const updatedLoras = loras.filter((lora) => lora.id !== loraId);

    // Check if the currently selected lora is being deleted
    const isDeletingSelectedLora = selectedLora?.id === loraId;

    let newSelectedLora = selectedLora;
    if (isDeletingSelectedLora) {
      newSelectedLora = updatedLoras.length > 0 ? updatedLoras[0] : null;
    }

    updateLoras(updatedLoras);
    updateSelectedLora(newSelectedLora);
  };

  return (
    <>
      <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
        {t(I18N_KEYS.RECIPE_MAIN.NODES.MULTI_LORA.LORAS)}
      </Typography>
      {loras.length > 0 &&
        loras.map((lora) => (
          <LoRA
            key={lora.id}
            lora={lora}
            updateLora={updateLora}
            deleteLora={deleteLora}
            setSelectedLora={updateSelectedLora}
            container="drawer"
          />
        ))}

      <Box sx={{ mt: 1 }}>
        <ButtonContained
          mode="text"
          size="small"
          onClick={handleItemAdd}
          sx={{ pointerEvents: isLocked ? 'none' : '' }}
        >
          {t(I18N_KEYS.RECIPE_MAIN.NODES.MULTI_LORA.ADD_LORA)}
        </ButtonContained>
      </Box>
    </>
  );
}

export default MultiLoRACoreProperties;
