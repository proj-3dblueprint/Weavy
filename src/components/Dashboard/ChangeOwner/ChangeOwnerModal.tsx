import { useState, useEffect, useCallback } from 'react';
import { Modal, Typography, CircularProgress, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';
import { color, EL_COLORS } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { Dropdown } from '@/UI/Dropdown/Dropdown';
import { useUserStore } from '@/state/user.state';
import { useGlobalStore } from '@/state/global.state';
import { WarningCircleIcon } from '@/UI/Icons/WarningCircleIcon';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import { useDashboardRecipes } from '../useDashboardRecipes';

const logger = log.getLogger('ChangeOwnerModal');
const axiosInstance = getAxiosInstance();

type TeamMember = {
  id: string;
  name: string;
  email: string;
};
interface ChangeOwnerModalProps {
  open: boolean;
  onClose: () => void;
  recipeId: string | null;
}

const ChangeOwnerModal = ({ open, onClose, recipeId }: ChangeOwnerModalProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const currentUser = useUserStore((state) => state.user);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [isLoadingChangeOwner, setIsLoadingChangeOwner] = useState(false);

  const { changeOwner } = useDashboardRecipes();
  const { updateSnackbarData } = useGlobalStore();
  const { track } = useAnalytics();
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleChangeOwner = useCallback(
    (option: { id: string }) => {
      setSelectedMember(teamMembers.find((member) => member.id === option.id) || null);
    },
    [teamMembers],
  );

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        if (!currentUser?.uid) return;
        setIsLoadingTeamMembers(true);
        const res = await axiosInstance.get(`/v1/workspaces`);
        setTeamMembers(
          [
            ...(res.data?.members.filter((member) => member.status === 'active' && member.id !== currentUser?.uid) ||
              []),
          ].sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch (e) {
        logger.error('Error fetching team members', e);
      } finally {
        setIsLoadingTeamMembers(false);
      }
    };
    void fetchTeamMembers();
  }, [currentUser?.uid]);

  const handleConfirmChangeOwner = useCallback(async () => {
    if (!recipeId || !selectedMember?.id) return;
    setIsLoadingChangeOwner(true);
    try {
      await changeOwner(recipeId, selectedMember.id, selectedMember.name || selectedMember.email);
      track(TrackTypeEnum.BI, {
        event: 'Recipe Owner Changed',
      });
      updateSnackbarData({
        text: t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.SUCCESS_SNACKBAR),
        isOpen: true,
        icon: <CheckMarkCircleIcon width={20} height={20} />,
      });
      handleClose();
    } catch (e) {
      logger.error('Error changing owner', e);
      updateSnackbarData({
        text: t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.ERROR_SNACKBAR),
        isOpen: true,
        icon: null,
        severity: 'error',
      });
    } finally {
      setIsLoadingChangeOwner(false);
    }
  }, [recipeId, selectedMember, changeOwner, track, updateSnackbarData, t, handleClose]);

  return (
    <Modal
      data-testid="share-workflow-modal"
      open={open}
      onClose={handleClose}
      aria-labelledby="share-design-app-modal"
    >
      <FlexCol
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          background: color.Black92,
          border: `1px solid ${EL_COLORS.BoxBorder}`,
          p: 3,
          pt: 6,
          borderRadius: 2,
        }}
      >
        <AppIconButton onClick={handleClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <XIcon width={20} height={20} />
        </AppIconButton>
        <Typography variant="body-lg-sb" sx={{ mb: 1 }}>
          {t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.TITLE)}
        </Typography>
        <Typography variant="body-std-rg" sx={{ mb: 4 }}>
          {t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.SUBTITLE)}
        </Typography>
        <FlexCenVer sx={{ gap: 2, mb: 4 }}>
          <Typography variant="body-sm-rg" sx={{ width: 'fit-content' }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.SELECT_OWNER)}
          </Typography>
          {isLoadingTeamMembers ? (
            <Skeleton variant="text" width={280} height={32} />
          ) : (
            <Dropdown
              sx={{
                height: '24px',
              }}
              width="280px"
              options={teamMembers.map((member) => ({
                label: member.name || member.email,
                value: member.id,
                id: member.id,
              }))}
              value={selectedMember?.id}
              onChange={handleChangeOwner}
            />
          )}
        </FlexCenVer>
        <FlexCenVer sx={{ gap: 1, background: color.White04_T, px: 1.5, py: 1, borderRadius: 1, mb: 4 }}>
          <WarningCircleIcon width={14} height={14} color={color.White64_T} />
          <Typography variant="body-sm-rg" sx={{ color: color.White64_T }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.WARNING)}
          </Typography>
        </FlexCenVer>
        <Flex sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <ButtonContained mode="text" onClick={handleClose} size="medium" sx={{ px: 2 }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.CANCEL)}
          </ButtonContained>
          <ButtonContained
            mode="filled-light"
            onClick={() => {
              void handleConfirmChangeOwner();
            }}
            disabled={teamMembers.length === 0 || !selectedMember}
            endIcon={isLoadingChangeOwner ? <CircularProgress color="inherit" size={16} /> : null}
            sx={{ px: 2 }}
            size="medium"
          >
            {isLoadingChangeOwner
              ? t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.CONFIRM_LOADING)
              : t(I18N_KEYS.MAIN_DASHBOARD.CHANGE_OWNER_MODAL.CONFIRM)}
          </ButtonContained>
        </Flex>
      </FlexCol>
    </Modal>
  );
};

export default ChangeOwnerModal;
