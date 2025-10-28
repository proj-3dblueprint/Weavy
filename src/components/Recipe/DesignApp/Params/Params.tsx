import React, { useMemo, useState } from 'react';
import { Typography, Box, Tooltip, Popover, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { renderDesignAppParams } from '../DesignAppUtils';

type InputParamProps = {
  param: { id: string; exposed: boolean };
  node: { data: { description: string; name: string } };
  handleChange: (id: string, value: unknown) => void;
  handleExposeParam: (id: string, value: boolean) => void;
  isEditMode: boolean;
};

const InputParam = ({ param, node, handleChange, handleExposeParam, isEditMode }: InputParamProps) => {
  const { t: translate } = useTranslation();

  const toggleExpose = () => {
    handleExposeParam(param.id, !param.exposed);
  };

  return (
    <Box
      key={`param-${param.id}`}
      sx={{ width: '100%', mb: 2, p: 1, '&:hover .design-app-param-link': { opacity: 1 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
          <Typography variant="body-sm-rg" sx={{ mr: 0.5 }}>
            {node.data.name}
          </Typography>
          {node.data.description && (
            <Tooltip title={node.data.description} sx={{ fontSize: '10px' }}>
              <HelpOutlineIcon fontSize="inherit" />
            </Tooltip>
          )}
        </Box>
        {isEditMode ? (
          <Link
            className="design-app-param-link"
            onClick={toggleExpose}
            variant="body-sm-rg"
            underline="none"
            sx={{
              opacity: 0,
              transition: 'opacity 0.3s ease',
              padding: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              borderRadius: 1,
            }}
          >
            <i className="fa-light fa-arrow-left-to-arc"></i>
            {translate(I18N_KEYS.SHARED_DESIGN_APP.INPUTS.PARAMS_DRAWER.SET_AS_INPUT)}
          </Link>
        ) : null}
      </Box>
      {renderDesignAppParams({
        node,
        param,
        handleChange,
        translate,
        isLoading: false,
        validationProps: {},
        disabled: false,
      })}
    </Box>
  );
};

type ParamsProps = {
  concealedInputs: { id: string; exposed: boolean }[];
  nodes: { id: string; data: { description: string; name: string } }[];
  isEditMode?: boolean;
  leftPanelWidth: string;
  handleChange: (id: string, value: unknown) => void;
  handleExposeParam: (id: string, value: boolean) => void;
};

const Params = ({
  concealedInputs,
  nodes,
  isEditMode = false,
  leftPanelWidth,
  handleChange,
  handleExposeParam,
}: ParamsProps) => {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = (e: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(e.currentTarget);
    setSettingsOpen((current) => !current);
  };

  const inputNodes = useMemo(
    () =>
      concealedInputs
        .map((input) => {
          const matchingNode = nodes.find((node) => node.id === input.id);
          if (!matchingNode) {
            return null;
          }
          return {
            param: input,
            node: matchingNode,
          };
        })
        .filter((inputNode) => inputNode !== null),
    [concealedInputs, nodes],
  );

  return (
    <Box>
      <AppIconButton
        onClick={openSettings}
        disabled={inputNodes.length === 0}
        sx={{
          width: 72,
          height: '100%',
          bgcolor: color.Yambo_White_BG,
          color: color.Black100,
          '&:hover': { bgcolor: color.Yambo_White_BG, color: color.Black100 },
        }}
      >
        <i className="fa-light fa-sliders" style={{ fontSize: '16px' }}></i>
      </AppIconButton>
      <Popover
        id="settings-popover"
        open={settingsOpen && inputNodes.length > 0}
        anchorEl={settingsAnchorEl}
        onClose={() => setSettingsOpen(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              background: color.Black100,
              border: `1px solid ${color.White64_T}`,
              maxHeight: '80vh',
              maxWidth: '480px',
              overflowY: 'auto',
              width: `calc(${leftPanelWidth.replace('%', 'vw')} - 48px)`,
            },
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          {inputNodes.map(({ param, node }) => (
            <InputParam
              key={param.id}
              param={param}
              node={node}
              handleChange={handleChange}
              isEditMode={isEditMode}
              handleExposeParam={handleExposeParam}
            />
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default Params;
