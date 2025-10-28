import { formatDistanceToNowStrict } from 'date-fns';

export const getTimeDiffInWords = (time: Date | number) => formatDistanceToNowStrict(time, { addSuffix: true });
