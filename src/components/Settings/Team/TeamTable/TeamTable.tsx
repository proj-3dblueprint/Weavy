import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TableSortLabel,
  Typography,
  Avatar,
  Box,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { User, WorkspaceRole } from '@/types/auth.types';
import { FlexCol, FlexCenVer, FlexCenVerSpaceBetween } from '@/UI/styles';
import { TeamMember } from '@/types/general';
import { Input } from '@/UI/Input/Input';
import { I18N_KEYS } from '@/language/keys';
import { useGlobalStore } from '@/state/global.state';
import { SearchIcon } from '@/UI/Icons/SearchIcon';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import useWorkspacesStore from '@/state/workspaces.state';
import { formatNumberWithCommas } from '@/utils/numbers';
import { TeamMemberStatus } from '@/enums/team-member-status.enum.ts';
import { CheckMarkCircleIcon } from '@/UI/Icons';
import ChangeCreditsLimitModal, { SelectedOptionEnum } from '../../WorkspaceSettings/ChangeCreditsLimitModal';
import { LoadingSkeleton } from '../../LoadingSkeleton';
import { StatusTag } from './StatusTag';
import { YouTag } from './YouTag';
import { RoleSelect } from './RoleSelect';
import { TeamTableMenu, TeamTableMenuActions } from './TeamTableMenu';
import { StyledTableCell, StyledTableRow } from './TeamTable.styles';

const logger = log.getLogger('TeamTable');

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Omit<TeamMember, 'id' | 'email' | 'avatar'>;
  label: string;
}

interface TeamTableProps {
  members: TeamMember[];
  currentUser: User;
  isEditPermissions: boolean;
  isLoading: boolean;
  updateMemberRole: (id: string, role: WorkspaceRole) => Promise<void>;
  removeMember: (member: TeamMember) => void;
  copyInviteLink: (email: string) => Promise<boolean>;
  resendInvite: (email: string) => Promise<void>;
  updateMemberLimit: (id: string[], limit: number | null) => Promise<void>;
  resetToDefaultLimit: (id: string[]) => Promise<void>;
}

export const TeamTableV2 = ({
  members,
  currentUser,
  isEditPermissions,
  isLoading,
  removeMember,
  copyInviteLink,
  resendInvite,
  updateMemberRole,
  updateMemberLimit,
  resetToDefaultLimit,
}: TeamTableProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>();
  const [orderBy, setOrderBy] = useState<keyof TeamMember>('name');
  const [order, setOrder] = useState<Order>('asc');
  const [search, setSearch] = useState('');
  const [openEditLimitModal, setOpenEditLimitModal] = useState(false);
  const { t } = useTranslation();
  const { updateSnackbarData } = useGlobalStore();
  const activeWorkspace = useWorkspacesStore((state) => state.activeWorkspace);

  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const headCells: HeadCell[] = [
    { id: 'name', label: t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.HEADER_NAME) },
    { id: 'status', label: t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.HEADER_STATUS) },
    { id: 'role', label: t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.HEADER_ROLE) },
    { id: 'monthlyCreditsUsed', label: t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.HEADER_USAGE) },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // setSelectedMember(undefined);
  };

  const handleAction = async (action: TeamTableMenuActions, member: TeamMember) => {
    switch (action) {
      case TeamTableMenuActions.RESEND_INVITE:
        void handleResendInvitation(member.email);
        break;
      case TeamTableMenuActions.COPY_INVITE_LINK:
        await handleCopyInviteLink(member.email);
        break;
      case TeamTableMenuActions.DELETE:
        removeMember(member);
        break;
      case TeamTableMenuActions.EDIT_LIMIT:
        setSelectedMember(members.find((m) => m.id === member.id));
        setOpenEditLimitModal(true);
        break;
    }
    handleMenuClose();
  };

  const handleRequestSort = (property: keyof TeamMember) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredMembers = useMemo(() => {
    if (!members?.length) {
      return [];
    }

    const filtered = search
      ? members.filter(
          (member) =>
            member?.name?.toLowerCase().includes(search.toLowerCase()) ||
            member?.email?.toLowerCase().includes(search.toLowerCase()),
        )
      : members;

    return [...filtered].sort((a, b) => {
      const rawA = a[orderBy];
      const rawB = b[orderBy];

      const aVal = rawA ?? (typeof rawB === 'number' ? 0 : '');
      const bVal = rawB ?? (typeof rawA === 'number' ? 0 : '');

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [members, order, orderBy, search]);

  const handleCopyInviteLink = async (email: string) => {
    await copyInviteLink(email);
    // TODO: add this back when loading animation is fixes
    // if (success) {
    //   setIsLinkCopied(true);
    //   setTimeout(() => {
    //     setIsLinkCopied(false);
    //   }, 2000);
    // }
  };

  const handleResendInvitation = async (email: string) => {
    try {
      await resendInvite(email);
      updateSnackbarData({
        text: t(I18N_KEYS.SETTINGS.TEAM.INVITE_USER_MODAL.SUCCESS_MESSAGE),
        isOpen: true,
        icon: <CheckMarkCircleIcon width={20} height={20} />,
      });
    } catch (e) {
      logger.error('Failed resending invitation', e);
    }
  };
  const handleSubmitEditLimit = async (
    selectedOption: SelectedOptionEnum,
    limit: number | null,
    userIds?: string[] | null,
  ) => {
    if (selected.length === 0 && !selectedMember && !userIds) return;
    const selectedMembersIds =
      selected.length > 0
        ? selected
        : selectedMember
          ? [selectedMember.id]
          : userIds && userIds.length > 0
            ? userIds
            : [];
    await updateMemberLimit(selectedMembersIds, selectedOption === SelectedOptionEnum.Unlimited ? null : limit);
    setOpenEditLimitModal(false);
  };

  const handleResetToDefaultLimit = async () => {
    await resetToDefaultLimit(selected);
    setOpenEditLimitModal(false);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredMembers.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const isMe = useCallback((memberId: string) => memberId === currentUser?.uid, [currentUser?.uid]);

  const getColWidth = (id: string) => {
    switch (id) {
      case 'name':
        return '100px';
      case 'role':
        return '60px';
      case 'status':
        return '60px';
      case 'monthlyCreditsUsed':
        return '100px';
      default:
        return '100px';
    }
  };

  const handleMouseEnter = (id: string) => {
    setHoveredRow(id);
  };
  const handleMouseLeave = () => {
    setHoveredRow(null);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  return (
    <>
      <FlexCenVerSpaceBetween>
        <Input
          placeholder={t(I18N_KEYS.GENERAL.SEARCH)}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: '240px' }}
          startAdornment={<SearchIcon />}
        />
        {selected.length > 0 && (
          <FlexCenVer sx={{ gap: 0.5 }}>
            <Typography variant="body-sm-rg" color={color.White64_T}>
              {t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.SELECTED_MEMBERS_COUNT, { count: selected.length })}
            </Typography>
            <ButtonContained mode="text" size="small" onClick={() => setOpenEditLimitModal(true)}>
              {t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.ALLOCATED_CREDITS)}
            </ButtonContained>
            <ButtonContained mode="text" size="small" onClick={() => void handleResetToDefaultLimit()}>
              {t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.RESET_TO_DEFAULT)}
            </ButtonContained>
          </FlexCenVer>
        )}
      </FlexCenVerSpaceBetween>
      <TableContainer
        sx={{
          backgroundColor: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ height: '40px' }}>
              <TableCell padding="checkbox" sx={{ width: '32px', pl: 2 }}>
                {selected.length > 0 && (
                  <AppCheckbox
                    indeterminate={selected.length > 0 && selected.length < filteredMembers.length}
                    checked={filteredMembers.length > 0 && selected.length === filteredMembers.length}
                    onChange={handleSelectAllClick}
                    inputProps={{
                      'aria-label': 'select all members',
                    }}
                  />
                )}
              </TableCell>

              {headCells.map((headCell) => (
                <TableCell
                  padding="none"
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ width: getColWidth(headCell.id) }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    <Typography
                      variant="label-sm-rg"
                      sx={{
                        color: orderBy === headCell.id ? color.White100 : color.White64_T,
                      }}
                    >
                      {headCell.label}
                    </Typography>
                  </TableSortLabel>
                </TableCell>
              ))}
              {isEditPermissions && <TableCell align="right" sx={{ width: '30px' }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {sortedMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((member) => ( */}
            {filteredMembers.map((member) => (
              <StyledTableRow
                hover
                key={member.id}
                onClick={(event) => handleClick(event, member.id)}
                selected={selected.includes(member.id)}
                onMouseEnter={() => handleMouseEnter(member.id)}
                onMouseLeave={handleMouseLeave}
              >
                <StyledTableCell padding="checkbox" sx={{ pl: 2 }}>
                  <AppCheckbox
                    checked={selected.includes(member.id)}
                    inputProps={{
                      'aria-labelledby': member.id,
                    }}
                    sx={{
                      opacity: hoveredRow === member.id || selected.includes(member.id) ? 1 : 0,
                      transition: 'opacity 0.2s ease-in-out',
                    }}
                  />
                </StyledTableCell>

                <StyledTableCell>
                  <FlexCenVer sx={{ gap: 0.75 }}>
                    <Avatar sx={{ width: 32, height: 32 }} src={member.profilePicture} />
                    <FlexCol>
                      <Typography sx={{ display: 'flex', gap: 1 }} variant="body-sm-md">
                        {member.name || member.email}
                        {isMe(member.id) && (
                          <Box component="span" sx={{ position: 'relative', top: '-1px' }}>
                            <YouTag />
                          </Box>
                        )}
                      </Typography>
                      {member.name && (
                        <Typography variant="body-xs-rg" color={color.White64_T}>
                          {member.email}
                        </Typography>
                      )}
                    </FlexCol>
                  </FlexCenVer>
                </StyledTableCell>
                <StyledTableCell>
                  <StatusTag status={member.status} />
                </StyledTableCell>
                <StyledTableCell>
                  <RoleSelect
                    currentRole={member.role}
                    updateMemberRole={(role) => void updateMemberRole(member.id, role)}
                    disabled={
                      isMe(member.id) ||
                      member.status === TeamMemberStatus.INVITED || // todo: allow changing invited role
                      currentUser.activeWorkspace?.role !== WorkspaceRole.Admin
                    }
                  />
                </StyledTableCell>
                <StyledTableCell>
                  {member.monthlyCreditsLimit !== null && member.monthlyCreditsLimit !== undefined ? (
                    <FlexCenVer sx={{ gap: 1 }}>
                      <Typography variant="body-sm-md" color={color.White100}>
                        {member.monthlyCreditsLimit === 0
                          ? '100'
                          : ((member.monthlyCreditsUsed / member.monthlyCreditsLimit) * 100).toFixed(1)}
                        %
                      </Typography>
                      <Typography variant="body-sm-rg" color={color.White64_T}>
                        {formatNumberWithCommas(member.monthlyCreditsUsed)} / {member.monthlyCreditsLimit}
                      </Typography>
                    </FlexCenVer>
                  ) : (
                    <Typography variant="body-sm-md" color={color.White100}>
                      {formatNumberWithCommas(member.monthlyCreditsUsed)}
                    </Typography>
                  )}
                </StyledTableCell>

                {isEditPermissions && !isMe(member.id) && (
                  <StyledTableCell align="right">
                    <IconButton
                      disableRipple
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, member);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'transparent !important',
                        },
                      }}
                    >
                      <img src="/icons/3-dots-vertical.svg" />
                    </IconButton>
                  </StyledTableCell>
                )}
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* {members.length >= MIN_ROWS && (
        <TablePagination
          rowsPerPageOptions={[MIN_ROWS, 50, 100]}
          component="div"
          count={members.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )} */}

      {selectedMember && (
        <TeamTableMenu
          member={selectedMember}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          handleAction={handleAction}
        />
      )}

      {openEditLimitModal && (
        <ChangeCreditsLimitModal
          open={openEditLimitModal}
          onClose={() => setOpenEditLimitModal(false)}
          activeWorkspace={activeWorkspace}
          onConfirm={(selectedOption: SelectedOptionEnum, limit: number | null) =>
            handleSubmitEditLimit(selectedOption, limit, selectedMember ? [selectedMember.id] : undefined)
          }
          title={t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.EDIT_LIMIT_MODAL.TITLE)}
          subtitle={t(I18N_KEYS.SETTINGS.TEAM.TEAM_TABLE.EDIT_LIMIT_MODAL.SUBTITLE)}
          showCaption={false}
          userIds={selectedMember ? [selectedMember.id] : undefined}
        />
      )}
    </>
  );
};
