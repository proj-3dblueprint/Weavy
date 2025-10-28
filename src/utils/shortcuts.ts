import { ShortcutKey, SHORTCUTS } from '@/consts/shortcuts';
import { getOS } from './general';

const CAP_CTRL = 'Ctrl';
const CAP_ALT = 'Alt';
const CAP_SHIFT = 'Shift';
const CAP_ENTER = 'Enter';

const getKey = (key: ShortcutKey): any => SHORTCUTS[key];

const replacePerPlatformForCombination = (res: string) => {
  if (getOS() === 'Mac') {
    return res.replace(/ctrl\|meta/g, 'meta');
  }
  return res.replace(/ctrl\|meta/g, 'ctrl');
};

const replacePerPlatformForDisplay = (res: string) => {
  if (getOS() === 'Mac') {
    return res
      .replace(/ctrl\|meta\+/g, '⌘')
      .replace(/(option|alt)/g, '⌥')
      .replace(/ctrl/g, '⌃')
      .replace(/shift/g, '⇧')
      .replace(/enter/g, '⏎');
  }
  return res
    .replace(/ctrl\|meta/g, CAP_CTRL)
    .replace(/option/g, CAP_ALT)
    .replace(/ctrl/g, CAP_CTRL)
    .replace(/shift/g, CAP_SHIFT)
    .replace(/alt/g, CAP_ALT)
    .replace(/enter/g, CAP_ENTER);
};

export const getDescription = (key: ShortcutKey): string => {
  const shortcut = getKey(key);
  return replacePerPlatformForDisplay(shortcut.DESCRIPTION);
};

export const getShortcut = (key: ShortcutKey): string => {
  const shortcut = getKey(key);
  const res = (shortcut.KEY_COMBINATION?.(shortcut?.PATTERN) || shortcut.DESCRIPTION) as string;

  return replacePerPlatformForCombination(res);
};
