import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { Label } from '@/UI/Label/Label';
import { Flex, FlexCenVer, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { formatNumberWithCommas } from '@/utils/numbers';
import { PermissionsContainer } from '@/components/PermissionsContainer/PermissionsContainer';
import { SubscriptionPermissions } from '@/types/permission';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';

const Item = styled(FlexCol)({
  gap: 4,
});

interface PlanDataProps {
  plan: string;
  usedSeats: string;
  seats: string;
  dateLabel: string;
  date?: Date;
  monthlyCredits: number;
  permissions?: SubscriptionPermissions;
}

export const PlanSection = ({ plan, seats, usedSeats, dateLabel, date, monthlyCredits }: PlanDataProps) => {
  const { t } = useTranslation();

  return (
    <Flex sx={{ justifyContent: 'space-between', pr: 4 }}>
      <Item>
        <Label>{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.PLAN)}</Label>
        <Typography variant="body-lg-md">{plan}</Typography>
      </Item>
      {seats && usedSeats ? (
        <PermissionsContainer permission="seats">
          <Item>
            <Label>{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.SEATS)}</Label>
            <Typography variant="body-lg-md">
              {`${usedSeats} / ${seats}`} {t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.SEATS_SUFFIX)}
            </Typography>
          </Item>
        </PermissionsContainer>
      ) : null}
      {date && (
        <Item>
          <Label>{dateLabel}</Label>
          {date && <Typography variant="body-lg-md">{format(date, 'MMM d, yyyy')}</Typography>}
        </Item>
      )}
      <PermissionsContainer permission="credits">
        <Item>
          <Label>{t(I18N_KEYS.SETTINGS.WORKSPACE_SETTINGS.PLAN.MONTHLY_CREDITS)}</Label>
          <FlexCenVer>
            <AsteriskIcon />
            <Typography variant="body-lg-md">{formatNumberWithCommas(monthlyCredits)}</Typography>
          </FlexCenVer>
        </Item>
      </PermissionsContainer>
    </Flex>
  );
};
