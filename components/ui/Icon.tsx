import { createIconSet } from '@expo/vector-icons';

// Glyph map extracted from assets/icons/config.json — no JSON import needed
const glyphMap: Record<string, number> = {
  'add-circle':           59435,
  'alert-triangle':       59392,
  'arrow-left':           59393,
  'arrow-right':          59394,
  'banknote':             59430,
  'bell':                 59396,
  'bell-snooze':          59395,
  'calendar':             59436,
  'chart-line':           59410,
  'check':                59397,
  'chevron-down':         59400,
  'chevron-left':         59398,
  'chevron-right':        59403,
  'chevron-up':           59402,
  'circle-check':         59407,
  'circle-x':             59399,
  'clock':                59411,
  'cloud-sync':           59423,
  'crown':                59401,
  'document':             59406,
  'document-edit':        59408,
  'documents-copy':       59432,
  'download':             59409,
  'eye':                  59420,
  'eye-off':              59404,
  'fire':                 59405,
  'globe':                59424,
  'hand-wave':            59419,
  'heart':                59425,
  'home':                 59422,
  'info-circle':          59412,
  'leaf':                 59429,
  'log-in':               59421,
  'log-out':              59426,
  'pen':                  59416,
  'scale':                59413,
  'search':               59414,
  'settings-gear-filled': 59428,
  'star':                 59418,
  'sunset':               59434,
  'trash':                59427,
  'upload':               59433,
  'user':                 59431,
  'verified-check':       59415,
  'wind':                 59417,
};

const Icon = createIconSet(glyphMap, 'icons', require('../../assets/fonts/icons.ttf'));

export type IconName = keyof typeof glyphMap;

export { Icon };
export default Icon;
