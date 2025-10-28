import { Fragment, ReactNode } from 'react';
import { Box, Typography, type SxProps } from '@mui/material';
import { FlexCenHorVer, FlexColCenHorVer } from '@/UI/styles';
import { color } from '@/colors';

type ActionObject = { label: string; onClick: () => void };
type ActionObjectWithLink = { label: string; href: string; target?: string };

interface EmptyStateProps {
  icon: ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  actions: Array<React.ReactNode | ActionObject | ActionObjectWithLink>;
  sx?: SxProps;
}

const isNotEmpty = (
  action: ReactNode | ActionObject | ActionObjectWithLink,
): action is Exclude<ReactNode, null | undefined> | ActionObject | ActionObjectWithLink => {
  return !!action;
};

const isActionObject = (action: ReactNode | ActionObject | ActionObjectWithLink): action is ActionObject => {
  return !!action && typeof action === 'object' && 'label' in action && 'onClick' in action;
};

const isActionObjectWithLink = (action: ReactNode | ActionObjectWithLink): action is ActionObjectWithLink => {
  return !!action && typeof action === 'object' && 'label' in action && 'href' in action;
};

const buttonStyles = {
  background: color.Black100,
  borderRadius: '4px',
  border: `1px solid ${color.White40_T}`,
  color: color.White100,
  cursor: 'pointer',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.75rem',
  fontWeight: 500,
  padding: '6px 16px',
  textDecoration: 'none',
  transition: 'background 0.2s ease-in-out',
  willChange: 'background',
};

export const EmptyState = ({ icon, title, description, actions, sx }: EmptyStateProps) => {
  const filteredActions = actions.filter(isNotEmpty);

  return (
    <FlexCenHorVer sx={{ height: '100%', width: '100%', backgroundColor: color.Black100, ...sx }}>
      <FlexColCenHorVer sx={{ gap: 4, width: '450px' }}>
        <FlexColCenHorVer sx={{ gap: 2, width: '100%' }}>
          <Box
            sx={{ color: color.White100, height: '42px', width: '42px', '& > svg': { height: '42px', width: '42px' } }}
          >
            {icon}
          </Box>
          <FlexColCenHorVer sx={{ gap: 0.5, width: '100%' }}>
            <Typography component="div" variant="body-lg-sb" sx={{ textAlign: 'center' }}>
              {title}
            </Typography>
            <Typography component="div" variant="body-sm-rg" sx={{ color: color.White64_T, textAlign: 'center' }}>
              {description}
            </Typography>
          </FlexColCenHorVer>
        </FlexColCenHorVer>
        <FlexCenHorVer sx={{ gap: 1, width: '100%' }}>
          {filteredActions.map(
            (action: Exclude<ReactNode, null | undefined> | ActionObject | ActionObjectWithLink, index) =>
              isActionObject(action) ? (
                <Box key={index} component="button" sx={buttonStyles} onClick={action.onClick}>
                  {action.label}
                </Box>
              ) : isActionObjectWithLink(action) ? (
                <Box
                  key={index}
                  component="a"
                  sx={buttonStyles}
                  href={action.href}
                  target={action.target}
                  rel="noreferrer"
                >
                  {action.label}
                </Box>
              ) : (
                <Fragment key={index}>{action}</Fragment>
              ),
          )}
        </FlexCenHorVer>
      </FlexColCenHorVer>
    </FlexCenHorVer>
  );
};
