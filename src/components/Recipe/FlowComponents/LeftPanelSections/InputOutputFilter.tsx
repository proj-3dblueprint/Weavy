import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexCenVer } from '@/UI/styles';
import { MultiSelect } from '@/UI/MultiSelect/MultiSelect';
import { Tag } from '@/UI/Tag/Tag';
import { color } from '@/colors';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { I18N_KEYS } from '@/language/keys';
import { HandleType } from '@/enums/handle-type.enum';
import { getHandleColor } from '@/components/Nodes/DynamicNode/HandlesUtils';
import { SelectedType } from '../Editor/InputSelect/InputSelectComponent';

const optionsToShow: HandleType[] = [
  HandleType.Text,
  HandleType.Image,
  HandleType.Video,
  HandleType.ThreeDee,
  HandleType.Mask,
  HandleType.Audio,
  HandleType.Lora,
];

export const InputOutputFilter = () => {
  const { filters, setInputTypes, setOutputTypes } = useNodeFiltersStore();
  const { t } = useTranslation();

  const inputTypeOptions = useMemo(() => {
    return optionsToShow.map((inputType) => ({
      id: inputType,
      value: inputType,
      label: <Tag text={inputType} textColor={color.Black92} bgColor={getHandleColor(inputType)} variant="large" />,
    }));
  }, []);

  const onRemoveInput = (type: HandleType) => setInputTypes(filters.inputTypes.filter((t) => t !== type));

  const onRemoveOutput = (type: HandleType) => setOutputTypes(filters.outputTypes.filter((t) => t !== type));

  return (
    <FlexCenVer sx={{ gap: 1, width: '100%', flexWrap: 'wrap' }}>
      <FlexCenVer sx={{ gap: 1 }}>
        <Typography variant="body-sm-rg">{t(I18N_KEYS.GENERAL.FROM)}</Typography>
        <MultiSelect
          onChange={(value) => setInputTypes([...value])}
          optionSx={{ padding: 0.5 }}
          options={inputTypeOptions}
          value={filters.inputTypes}
          size="small"
          placement="bottom-start"
          renderLabel={(triggerOptions) => (
            <SelectedType
              {...triggerOptions}
              onRemove={onRemoveInput}
              mode="input"
              selectedTypes={filters.inputTypes}
            />
          )}
        />
      </FlexCenVer>
      <FlexCenVer sx={{ gap: 1 }}>
        <Typography variant="body-sm-rg">{t(I18N_KEYS.GENERAL.TO)}</Typography>
        <MultiSelect
          onChange={(value) => setOutputTypes([...value])}
          optionSx={{ padding: 0.5 }}
          options={inputTypeOptions}
          value={filters.outputTypes}
          size="small"
          placement="bottom-start"
          renderLabel={(triggerOptions) => (
            <SelectedType
              {...triggerOptions}
              onRemove={onRemoveOutput}
              mode="output"
              selectedTypes={filters.outputTypes}
            />
          )}
        />
      </FlexCenVer>
    </FlexCenVer>
  );
};
