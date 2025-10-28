import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { color } from '@/colors';

export const Flex = styled('div')({
  display: 'flex',
});

export const FlexCol = styled(Flex)({
  display: 'flex',
  flexDirection: 'column',
});

export const FlexRow = styled(Flex)({
  display: 'flex',
  flexDirection: 'row',
});

export const FlexCenHor = styled(Flex)({
  justifyContent: 'center',
});

export const FlexCenVer = styled(Flex)({
  alignItems: 'center',
});

export const FlexCenVerSpaceBetween = styled(Flex)({
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const FlexCenHorVer = styled(FlexCenHor)({
  alignItems: 'center',
});

export const FlexColCenHor = styled(FlexCol)({
  alignItems: 'center',
});

export const FlexColCenVer = styled(FlexCol)({
  justifyContent: 'center',
});

export const FlexColCenHorVer = styled(FlexColCenHor)({
  alignItems: 'center',
  justifyContent: 'center',
});

export const AppPaper = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  backgroundColor: color.Black92,
  border: `1px solid ${color.White04_T}`,
}));
