import { IconButton } from '@mui/material';
import { color } from '@/colors';

interface ArrowProps {
  right: boolean;
  onClick: () => void;
}
export const Arrow = ({ right, onClick }: ArrowProps) => (
  <IconButton
    onClick={onClick}
    disableRipple
    sx={{
      backgroundColor: color.Black92,
      position: 'absolute',
      left: right ? 'auto' : '5px',
      right: right ? '5px' : 'auto',
      top: '50%',
      transform: 'translateY(-50%)',
      transition: 'opacity 0.1s',
      borderRadius: 1,
      width: '32px',
      height: '32px',
      '&:hover': {
        backgroundColor: `${color.Black84} !important`,
      },
    }}
  >
    <img
      src="/icons/arrow.svg"
      alt="arrow-left"
      style={{ transform: right ? 'rotate(-90deg)' : 'rotate(90deg)', width: '16px', height: '16px' }}
    />
  </IconButton>
);
