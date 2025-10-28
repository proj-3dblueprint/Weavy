import { Card, CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import { color } from '@/colors';
import { useIsHovered } from '@/hooks/useIsHovered';

type CardContent = {
  id: string;
  name?: string;
  poster: string;
  icon?: React.ReactNode;
};

interface EducationGalleryCardProps {
  cardContent: CardContent;
  handleClick: (id: string) => void;
  showGradient?: boolean;
}

const renderOverlay = (isHovered: boolean, showGradient: boolean) => {
  if (showGradient) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isHovered ? 0.6 : 0.8,
          transition: 'opacity 0.15s ease-out',
          background: `linear-gradient(0deg, ${color.Black100} 0%, rgba(107, 107, 120, 0) 100%)`,
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: isHovered ? 0.2 : 1,
        transition: 'opacity 0.15s ease-out',
        background: color.Black16_T,
      }}
    />
  );
};

function EducationGalleryCard({ cardContent, handleClick, showGradient }: EducationGalleryCardProps) {
  const { isHovered, ...elementProps } = useIsHovered();
  return (
    <Card
      {...elementProps}
      key={cardContent.id}
      sx={{
        width: '176px',
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        borderRadius: 2,
        border: '1px solid',
        transition: 'border-color 0.15s ease-out',
        borderColor: isHovered ? color.Yellow16_T : 'transparent',
        boxShadow: 'none',
      }}
      onClick={() => handleClick(cardContent.id)}
    >
      <CardActionArea>
        <CardMedia
          component="img"
          height={120}
          image={cardContent.poster || '/empty.png'}
          alt="content poster"
          sx={{
            transform: isHovered ? `scale(1.04)` : `scale(1.02)`,
            position: 'relative',
            transition: 'transform 0.15s ease-out',
          }}
        />
        {renderOverlay(isHovered, showGradient || false)}
        {cardContent.icon && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                transform: 'translateY(-5px)',
                color: isHovered ? color.White : color.White80_T,
                transition: 'color 0.15s ease-out',
              }}
            >
              {cardContent.icon}
            </Box>
          </Box>
        )}
        {cardContent.name && (
          <Typography
            sx={{
              position: 'absolute',
              bottom: '8px',
              left: '12px',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant="body-sm-rg"
          >
            {cardContent.name}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}

export default EducationGalleryCard;
