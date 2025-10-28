import { useState } from 'react';
import { Box } from '@mui/material';
import { motion } from 'motion/react';
import { ImageSize } from 'web';
import { Dropdown, Option } from '@/UI/Dropdown/Dropdown';
import { FlexCenVer } from '@/UI/styles';
import { NumberInput } from '@/components/Recipe/FlowComponents/Editor/Designer/LayerPropertyPanel/NumberInput';
import { LockAspectRatioButton } from '@/components/Common/LockAspectRatioButton';
import { useIsHovered } from '@/hooks/useIsHovered';

interface ImageSizeInputProps {
  value: ImageSize;
  onChange: (value: ImageSize) => void;
  options: string[];
  disabled?: boolean;
}

export const ImageSizeInput = ({ value, onChange, options, disabled }: ImageSizeInputProps) => {
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState<boolean>(true);
  const { isHovered: isHovering, ...elementProps } = useIsHovered();

  const handleDropdownChange = (option: Option<string>) => {
    const newValue = option.value;
    onChange(
      newValue === 'Default' ? { type: 'custom', width: 1024, height: 1024 } : { type: 'built_in', value: newValue },
    );
  };

  const handleWidthChange = (newWidth: number) => {
    if (value.type === 'custom') {
      const finalWidth = Math.max(newWidth, 1);
      const finalHeight = isAspectRatioLocked ? Math.round((finalWidth / value.width) * value.height) : value.height;
      onChange({ type: 'custom', width: finalWidth, height: finalHeight });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (value.type === 'custom') {
      const finalHeight = Math.max(newHeight, 1);
      const finalWidth = isAspectRatioLocked ? Math.round((finalHeight / value.height) * value.width) : value.width;
      onChange({ type: 'custom', width: finalWidth, height: finalHeight });
    }
  };

  const dropdownOptions: Option<string>[] = [
    {
      id: 'match_input',
      label: 'Match Input Image',
      value: 'match_input',
    },
    ...options.map((option) => ({
      id: option,
      label: option === 'Default' ? 'Custom' : option.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: option,
    })),
  ];

  return (
    <Box data-testid="fal-image-size-input" sx={{ width: '100%' }}>
      <Dropdown
        width="100%"
        matchTriggerWidth
        value={value.type === 'custom' ? 'Default' : value.value}
        disabled={disabled}
        onChange={handleDropdownChange}
        options={dropdownOptions}
        size="large"
      />
      {value.type === 'custom' && (
        <FlexCenVer sx={{ gap: 1, mt: 1 }} {...elementProps}>
          <NumberInput
            value={value.width}
            onSubmit={handleWidthChange}
            disabled={disabled ?? false}
            prefix="W"
            decimals={0}
          />
          <NumberInput
            value={value.height}
            onSubmit={handleHeightChange}
            disabled={disabled ?? false}
            prefix="H"
            decimals={0}
          />
          <motion.div animate={{ opacity: isHovering || isAspectRatioLocked ? 1 : 0 }}>
            <LockAspectRatioButton isLocked={isAspectRatioLocked} onChange={setIsAspectRatioLocked} />
          </motion.div>
        </FlexCenVer>
      )}
    </Box>
  );
};
