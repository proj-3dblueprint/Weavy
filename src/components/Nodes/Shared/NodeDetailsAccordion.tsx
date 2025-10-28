import { AccordionSummary, Typography, Accordion, AccordionDetails, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { AsteriskIcon } from '@/UI/Icons/AsteriskIcon';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';

const AccordionSummaryStyled = styled(AccordionSummary)({
  // padding: '0px 16px',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  backgroundImage: 'none',
  minHeight: '36px !important',
  height: '36px !important',
  width: 'auto',
  padding: '0px',
});

function NodeDetailsAccordion({ description, price }: { description: string; price?: number }) {
  const { t } = useTranslation();
  return (
    <Accordion
      sx={{
        boxShadow: 'none',
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        width: '240px',
      }}
      slotProps={{ transition: { timeout: 100 } }}
    >
      <AccordionSummaryStyled
        expandIcon={
          <img src="/icons/caret-down.svg" alt="caret" width="16px" height="16px" style={{ opacity: 0.64 }} />
        }
      >
        <Typography variant="body-std-rg" sx={{ color: color.White64_T, mr: 1 }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.SHARED.NODE_DETAILS_ACCORDION.TITLE)}
        </Typography>
      </AccordionSummaryStyled>
      <AccordionDetails sx={{ p: 0, pt: 1 }}>
        <FlexCol sx={{ gap: 1 }}>
          <Typography
            variant="body-sm-rg"
            sx={{ color: color.White80_T }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
          {price && (
            <FlexCenVer sx={{ gap: 1 }}>
              <AsteriskIcon width={16} height={16} style={{ opacity: 0.8 }} />
              <Typography variant="body-sm-md" sx={{ color: color.White80_T }}>
                {price} {t(I18N_KEYS.GENERAL.CREDITS)}
              </Typography>
            </FlexCenVer>
          )}
        </FlexCol>
      </AccordionDetails>
    </Accordion>
  );
}

export default NodeDetailsAccordion;
