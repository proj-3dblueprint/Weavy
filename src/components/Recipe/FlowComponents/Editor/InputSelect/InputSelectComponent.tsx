import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Tag } from '@/UI/Tag/Tag';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';
import { I18N_KEYS } from '@/language/keys';
import { XIcon } from '@/UI/Icons/XIcon';
import { FlexCenVer } from '@/UI/styles';
import { getHandleColor } from '@/components/Nodes/DynamicNode/HandlesUtils';
import type { RefObject } from 'react';
import type { HandleType } from '@/enums/handle-type.enum';
import type { TriggerOptions } from '@/UI/BaseSelect/selectUtils';

interface SelectedTypeProps extends TriggerOptions {
  selectedTypes: HandleType[];
  mode: 'input' | 'output';
  onRemove: (type: HandleType) => void;
}

const SelectedTag = ({ type, onRemove }: { type: HandleType; onRemove: (type: HandleType) => void }) => {
  const { isHovered, ...hoverProps } = useIsHovered();
  return (
    <Tag
      bgColor={getHandleColor(type)}
      text={type}
      textColor={color.Black92}
      transition={{ type: 'spring' }}
      variant="large"
      {...hoverProps}
      endIcon={
        <motion.div
          initial={{ width: '0', opacity: 0, marginLeft: '-4px' }}
          style={{ display: 'flex', height: '12px', width: '12px' }}
          animate={{
            width: isHovered ? 'auto' : '0',
            opacity: isHovered ? 1 : 0,
            marginLeft: isHovered ? '0' : '-4px',
          }}
        >
          <XIcon
            style={{ width: '12px', height: '12px', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(type);
            }}
          />
        </motion.div>
      }
    />
  );
};

export const SelectedType = ({ selectedTypes, mode, onRemove, isOpen, triggerRef, toggleOpen }: SelectedTypeProps) => {
  const { t } = useTranslation();
  const { isHovered, ...hoverProps } = useIsHovered();
  return (
    <FlexCenVer
      sx={{
        gap: 0.5,
        width: 'fit-content',
        cursor: 'pointer',
        flexWrap: 'wrap',
      }}
      ref={triggerRef as RefObject<HTMLDivElement>}
      onClick={toggleOpen}
      {...hoverProps}
    >
      {selectedTypes.length > 0 ? (
        selectedTypes.map((type) => <SelectedTag key={type} type={type} onRemove={onRemove} />)
      ) : (
        <Tag
          variant="large"
          text={mode === 'input' ? t(I18N_KEYS.GENERAL.INPUT) : t(I18N_KEYS.GENERAL.OUTPUT)}
          textColor={isHovered || isOpen ? color.White80_T : color.White40_T}
          bgColor={isHovered || isOpen ? color.Black84 : color.Black88}
          sx={{ cursor: 'pointer' }}
        />
      )}
    </FlexCenVer>
  );
};
