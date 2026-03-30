import i18n from '@/i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TopicCategory = 'tech' | 'societe' | 'ethique' | 'politique' | 'economie' | 'science' | 'culture';

export interface Topic {
  id: string;
  label: string;
  question: string;
  description: string;
  icon: string;
  category: TopicCategory;
}

export interface CategoryMeta {
  id: TopicCategory;
  label: string;
  emoji: string;
}

// ─── Raw data (no hardcoded labels — use i18n helpers below) ─────────────────

const CATEGORY_IDS: { id: TopicCategory; emoji: string }[] = [
  { id: 'tech',      emoji: '💻' },
  { id: 'societe',   emoji: '🏙️' },
  { id: 'ethique',   emoji: '⚖️' },
  { id: 'politique', emoji: '🗳️' },
  { id: 'economie',  emoji: '📊' },
  { id: 'science',   emoji: '🔬' },
  { id: 'culture',   emoji: '🎭' },
];

interface TopicRaw {
  id: string;
  description: string;
  icon: string;
  category: TopicCategory;
}

const TOPICS_RAW: TopicRaw[] = [
  // ── Tech ──
  { id: 'ia-emploi-creatif',       description: "Automatisation de l'art, du design et de l'écriture par les modèles génératifs.",    icon: '🤖', category: 'tech' },
  { id: 'reseaux-sociaux',         description: 'Désinformation, bulles de filtre et polarisation algorithmique.',                     icon: '📱', category: 'tech' },
  { id: 'teletravail',             description: "Flexibilité vs isolement, management à distance et culture d'entreprise.",            icon: '🏠', category: 'tech' },
  { id: 'surveillance-numerique',  description: "Sécurité nationale vs vie privée à l'ère du Big Data.",                               icon: '👁️', category: 'tech' },
  { id: 'open-source',             description: 'Transparence du code vs exploitation des vulnérabilités.',                            icon: '🔓', category: 'tech' },

  // ── Société ──
  { id: 'education-numerique',     description: 'Tablettes en classe, MOOCs et attention des élèves.',                                 icon: '📚', category: 'societe' },
  { id: 'urbanisation',            description: 'Mégapoles, désertification rurale et qualité de vie.',                                icon: '🏙️', category: 'societe' },
  { id: 'cancel-culture',          description: "Responsabilité publique, tribunaux populaires et liberté d'expression.",               icon: '🚫', category: 'societe' },
  { id: 'genre-langage',           description: 'Langue, représentation et résistances culturelles.',                                  icon: '✍️', category: 'societe' },
  { id: 'immigration',             description: 'Démographie, marché du travail et intégration culturelle.',                            icon: '🌍', category: 'societe' },

  // ── Éthique ──
  { id: 'vegetarisme',             description: 'Éthique animale, empreinte carbone et santé publique.',                               icon: '🌱', category: 'ethique' },
  { id: 'experimentation-animale', description: 'Progrès médical vs souffrance animale et alternatives.',                              icon: '🐁', category: 'ethique' },
  { id: 'euthanasie',              description: 'Dignité de fin de vie, consentement et dérives potentielles.',                        icon: '🕊️', category: 'ethique' },
  { id: 'transhumanisme',          description: "Implants, génie génétique et frontières de l'humanité.",                               icon: '🧬', category: 'ethique' },
  { id: 'peine-de-mort',           description: 'Dissuasion, erreurs judiciaires et droits fondamentaux.',                             icon: '⚖️', category: 'ethique' },

  // ── Politique ──
  { id: 'democratie-directe',      description: 'Référendums, participation citoyenne et populisme.',                                  icon: '🗳️', category: 'politique' },
  { id: 'vote-obligatoire',        description: 'Abstention, légitimité démocratique et liberté individuelle.',                        icon: '📋', category: 'politique' },
  { id: 'union-europeenne',        description: 'Fédéralisme, souveraineté nationale et solidarité européenne.',                       icon: '🇪🇺', category: 'politique' },
  { id: 'service-militaire',       description: 'Cohésion nationale, défense et liberté individuelle.',                                icon: '🎖️', category: 'politique' },

  // ── Économie ──
  { id: 'crypto',                  description: 'Décentralisation, volatilité et régulation financière.',                              icon: '₿',  category: 'economie' },
  { id: 'revenu-universel',        description: 'Automatisation, filet social et financement.',                                        icon: '💶', category: 'economie' },
  { id: 'decroissance',            description: 'Limites planétaires, PIB et modèles alternatifs.',                                    icon: '📉', category: 'economie' },
  { id: 'libre-echange',           description: 'Mondialisation, protectionnisme et inégalités.',                                      icon: '🚢', category: 'economie' },
  { id: 'taxe-robots',             description: 'Automatisation, financement social et compétitivité.',                                icon: '🤖', category: 'economie' },

  // ── Science ──
  { id: 'exploration-spatiale',    description: "Budget, retombées technologiques et rêve d'humanité.",                                 icon: '🚀', category: 'science' },
  { id: 'nucleaire',               description: "Énergie bas carbone, déchets et risques d'accident.",                                 icon: '⚛️', category: 'science' },
  { id: 'ogm',                     description: 'Sécurité alimentaire, biodiversité et brevets.',                                      icon: '🌾', category: 'science' },
  { id: 'clonage',                 description: 'Médecine régénérative, éthique et identité.',                                         icon: '🧪', category: 'science' },

  // ── Culture ──
  { id: 'art-ia',                  description: "Créativité, droits d'auteur et valeur artistique.",                                    icon: '🎨', category: 'culture' },
  { id: 'jeux-video-violence',     description: 'Études contradictoires, catharsis et influence médiatique.',                          icon: '🎮', category: 'culture' },
  { id: 'streaming-cinema',        description: 'Salles obscures, exclusivités et démocratisation.',                                   icon: '🎬', category: 'culture' },
  { id: 'patrimoine-restitution',  description: 'Musées occidentaux, mémoire et justice historique.',                                  icon: '🏛️', category: 'culture' },
];

// ─── i18n-aware getters ─────────────────────────────────────────────────────

function t(key: string): string {
  return i18n.t(key);
}

export function getCategories(): CategoryMeta[] {
  return CATEGORY_IDS.map((c) => ({
    ...c,
    label: t(`topicCategories.${c.id}`),
  }));
}

/** @deprecated Use getCategories() for i18n support */
export const CATEGORIES: CategoryMeta[] = CATEGORY_IDS.map((c) => ({
  ...c,
  get label() { return t(`topicCategories.${c.id}`); },
}));

function resolvedTopic(raw: TopicRaw): Topic {
  return {
    ...raw,
    label: t(`topicLabels.${raw.id}`),
    question: t(`topicQuestions.${raw.id}`),
  };
}

/** @deprecated Use getResolvedTopics() for i18n support */
export const TOPICS: Topic[] = TOPICS_RAW.map((raw) => ({
  ...raw,
  get label() { return t(`topicLabels.${raw.id}`); },
  get question() { return t(`topicQuestions.${raw.id}`); },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTopicsByCategory(category: TopicCategory): Topic[] {
  return TOPICS_RAW.filter((r) => r.category === category).map(resolvedTopic);
}

export function getTopicById(id: string): Topic | undefined {
  const raw = TOPICS_RAW.find((r) => r.id === id);
  return raw ? resolvedTopic(raw) : undefined;
}

/** Deterministic daily topic — same for all users on a given day */
export function getDailyTopic(date?: Date): Topic {
  const d = date ?? new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return resolvedTopic(TOPICS_RAW[dayOfYear % TOPICS_RAW.length]);
}

/** Get N random-looking topics for "trending" (deterministic per day) */
export function getTrendingTopics(count: number = 3, date?: Date): Topic[] {
  const d = date ?? new Date();
  const seed = d.getFullYear() * 1000 + Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const daily = getDailyTopic(d);
  const others = TOPICS_RAW.filter((r) => r.id !== daily.id);
  const result: Topic[] = [];
  for (let i = 0; i < Math.min(count, others.length); i++) {
    const idx = (seed * (i + 7) + 13) % others.length;
    const pick = others[idx];
    if (!result.find((r) => r.id === pick.id)) {
      result.push(resolvedTopic(pick));
    } else {
      result.push(resolvedTopic(others[(idx + 1) % others.length]));
    }
  }
  return result;
}
