import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import PricingFAQ from './PricingFAQ';

function PricingFAQS({ maxWidth }) {
  const { t } = useTranslation();
  const pricingFAQs = [
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_1.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_1.ANSWER,
      link: {
        text: 'here',
        href: 'https://content.weavy.ai/models',
      },
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_2.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_2.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_3.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_3.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_4.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_4.ANSWER,
      link: {
        text: 'comprehensive model list',
        href: 'https://content.weavy.ai/models',
      },
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_5.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_5.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_6.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_6.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_7.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_7.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_8.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_8.ANSWER,
    },
    {
      question: t(I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_9.QUESTION),
      answer: I18N_KEYS.PAYMENTS.PRICING_TABLE.FAQS.FAQ_9.ANSWER,
      link: {
        text: 'support@weavy.ai',
        href: 'mailto:support@weavy.ai',
      },
    },
  ];
  return (
    <Box sx={{ width: '100%', maxWidth: maxWidth }}>
      {pricingFAQs.map((faq) => (
        <PricingFAQ key={faq.question} question={faq.question} answer={faq.answer} link={faq.link} />
      ))}
    </Box>
  );
}

export default PricingFAQS;
