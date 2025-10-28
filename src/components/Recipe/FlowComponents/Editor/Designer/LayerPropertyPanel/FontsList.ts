import { useFeatureFlagEnabled } from 'posthog-js/react';
import { BuiltInFont } from 'web';
import {
  FF_HIBOB_FONTS,
  FF_MAAR_FONTS,
  FF_ALEPH_FONTS,
  FF_RAKUTEN_FONTS,
  FF_SCRIBOS_FONTS,
  FF_DEPOSCO_FONTS,
  FF_BARKBOX_FONTS,
} from '@/consts/featureFlags';

interface FontConfig {
  value: BuiltInFont;
  label: string;
  company?: string;
  featureFlag?: string;
}

// Base fonts available to all users
const BASE_FONTS: FontConfig[] = [
  { value: 'Nunito', label: 'Nunito' },
  { value: 'DMSans', label: 'DM Sans' },
  { value: 'Caveat', label: 'Caveat' },
  { value: 'CrimsonText', label: 'Crimson Text' },
  { value: 'EBGaramond', label: 'EB Garamond' },
  { value: 'FiraCode', label: 'Fira Code' },
  { value: 'IBMPlexSans', label: 'IBM Plex Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'JetBrainsMono', label: 'JetBrains Mono' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Lobster', label: 'Lobster' },
  { value: 'Karla', label: 'Karla' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'SpaceMono', label: 'Space Mono' },
  { value: 'RobotoSlab', label: 'Roboto Slab' },
  { value: 'PlayfairDisplay', label: 'Playfair Display' },
  { value: 'LibreBaskerville', label: 'Libre Baskerville' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'SpaceGrotesk', label: 'Space Grotesk' },
  { value: 'SourceCodePro', label: 'Source Code Pro' },
  { value: 'Sacramento', label: 'Sacramento' },
  { value: 'WorkSans', label: 'Work Sans' },
  { value: 'OpenSans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Kanit', label: 'Kanit' },
  { value: 'JosefinSans', label: 'Josefin Sans' },
  { value: 'Figtree', label: 'Figtree' },
  { value: 'Arimo', label: 'Arimo' },
];

// Company-specific fonts
const COMPANY_FONTS: FontConfig[] = [
  // Hibob fonts
  { value: 'Champion', label: 'Champion', company: 'hibob', featureFlag: FF_HIBOB_FONTS },
  { value: 'Sentinel', label: 'Sentinel', company: 'hibob', featureFlag: FF_HIBOB_FONTS },
  { value: 'GothamSSm', label: 'Gotham', company: 'hibob', featureFlag: FF_HIBOB_FONTS },
  // Maar fonts
  { value: 'NaturaDisplay', label: 'Natura Display', company: 'maar', featureFlag: FF_MAAR_FONTS },
  { value: 'VersosTest', label: 'Versos Test', company: 'maar', featureFlag: FF_MAAR_FONTS },
  { value: 'NaturaEKOS', label: 'Natura EKOS', company: 'maar', featureFlag: FF_MAAR_FONTS },

  // Aleph fonts
  { value: 'Altform', label: 'Altform', company: 'aleph', featureFlag: FF_ALEPH_FONTS },

  // Rakuten fonts
  { value: 'RakutenSans', label: 'Rakuten Sans', company: 'rakuten', featureFlag: FF_RAKUTEN_FONTS },
  // Scribos fonts
  { value: 'Arial', label: 'Arial', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  { value: 'ArialNarrow', label: 'Arial Narrow', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  { value: 'ArialRounded', label: 'Arial Rounded', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  { value: 'Helvetica', label: 'Helvetica', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  { value: 'HelveticaNeueLTPro', label: 'Helvetica Neue LT Pro', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  { value: 'OCRB0', label: 'OCR B0', company: 'scribos', featureFlag: FF_SCRIBOS_FONTS },
  // Deposco fonts
  { value: 'Gotham', label: 'Gotham', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'GothamCondensed', label: 'Gotham Condensed', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'GothamNarrow', label: 'Gotham Narrow', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'BebasNeue', label: 'Bebas Neue', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'DegularMono', label: 'Degular Mono', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'Futura', label: 'Futura', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  { value: 'PermanentMarker', label: 'Permanent Marker', company: 'deposco', featureFlag: FF_DEPOSCO_FONTS },
  // Barkbox fonts
  {
    value: 'ABCGintoNordCondensed',
    label: 'ABC Ginto Nord Condensed',
    company: 'barkbox',
    featureFlag: FF_BARKBOX_FONTS,
  },
  {
    value: 'Pancho',
    label: 'Pancho',
    company: 'barkbox',
    featureFlag: FF_BARKBOX_FONTS,
  },
  {
    value: 'PanchoW03',
    label: 'Pancho W03',
    company: 'barkbox',
    featureFlag: FF_BARKBOX_FONTS,
  },
  // Add more company fonts here as needed
  // { value: 'CompanyFont1', label: 'Company Font 1', company: 'company1', featureFlag: FF_COMPANY1_FONTS },
  // { value: 'CompanyFont2', label: 'Company Font 2', company: 'company2', featureFlag: FF_COMPANY2_FONTS },
];

function FontsList() {
  const isHibobFontsEnabled = useFeatureFlagEnabled(FF_HIBOB_FONTS);
  const isMaarFontsEnabled = useFeatureFlagEnabled(FF_MAAR_FONTS);
  const isAlephFontsEnabled = useFeatureFlagEnabled(FF_ALEPH_FONTS);
  const isRakutenFontsEnabled = useFeatureFlagEnabled(FF_RAKUTEN_FONTS);
  const isScribosFontsEnabled = useFeatureFlagEnabled(FF_SCRIBOS_FONTS);
  const isDeposcoFontsEnabled = useFeatureFlagEnabled(FF_DEPOSCO_FONTS);
  const isBarkboxFontsEnabled = useFeatureFlagEnabled(FF_BARKBOX_FONTS);
  // Get all available fonts based on feature flags
  const availableCompanyFonts = COMPANY_FONTS.filter((font) => {
    if (!font.featureFlag) {
      return true; // Always show fonts without feature flags
    }

    // Check if the specific company's feature flag is enabled
    switch (font.company) {
      case 'hibob':
        return isHibobFontsEnabled;
      case 'maar':
        return isMaarFontsEnabled;
      case 'aleph':
        return isAlephFontsEnabled;
      case 'rakuten':
        return isRakutenFontsEnabled;
      case 'scribos':
        return isScribosFontsEnabled;
      case 'deposco':
        return isDeposcoFontsEnabled;
      case 'barkbox':
        return isBarkboxFontsEnabled;
      default:
        return false;
    }
  });

  // Combine base fonts with available company fonts
  return [...BASE_FONTS, ...availableCompanyFonts].sort((a, b) => a.label.localeCompare(b.label));
}

export default FontsList;
