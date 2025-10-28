import { useEffect, useCallback, useMemo } from 'react';
import { Typography, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { Input } from '@/UI/Input/Input';
import { Dropdown } from '@/UI/Dropdown/Dropdown';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { MultiLoRACoreData } from '@/types/node';

const minWeight = 0.0;
const maxWeight = 4.0;
const stepWeight = 0.01;

interface MultiLoRACoreProps {
  id: string;
  data: MultiLoRACoreData;
  updateNodeData: (id: string, data: Partial<MultiLoRACoreData>) => void;
}

function MultiLoRACore({ id, data, updateNodeData }: MultiLoRACoreProps) {
  const { t } = useTranslation();

  const { handles, selectedLora, weight = 0, loras = [] } = data;

  const selectedLoraForUI = useMemo(() => {
    return loras.find((l) => l.id === selectedLora?.id);
  }, [loras, selectedLora]);

  const updateSelectedLora = useCallback(
    (newValue) => {
      updateNodeData(id, {
        selectedLora: newValue,
      });
    },
    [id, updateNodeData],
  );

  useEffect(() => {
    if (selectedLoraForUI) {
      const updatedSelectedLora = loras.find((l) => l.id === selectedLoraForUI.id);
      if (updatedSelectedLora && JSON.stringify(updatedSelectedLora) !== JSON.stringify(selectedLoraForUI)) {
        updateSelectedLora(updatedSelectedLora);
      }
    }
  }, [selectedLoraForUI, loras, updateSelectedLora]);

  useEffect(() => {
    updateNodeData(id, {
      minWeight: minWeight,
      maxWeight: maxWeight,
      stepWeight: stepWeight,
      output: {
        type: 'lora',
        [handles?.output?.[0]]: selectedLoraForUI ? `weavy-lora::${selectedLoraForUI.file}` : '',
        [handles?.output?.[1]]: weight,
      },
    });
  }, [handles.output, id, selectedLoraForUI, updateNodeData, weight]);

  // lora weights:
  const handleWeightChange = (newValue) => {
    let parsedValue = parseFloat(newValue);

    parsedValue = Math.min(Math.max(parsedValue, minWeight), maxWeight);

    updateNodeData(id, {
      weight: parsedValue,
    });
  };

  const options = useMemo(() => {
    return loras
      .filter((l) => l.file)
      .map((l) => ({
        id: l.id || l.url || '',
        label: l.name,
        value: l,
      }));
  }, [loras]);

  return (
    <FlexCol sx={{ gap: 1 }}>
      <FlexCenVer sx={{ gap: 1 }}>
        <Dropdown
          placement="bottom-start"
          size="large"
          i18nIsDynamicList
          emptyState={
            <Typography variant="body-sm-rg" sx={{ my: 1, display: 'block' }}>
              {t(I18N_KEYS.RECIPE_MAIN.NODES.MULTI_LORA.SELECT_LORA)}
            </Typography>
          }
          matchTriggerWidth
          noOptionsText={t(I18N_KEYS.RECIPE_MAIN.NODES.MULTI_LORA.NO_OPTIONS)}
          sx={{ width: '100%' }}
          options={options}
          value={selectedLoraForUI}
          onChange={(option) => {
            updateSelectedLora(option.value);
          }}
        />
      </FlexCenVer>
      <FlexCenVer>
        <Typography variant="body-sm-rg">{t(I18N_KEYS.GENERAL.LORA_WEIGHT)}</Typography>
        <Slider
          className="nodrag"
          size="small"
          value={weight}
          onChange={(event, newValue) => handleWeightChange(newValue)}
          aria-labelledby="weight-slider"
          max={maxWeight}
          min={minWeight}
          sx={{ ml: 2 }}
          step={stepWeight}
          valueLabelDisplay="auto"
        />
        <Input
          value={weight}
          size="small"
          onChange={(e) => handleWeightChange(e.target.value)}
          inputProps={{
            step: stepWeight,
            min: minWeight,
            max: maxWeight,
            type: 'number',
            'aria-labelledby': 'input-slider',
            style: {
              width: '50px',
              fontSize: '10px',
            },
          }}
          sx={{ ml: 2 }}
        />
      </FlexCenVer>
    </FlexCol>
  );
}

export default MultiLoRACore;
