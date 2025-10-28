import { useState, useEffect, useContext, useCallback } from 'react';
import { Modal, Box, Typography, Divider, Skeleton, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { orderBy } from 'lodash';
import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';
import { color, EL_COLORS } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { AuthContext } from '@/contexts/AuthContext';
import { RecipeVisibilityType } from '@/enums/recipe-visibility-type';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { User } from '@/types/auth.types';
import CopyBtnV2 from '@/components/Common/ImageList/CopyBtnV2';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { AppContextMenu } from '@/UI/AppContextMenu/AppContextMenu';
import { AppIconButton } from '@/UI/Buttons/AppIconButton';
import { XIcon } from '@/UI/Icons/XIcon';
import { useGlobalStore } from '@/state/global.state';
import { LockClosedIcon } from '@/UI/Icons/LockClosedIcon';
import { GlobeIcon } from '@/UI/Icons/GlobeIcon';
import { TeamIcon } from '@/UI/Icons/TeamIcon';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import ShareModalUser from './Share/ShareModalUser';
import EmailChipsInput from './Share/EmailChipsInputV2';

const logger = log.getLogger('ShareWorkflowModal');
const axiosInstance = getAxiosInstance();
const COUNTDOWN_VALUE_SECONDS = 2;

interface ShareWorkflowModalProps {
  open: boolean;
  onClose: () => void;
}

const ShareWorkflowModal = ({ open, onClose }: ShareWorkflowModalProps) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState({ value: '', isValid: false });
  const [users, setUsers] = useState<User[]>([]);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const role = useUserWorkflowRole();

  const { currentUser } = useContext(AuthContext);

  const { t } = useTranslation();
  const { updateSnackbarData } = useGlobalStore();
  const recipe = useWorkflowStore((state) => state.recipe);
  const updateRecipeVisibility = useWorkflowStore((state) => state.updateRecipeVisibility);
  const shareRecipe = useWorkflowStore((state) => state.shareRecipe);
  const deleteSharedUser = useWorkflowStore((state) => state.deleteSharedUser);
  useEffect(() => {
    if (!open || role !== 'editor') return;
    const getRecipeUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await axiosInstance.get<{ users: User[] }>(`/v1/recipes/${recipe.id}/users`);
        setUsers(response.data.users);
      } catch (e) {
        logger.error('Error getting recipe users.', e);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    void getRecipeUsers();
  }, [recipe.id, open, role]);

  const permissions = [
    {
      type: RecipeVisibilityType.Private,
      text: t(I18N_KEYS.SHARE_WORKFLOW_MODAL.LINK.RESTRICTED),
      icon: <LockClosedIcon width={16} height={16} />,
    },
    {
      type: RecipeVisibilityType.Team,
      text: t(I18N_KEYS.SHARE_WORKFLOW_MODAL.LINK.TEAM),
      icon: <TeamIcon width={16} height={16} />,
    },
    {
      type: RecipeVisibilityType.Public,
      text: t(I18N_KEYS.SHARE_WORKFLOW_MODAL.LINK.ANYONE),
      icon: <GlobeIcon width={16} height={16} />,
    },
  ];

  const [permissionsAnchorEl, setPermissionsAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPermission, setSelectedPermission] = useState(
    permissions.find((p) => p.type === recipe.visibility) || permissions[0],
  );

  const handlePermissionsClose = async (index?: number) => {
    if (typeof index === 'number') {
      setSelectedPermission(permissions[index]);
      const visibilityType = permissions[index].type;
      await updateRecipeVisibility(visibilityType);
    }
    setPermissionsAnchorEl(null);
  };

  const handleClose = useCallback(() => {
    setEmails([]);
    setCurrentInput({ value: '', isValid: false });
    setIsShareLoading(false);
    setIsLinkCopied(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (isLinkCopied) {
      let countdownValue = COUNTDOWN_VALUE_SECONDS;
      countdownInterval = setInterval(() => {
        countdownValue -= 0.1;
        if (countdownValue <= 0) {
          clearInterval(countdownInterval);
          handleClose();
        }
      }, 100);
    }

    return () => clearInterval(countdownInterval);
  }, [handleClose, isLinkCopied]);

  const handleShareSuccess = (newUsers: User[]) => {
    setEmails([]);
    setUsers([...users, ...newUsers]);
    updateSnackbarData({
      text: t(I18N_KEYS.SHARE_WORKFLOW_MODAL.SUCCESS_MESSAGE),
      isOpen: true,
      icon: <CheckMarkCircleIcon width={20} height={20} />,
    });
  };

  const handleShareSubmit = async () => {
    const emailsToShare = [...emails];
    if (currentInput.value.trim() && currentInput.isValid) {
      emailsToShare.push(currentInput.value.trim());
    }

    if (emailsToShare.length === 0) return;

    setIsShareLoading(true);

    try {
      const response = await shareRecipe(emailsToShare);
      handleShareSuccess(response.users);
    } catch (e) {
      logger.error('Error sharing file.', e);
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleInputChange = (value: string, isValid: boolean) => setCurrentInput({ value, isValid });

  const handleDeleteSharedUser = async (userId: string) => {
    setUsers(users.filter((user) => user.uid !== userId));
    try {
      await deleteSharedUser(userId);
    } catch (e) {
      logger.error('Error deleting shared user.', e);
    }
  };

  return (
    <>
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
            width: 500,
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
          <Typography variant="body-lg-sb" sx={{ mb: 3 }}>
            {t(I18N_KEYS.SHARE_WORKFLOW_MODAL.TITLE)}
          </Typography>
          <Flex sx={{ gap: 1, mb: 3 }}>
            <EmailChipsInput emails={emails} onSetEmails={setEmails} onInputChange={handleInputChange} inputW="300px" />
            <ButtonContained
              mode="filled-light"
              onClick={() => void handleShareSubmit()}
              disabled={emails.length === 0 && !currentInput.isValid}
              endIcon={isShareLoading ? <CircularProgress color="inherit" size={16} /> : null}
              sx={{ width: '100px', height: '32px' }}
              size="small"
            >
              {isShareLoading
                ? t(I18N_KEYS.SHARE_WORKFLOW_MODAL.SHARE_BUTTON_LOADING)
                : t(I18N_KEYS.SHARE_WORKFLOW_MODAL.SHARE_BUTTON)}
            </ButtonContained>
          </Flex>
          <Typography variant="body-sm-rg" color={color.White80_T} sx={{ mb: 2 }}>
            {t(I18N_KEYS.SHARE_WORKFLOW_MODAL.ACCESS_TITLE)}
          </Typography>
          <FlexCol sx={{ gap: 1, maxHeight: 400, overflowY: 'auto' }}>
            {currentUser && <ShareModalUser user={currentUser} isCurrentUser />}
            {isLoadingUsers ? (
              <>
                {[0, 1, 2].map((_, index) => (
                  <FlexCenVer
                    key={index}
                    sx={{ gap: 1, py: 1, px: 2, opacity: isLoadingUsers ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
                  >
                    <Skeleton animation="wave" variant="circular" width={26} height={26} />
                    <FlexCol sx={{ gap: 0.5, flex: 1 }}>
                      <Skeleton animation="wave" variant="text" width="40%" height={15} />
                      <Skeleton animation="wave" variant="text" width="60%" height={12} />
                    </FlexCol>
                  </FlexCenVer>
                ))}
              </>
            ) : users?.length > 0 ? (
              orderBy(users, 'email', 'asc').map((user, index) => (
                <ShareModalUser
                  key={index}
                  user={user}
                  isCurrentUser={user.uid === currentUser?.uid}
                  onDelete={(uid) => void handleDeleteSharedUser(uid)}
                />
              ))
            ) : null}
          </FlexCol>
          <Divider sx={{ my: 3 }} />
          <FlexCenVer sx={{ justifyContent: 'space-between' }}>
            <Box>
              <ButtonContained
                mode="text"
                startIcon={selectedPermission.icon}
                endIcon={<CaretIcon />}
                onClick={(e) => setPermissionsAnchorEl(e.currentTarget)}
                size="small"
              >
                {selectedPermission.text}
              </ButtonContained>

              <AppContextMenu
                width="260px"
                open={Boolean(permissionsAnchorEl)}
                anchorEl={permissionsAnchorEl}
                onClose={() => setPermissionsAnchorEl(null)}
                items={permissions
                  .filter((permission) => permission.type !== RecipeVisibilityType.Organization)
                  .map((permission, i) => ({
                    name: permission.text,
                    action: () => void handlePermissionsClose(i),
                    icon: permission.icon,
                  }))}
              />
            </Box>
            <CopyBtnV2
              text={encodeURI(window.location.href)}
              variant="text"
              label={t(I18N_KEYS.GENERAL.COPY_LINK)}
              eventTracking={{ name: 'share_workflow_modal_copy_link', payload: { visibility: recipe.visibility } }}
            />
          </FlexCenVer>
        </FlexCol>
      </Modal>
    </>
  );
};

export default ShareWorkflowModal;
