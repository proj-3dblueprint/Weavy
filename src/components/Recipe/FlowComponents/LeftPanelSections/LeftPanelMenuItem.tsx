import React, { DragEvent, ReactNode, useCallback, useEffect } from 'react';
import { Box, SxProps, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { FlexColCenHorVer } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { ModelItem } from '@/state/nodes/nodes.types';
import { Tag } from '@/UI/Tag/Tag';
import { NodeDetails } from './NodeDetails';
import modelIconMap from './NodeIconMap';

type LeftPanelMenuItemProps = {
  item: ModelItem;
  onDragEnd: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, item: ModelItem) => void;
  disabled?: boolean;
  selected?: boolean;
};

export function LeftPanelMenuItem({
  item,
  onDragStart,
  onDragEnd,
  disabled = false,
  selected = false,
}: LeftPanelMenuItemProps) {
  const { t } = useTranslation();

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!disabled) {
        onDragStart(event, item);
      }
    },
    [disabled, item, onDragStart],
  );

  const handleDragEnd = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!disabled) {
        onDragEnd(event);
      }
    },
    [disabled, onDragEnd],
  );

  const getStyle = (): SxProps => {
    if (disabled) {
      return {
        borderRadius: 1,
        cursor: 'not-allowed',
        opacity: 0.25,
        pointerEvents: 'none',
      };
    }
    if (selected) {
      return {
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        '&:hover': {
          backgroundColor: color.Black84,
        },
      };
    }
    return {
      borderRadius: 1,
      '&:hover': {
        backgroundColor: color.Black84,
      },
    };
  };

  const renderIcon = () => {
    if (!item.icon) {
      return null;
    }

    const iconDisplay: string | ReactNode = modelIconMap[item.icon];
    if (typeof iconDisplay === 'string') {
      return <img src={iconDisplay} width="20px" />;
    }

    return (
      React.isValidElement(iconDisplay) &&
      React.cloneElement(iconDisplay, { width: 20, height: 20 } as React.SVGProps<SVGSVGElement>)
    );
  };

  useEffect(() => {
    if (selected) {
      const menuItem = document.getElementById(`left-panel-menu-item-${item.id}`);
      if (menuItem) {
        menuItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selected, item.id]);

  return (
    <Tooltip
      title={item?.description && <NodeDetails item={item} />}
      placement="right-start"
      enterDelay={800}
      enterNextDelay={800}
    >
      <Box
        id={`left-panel-menu-item-${item.id}`}
        sx={getStyle()}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable={!disabled}
      >
        <FlexColCenHorVer
          className={selected ? 'model-menu-item-glow' : ''}
          sx={{
            position: 'relative',
            border: '1px solid',
            borderColor: selected ? color.Black08 : color.White16_T,
            borderRadius: 1,
            py: 2,
            px: 0.5,
            cursor: 'grab',
            height: '100px',
            gap: 1,
          }}
        >
          {item.isNew && (
            <Tag
              sx={{ position: 'absolute', top: 4, right: 4, px: 0.5 }}
              text={t(I18N_KEYS.RECIPE_MAIN.FLOW.LEFT_PANEL.NEW_INDICATOR)}
              textColor={color.Yellow100}
              bgColor={color.Yellow16_T}
            />
          )}
          {renderIcon()}
          <Typography variant="body-sm-rg" sx={{ textAlign: 'center' }}>
            {item.displayName}
          </Typography>
        </FlexColCenHorVer>
      </Box>
    </Tooltip>
  );
}
