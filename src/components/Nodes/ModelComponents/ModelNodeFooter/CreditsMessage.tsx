import { Link, Typography } from '@mui/material';
import { useContext, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { CreditsContext } from '@/services/CreditsContext';
import useWorkspacesStore from '@/state/workspaces.state';
import { WorkspaceRole } from '@/types/auth.types';
import { SubscriptionType } from '@/types/shared';
import { WarningCircleIcon } from '@/UI/Icons';
import { FlexCenHorVer, FlexColCenVer } from '@/UI/styles';

export const CreditsMessage = ({ notEnoughCredits, canEdit }: { notEnoughCredits: boolean; canEdit: boolean }) => {
  const { t } = useTranslation();
  const { subscriptionType, handleGetMoreCreditsClick } = useContext(CreditsContext);
  const workspaceRole = useWorkspacesStore((state) => state.activeWorkspace.role);
  const key = useMemo(() => {
    if (subscriptionType === SubscriptionType.Team || subscriptionType === SubscriptionType.Enterprise) {
      if (workspaceRole === WorkspaceRole.Admin) {
        return I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.CREDITS_MESSAGE
          .TEAM_ENTERPRISE_ADMIN_MESSAGE;
      }
      return I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.CREDITS_MESSAGE
        .TEAM_ENTERPRISE_MEMBER_MESSAGE;
    } else if (subscriptionType === SubscriptionType.Starter || subscriptionType === SubscriptionType.Pro) {
      return I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.CREDITS_MESSAGE.STARTER_PRO_MESSAGE;
    }
    return I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.CREDITS_MESSAGE.FREE_TIER_MESSAGE;
  }, [subscriptionType, workspaceRole]);
  if (!notEnoughCredits || !canEdit) return null;
  return (
    <FlexCenHorVer sx={{ gap: 1 }}>
      <WarningCircleIcon />
      <FlexColCenVer sx={{ alignItems: 'flex-start' }}>
        <Typography variant="body-sm-rg" color={color.Weavy_Error}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.CREDITS_MESSAGE.LOW_CREDITS_MESSAGE)}
        </Typography>
        <Typography variant="body-sm-rg" color={color.Weavy_Error}>
          <Trans i18nKey={key} components={{ link: <Link onClick={handleGetMoreCreditsClick} /> }} />
        </Typography>
      </FlexColCenVer>
    </FlexCenHorVer>
  );
};
