import { NodeId } from 'web';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { ToggleData } from '@/types/node';
import { AppSwitch } from '@/UI/AppSwitch/AppSwitch';
import { FlexCenHorVer } from '@/UI/styles';
import { useToggleView } from '@/components/Recipe/FlowContext';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { hasEditingPermissions } from '../Utils';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';

export const ToggleNode = ({ id, data }: { id: NodeId; data: ToggleData }) => {
  const role = useUserWorkflowRole();
  const { t } = useTranslation();
  const toggleView = useToggleView(id);

  return (
    <DynamicNode2 id={id} data={data} className="boolean" size="small" outputHandleYPos="31px">
      <FlexCenHorVer
        sx={{
          width: '100%',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
        }}
      >
        <Typography variant="body-std-rg" sx={{ color: data.value === false ? color.White100 : color.White16_T }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.TOGGLE.FALSE)}
        </Typography>
        <AppSwitch checked={data.value} onChange={() => void toggleView.setToggle(!data.value, false)} />
        <Typography variant="body-std-rg" sx={{ color: data.value === true ? color.White100 : color.White16_T }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.TOGGLE.TRUE)}
        </Typography>
      </FlexCenHorVer>
    </DynamicNode2>
  );
};
