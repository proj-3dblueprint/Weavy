import { Typography } from '@mui/material';
import { ReactNode } from 'react';
import { FlexCenVer, Flex, FlexCol } from '@/UI/styles';

interface SubscriptionSectionProps {
  title: string;
  value: string;
  ctaEl: ReactNode;
  icon?: ReactNode;
  hintText?: string;
}
export const SubscriptionSection = ({ title, value, ctaEl, icon, hintText }: SubscriptionSectionProps) => {
  return (
    <FlexCol sx={{ gap: 0.5, p: 1, pt: 2 }}>
      <Typography variant="label-xs-rg" sx={{ opacity: 0.8 }}>
        {title}
      </Typography>
      <Flex sx={{ justifyContent: 'space-between' }}>
        <FlexCenVer sx={{ gap: 0.5 }}>
          {icon}
          <Typography variant="body-sm-rg">{value}</Typography>
        </FlexCenVer>
        {ctaEl}
      </Flex>
      {hintText && (
        <Typography variant="body-xs-rg" sx={{ opacity: 0.64 }}>
          {hintText}
        </Typography>
      )}
    </FlexCol>
  );
};
