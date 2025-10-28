import { Box, Typography } from '@mui/material';
import { color } from '@/colors';
import { openIntercom } from '@/providers/intercom';
import { User } from '@/types/auth.types';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { FlexCol } from '@/UI/styles';

const enterpriseFeatures = [
  'Custom credit allocation',
  'Your own API keys',
  'Team training',
  'Run workflows through API',
  'Expanded indemnity',
  'Premium customer support',
];

function EnterprisePackage({ currentUser }: { currentUser: User | undefined }) {
  const handleIntercomClick = () => {
    if (!currentUser) {
      const mailtoLink = document.createElement('a');
      mailtoLink.href = 'mailto:hello@weavy.ai';
      mailtoLink.target = '_blank';
      mailtoLink.click();
      return;
    }
    openIntercom();
  };
  return (
    <Box
      sx={{
        width: '100%',
        // height: '284px',
        backgroundColor: color.Black92,
        borderRadius: 2,
        p: 6,
        display: 'flex',
        justifyContent: 'center',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: '260px' },
          ml: 'auto',
        }}
      >
        <Typography variant="h2" sx={{ mb: 4 }}>
          Looking for an enterprise solution?
        </Typography>
        <ButtonContained onClick={handleIntercomClick}>Contact us</ButtonContained>
      </Box>
      <FlexCol
        sx={{
          width: { xs: '100%', md: '380px' },
          mr: 'auto',
          mt: { xs: 4, md: 0 },
          ml: { xs: 0, md: 9 },
        }}
      >
        <Typography variant="body-sm-rg" color={color.White80_T} sx={{ mb: 4 }}>
          Our Enterprise plan contains everything in Team plus:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {enterpriseFeatures.map((feature, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <i className="fa-light fa-check" style={{ fontSize: '0.75rem' }}></i>
              <Typography variant="body-sm-rg" color={color.White80_T}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>
      </FlexCol>
    </Box>
  );
}

export default EnterprisePackage;
