import { setUseWhatChange } from '@simbathesailor/use-what-changed';

const isDevelopment = process.env.NODE_ENV === 'development';
setUseWhatChange(isDevelopment);
