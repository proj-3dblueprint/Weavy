import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { getIteratorValues } from '@/utils/iterator.utils';
import type { PrecedingIteratorData } from '@/hooks/usePrecedingIterators';

export const IteratorSection = ({
  iteratorsData,
  isOpen,
  itemWidth = '85px',
}: {
  iteratorsData: PrecedingIteratorData[] | null;
  isOpen: boolean;
  itemWidth?: string;
}) => {
  if (!iteratorsData || !isOpen) return null;
  return (
    <FlexCol style={{ width: '100%', gap: '4px' }}>
      {iteratorsData.map((iteratorData) => (
        <IteratorItem
          key={`${iteratorData.iteratorNode.id}-${iteratorData.inputKey}-${iteratorData.nodeId}`}
          iteratorData={iteratorData}
          itemWidth={itemWidth}
        />
      ))}
    </FlexCol>
  );
};

const IteratorItem = ({ iteratorData, itemWidth }: { iteratorData: PrecedingIteratorData; itemWidth?: string }) => {
  const { t } = useTranslation();
  const {
    iteratorNode: { data },
  } = iteratorData;
  const values = getIteratorValues(data);
  return (
    <FlexCenVer sx={{ width: '100%', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="body-sm-rg" color={color.White64_T}>
        {data.name}
      </Typography>
      <FlexCenVer
        sx={{ height: '24px', width: itemWidth, backgroundColor: color.White04_T, borderRadius: '4px', px: 1, py: 0.5 }}
      >
        <Typography variant="body-sm-rg">
          {t(I18N_KEYS.RECIPE_MAIN.FLOW.ITERATORS_SECTION.VALUES, { count: values.length })}
        </Typography>
      </FlexCenVer>
    </FlexCenVer>
  );
};
