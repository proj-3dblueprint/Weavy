import { Typography } from '@mui/material';
import { color } from '@/colors';
import { Flex, FlexCenHorVer } from '@/UI/styles';
import { useGetMarkedKeysForNode } from '@/hooks/useKeyNavigation';

export const NavigationKeyBadge = ({ nodeId }: { nodeId: string }) => {
  const keys = useGetMarkedKeysForNode(nodeId);
  if (!keys || keys.length === 0) {
    return null;
  }

  return (
    <Flex
      sx={{
        position: 'absolute',
        top: -28,
        left: 0,
        gap: 0.5,
      }}
    >
      {keys.map((key) => (
        <FlexCenHorVer
          key={key}
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: color.White04_T,
            border: `1px solid ${color.White08_T}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="label-sm-rg" sx={{ color: color.White100 }}>
            {key}
          </Typography>
        </FlexCenHorVer>
      ))}
    </Flex>
  );
};
