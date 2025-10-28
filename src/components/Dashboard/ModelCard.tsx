import { Typography, Card, CardContent, CardMedia, Skeleton, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FlexCol } from '@/UI/styles';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import type { CustomModel, CustomModelEnrichment } from '@/state/customModels.state';

interface ModelCardProps {
  handleMouseEnterCard: (id: string) => void;
  handleMouseLeaveCard: () => void;
  loadingEnrichment: boolean;
  hoveredModelId: string | null;
  model: CustomModel;
  enrichment?: CustomModelEnrichment;
}

export const ModelCard = ({
  handleMouseLeaveCard,
  handleMouseEnterCard,
  loadingEnrichment,
  hoveredModelId,
  model,
  enrichment,
}: ModelCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        transition: 'border-color 0.2s ease-out',
        maxWidth: 345,
        border: '1px solid',
        borderRadius: 2,
        borderColor: hoveredModelId === model.id ? color.Dark_Grey : color.Yambo_Black_Dark,
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
      }}
      onMouseEnter={() => handleMouseEnterCard(model.id)}
      onMouseLeave={handleMouseLeaveCard}
    >
      {loadingEnrichment ? (
        <Skeleton sx={{ height: 140 }} animation="wave" variant="rectangular" />
      ) : (
        <CardMedia
          component="img"
          height="140"
          image={enrichment?.poster || '/empty.png'}
          alt="model poster"
          sx={{
            transition: 'transform 0.2s ease-out',
            transform: hoveredModelId === model.id ? 'scale(1.02)' : 'scale(1)',
            objectFit: 'cover',
          }}
        />
      )}
      <CardContent sx={{ py: 1, pl: 1, backgroundColor: 'transparent', boxShadow: 'none', backgroundImage: 'initial' }}>
        <FlexCol>
          {loadingEnrichment ? (
            <>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </>
          ) : (
            <>
              <EllipsisText variant="body-std-rg">{model?.data.menu.displayName}</EllipsisText>
              <EllipsisText variant="body-sm-rg">{model?.data.description}</EllipsisText>
              <EllipsisText variant="body-sm-rg" sx={{ mt: 2 }}>
                {`${t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.MODEL_CARD.BASED_ON)} ${model?.data.model.name}`}
              </EllipsisText>
            </>
          )}
          <Typography variant="body-sm-rg">
            {loadingEnrichment ? (
              <Skeleton />
            ) : enrichment?.creator ? (
              `${t(I18N_KEYS.DASHBOARD.PAGES.COMMUNITY.MODEL_CARD.CREATOR)} ${enrichment?.creator}`
            ) : (
              ''
            )}
          </Typography>
          {enrichment?.github && (
            <Typography variant="body-sm-rg">
              {loadingEnrichment ? (
                <Skeleton />
              ) : (
                <Link
                  href={enrichment?.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <i className="fa-brands fa-github fa-xs"></i>
                  <Typography variant="body-sm-rg">Github</Typography>
                </Link>
              )}
            </Typography>
          )}
          {/* <Typography variant="body-sm-rg">License: {model.license}</Typography> */}
        </FlexCol>
      </CardContent>
    </Card>
  );
};
