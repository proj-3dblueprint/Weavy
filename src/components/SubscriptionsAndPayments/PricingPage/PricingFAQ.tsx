import { Accordion, AccordionSummary, AccordionDetails, Link } from '@mui/material';
import { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { Trans, useTranslation } from 'react-i18next';
import { color } from '@/colors';

const StyledAccordion = styled(Accordion)({
  boxShadow: 'none',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  borderTop: `1px solid ${color.White16_T}`,
  margin: 0,
  '&.MuiAccordion-root.Mui-expanded': {
    margin: '0 !important',
  },
});

const StyledAccordionSummary = styled(AccordionSummary)({
  fontFamily: 'DM Sans',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#FFF',
});

const StyledAccordionDetails = styled(AccordionDetails)({
  fontFamily: 'DM Sans',
  fontSize: '0.875rem',
  fontWeight: 400,
  color: color.White80_T,
  lineHeight: '1.25rem',
});

interface PricingFAQProps {
  question: string;
  answer: string;
  link?: {
    href: string;
    text: string;
  };
}

function PricingFAQ({ question, answer, link }: PricingFAQProps) {
  const [expanded, setExpanded] = useState(false);
  const { i18n } = useTranslation();

  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const linkComponent = useMemo(() => {
    if (!link) return undefined;
    return (
      <Link href={link.href} target="_blank" rel="noopener noreferrer">
        {link.text}
      </Link>
    );
  }, [link]);

  return (
    <StyledAccordion
      expanded={expanded}
      onChange={handleChange}
      TransitionProps={{ unmountOnExit: true }}
      key={`${answer}-${i18n.language}`}
    >
      <StyledAccordionSummary
        expandIcon={expanded ? <i className="fa-light fa-minus"></i> : <i className="fa-light fa-plus"></i>}
        aria-controls="faq-content"
        sx={{ height: '64px !important' }}
      >
        {question}
      </StyledAccordionSummary>
      <StyledAccordionDetails sx={{ pt: 0, pb: 3, px: 2 }}>
        {linkComponent ? (
          <Trans
            i18nKey={answer}
            components={{
              link: linkComponent,
            }}
          />
        ) : (
          <Trans i18nKey={answer} />
        )}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
}

export default PricingFAQ;
