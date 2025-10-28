import { color } from '@/colors';
import { FlexCenHorVer } from '@/UI/styles';

interface WorkspaceIconProps {
  text: string;
  size?: 'small' | 'large';
}
export const WorkspaceIcon = ({ text, size = 'small' }: WorkspaceIconProps) => (
  <FlexCenHorVer
    sx={{
      height: size === 'small' ? '24px' : '86px',
      width: size === 'small' ? '24px' : '86px',
      borderRadius: 1,
      backgroundColor: color.Workspace_Icon_BG,
      color: color.Black100,
      fontSize: size === 'small' ? '14px' : '50px',
      fontWeight: 500,
      fontFamily: '"DM Sans", sans-serif',
    }}
  >
    {text?.[0].toLocaleUpperCase()}
  </FlexCenHorVer>
);
