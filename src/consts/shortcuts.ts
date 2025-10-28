export const SHORTCUTS = {
  ZOOM_100: {
    ORDER: 10,
    DESCRIPTION: 'ctrl|meta+0',
  },
  ZOOM_TO_FIT: {
    ORDER: 20,
    DESCRIPTION: 'ctrl|meta+1',
  },
  NAVIGATION_MARK_NODES: {
    ORDER: 31,
    DESCRIPTION: 'ctrl+shift+[0-9]',
    PATTERN: `ctrl+shift+{number}`,
    KEY_COMBINATION: (replacementStr: string) =>
      Array.from({ length: 10 }, (_, i) => replacementStr.replace('{number}', String(i)))
        .join(',')
        .replace(/\s/g, ''),
  },
  NAVIGATION_NAVIGATE_TO_NODES: {
    ORDER: 32,
    DESCRIPTION: '[0-9]',
    PATTERN: '{number}',
    KEY_COMBINATION: (replacementStr: string) =>
      Array.from({ length: 10 }, (_, i) => replacementStr.replace('{number}', String(i)))
        .join(',')
        .replace(/\s/g, ''),
  },
  // Need to think about phrasing or the shortcut action - when this is used on a non model node
  // it will run the next connected model, but when on a model node it will run the model itself
  RUN_MODEL: {
    ORDER: 50,
    DESCRIPTION: 'ctrl|meta+enter',
  },
} as const;

export type ShortcutKey = keyof typeof SHORTCUTS;
