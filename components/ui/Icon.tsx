import { createIconSet } from '@expo/vector-icons';

// Glyph map extracted from assets/icons/config.json — no JSON import needed
// Regenerated from assets/icons/config.json — the source of truth for icons.ttf
const glyphMap: Record<string, number> = {
  'add-circle':           59392,
  'alert-triangle':       59393,
  'arrow-left':           59396,
  'arrow-right':          59394,
  'banknote':             59395,
  'bell':                 59399,
  'bell-snooze':          59397,
  'calendar':             59398,
  'chart-line':           59401,
  'check':                59400,
  'chevron-down':         59402,
  'chevron-left':         59403,
  'chevron-right':        59404,
  'chevron-up':           59405,
  'circle-check':         59406,
  'circle-x':             59407,
  'clock':                59408,
  'cloud-sync':           59410,
  'crown':                59409,
  'document':             59412,
  'document-edit':        59411,
  'documents-copy':       59413,
  'download':             59414,
  'eye':                  59416,
  'eye-off':              59415,
  'fire':                 59417,
  'friends':              59418,
  'globe':                59419,
  'hand-wave':            59420,
  'heart':                59421,
  'home':                 59422,
  'info-circle':          59423,
  'leaf':                 59424,
  'log-in':               59425,
  'log-out':              59426,
  'pen':                  59427,
  'scale':                59428,
  'search':               59429,
  'settings-gear-filled': 59430,
  'star':                 59431,
  'sunset':               59432,
  'trash':                59433,
  'upload':               59434,
  'user':                 59435,
  'verified-check':       59436,
  'wind':                 59437,
};

const Icon = createIconSet(glyphMap, 'icons', require('../../assets/fonts/icons.ttf'));

export type IconName = keyof typeof glyphMap;

export { Icon };
export default Icon;
