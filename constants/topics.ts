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

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES: CategoryMeta[] = [
  { id: 'tech',      label: 'Technologie',  emoji: '💻' },
  { id: 'societe',   label: 'Société',      emoji: '🏙️' },
  { id: 'ethique',   label: 'Éthique',      emoji: '⚖️' },
  { id: 'politique', label: 'Politique',     emoji: '🗳️' },
  { id: 'economie',  label: 'Économie',     emoji: '📊' },
  { id: 'science',   label: 'Science',      emoji: '🔬' },
  { id: 'culture',   label: 'Culture',      emoji: '🎭' },
];

// ─── Topics (30+) ────────────────────────────────────────────────────────────

export const TOPICS: Topic[] = [
  // ── Tech ──
  { id: 'ia-emploi-creatif',       label: 'IA & Créativité',           question: "L'IA menace-t-elle l'emploi créatif ?",                       description: "Automatisation de l'art, du design et de l'écriture par les modèles génératifs.",    icon: '🤖', category: 'tech' },
  { id: 'reseaux-sociaux',         label: 'Réseaux Sociaux',           question: 'Les réseaux sociaux nuisent-ils à la démocratie ?',            description: 'Désinformation, bulles de filtre et polarisation algorithmique.',                     icon: '📱', category: 'tech' },
  { id: 'teletravail',             label: 'Télétravail',               question: 'Le télétravail est-il nuisible à la productivité ?',           description: 'Flexibilité vs isolement, management à distance et culture d\'entreprise.',           icon: '🏠', category: 'tech' },
  { id: 'surveillance-numerique',  label: 'Surveillance numérique',    question: 'La surveillance de masse est-elle justifiable ?',              description: 'Sécurité nationale vs vie privée à l\'ère du Big Data.',                              icon: '👁️', category: 'tech' },
  { id: 'open-source',             label: 'Open Source',               question: "L'open source est-il plus sûr que le propriétaire ?",          description: 'Transparence du code vs exploitation des vulnérabilités.',                            icon: '🔓', category: 'tech' },

  // ── Société ──
  { id: 'education-numerique',     label: 'Éducation numérique',       question: "Les écrans améliorent-ils l'apprentissage ?",                  description: 'Tablettes en classe, MOOCs et attention des élèves.',                                 icon: '📚', category: 'societe' },
  { id: 'urbanisation',            label: 'Urbanisation',              question: 'Faut-il limiter la croissance des grandes villes ?',           description: 'Mégapoles, désertification rurale et qualité de vie.',                                icon: '🏙️', category: 'societe' },
  { id: 'cancel-culture',          label: 'Cancel Culture',            question: 'La cancel culture est-elle une forme de justice sociale ?',    description: 'Responsabilité publique, tribunaux populaires et liberté d\'expression.',             icon: '🚫', category: 'societe' },
  { id: 'genre-langage',           label: 'Écriture inclusive',        question: "L'écriture inclusive favorise-t-elle l'égalité ?",             description: 'Langue, représentation et résistances culturelles.',                                  icon: '✍️', category: 'societe' },
  { id: 'immigration',             label: 'Immigration',               question: "L'immigration est-elle une chance économique ?",               description: 'Démographie, marché du travail et intégration culturelle.',                           icon: '🌍', category: 'societe' },

  // ── Éthique ──
  { id: 'vegetarisme',             label: 'Végétarisme',               question: 'Devrait-on tous devenir végétariens ?',                       description: 'Éthique animale, empreinte carbone et santé publique.',                               icon: '🌱', category: 'ethique' },
  { id: 'experimentation-animale', label: 'Expérimentation animale',   question: "L'expérimentation animale est-elle encore justifiable ?",      description: 'Progrès médical vs souffrance animale et alternatives.',                              icon: '🐁', category: 'ethique' },
  { id: 'euthanasie',              label: 'Euthanasie',                question: "L'euthanasie devrait-elle être légalisée ?",                   description: 'Dignité de fin de vie, consentement et dérives potentielles.',                        icon: '🕊️', category: 'ethique' },
  { id: 'transhumanisme',          label: 'Transhumanisme',            question: "Faut-il augmenter l'être humain par la technologie ?",         description: 'Implants, génie génétique et frontières de l\'humanité.',                             icon: '🧬', category: 'ethique' },
  { id: 'peine-de-mort',           label: 'Peine de mort',             question: 'La peine de mort est-elle moralement défendable ?',            description: 'Dissuasion, erreurs judiciaires et droits fondamentaux.',                             icon: '⚖️', category: 'ethique' },

  // ── Politique ──
  { id: 'democratie-directe',      label: 'Démocratie directe',        question: 'Faut-il remplacer la démocratie représentative ?',             description: 'Référendums, participation citoyenne et populisme.',                                  icon: '🗳️', category: 'politique' },
  { id: 'vote-obligatoire',        label: 'Vote obligatoire',          question: 'Le vote devrait-il être obligatoire ?',                       description: 'Abstention, légitimité démocratique et liberté individuelle.',                        icon: '📋', category: 'politique' },
  { id: 'union-europeenne',        label: 'Union Européenne',          question: "L'UE a-t-elle besoin de plus d'intégration ?",                 description: 'Fédéralisme, souveraineté nationale et solidarité européenne.',                       icon: '🇪🇺', category: 'politique' },
  { id: 'service-militaire',       label: 'Service militaire',         question: 'Faut-il rétablir le service militaire obligatoire ?',          description: 'Cohésion nationale, défense et liberté individuelle.',                                icon: '🎖️', category: 'politique' },

  // ── Économie ──
  { id: 'crypto',                  label: 'Cryptomonnaies',            question: 'Les cryptomonnaies remplaceront-elles les monnaies classiques ?', description: 'Décentralisation, volatilité et régulation financière.',                           icon: '₿',  category: 'economie' },
  { id: 'revenu-universel',        label: 'Revenu universel',          question: 'Le revenu universel est-il une utopie réaliste ?',             description: 'Automatisation, filet social et financement.',                                        icon: '💶', category: 'economie' },
  { id: 'decroissance',            label: 'Décroissance',              question: 'La décroissance est-elle compatible avec le progrès ?',        description: 'Limites planétaires, PIB et modèles alternatifs.',                                    icon: '📉', category: 'economie' },
  { id: 'libre-echange',           label: 'Libre-échange',             question: 'Le libre-échange profite-t-il à tous ?',                      description: 'Mondialisation, protectionnisme et inégalités.',                                      icon: '🚢', category: 'economie' },
  { id: 'taxe-robots',             label: 'Taxer les robots',          question: 'Faut-il taxer les robots qui remplacent des emplois ?',        description: 'Automatisation, financement social et compétitivité.',                                icon: '🤖', category: 'economie' },

  // ── Science ──
  { id: 'exploration-spatiale',    label: 'Exploration spatiale',      question: "L'exploration spatiale vaut-elle son coût ?",                  description: 'Budget, retombées technologiques et rêve d\'humanité.',                               icon: '🚀', category: 'science' },
  { id: 'nucleaire',               label: 'Nucléaire',                 question: "Le nucléaire est-il la solution au changement climatique ?",   description: 'Énergie bas carbone, déchets et risques d\'accident.',                                icon: '⚛️', category: 'science' },
  { id: 'ogm',                     label: 'OGM',                       question: 'Les OGM sont-ils une menace ou une opportunité ?',             description: 'Sécurité alimentaire, biodiversité et brevets.',                                      icon: '🌾', category: 'science' },
  { id: 'clonage',                 label: 'Clonage',                   question: 'Le clonage humain devrait-il être autorisé ?',                 description: 'Médecine régénérative, éthique et identité.',                                         icon: '🧪', category: 'science' },

  // ── Culture ──
  { id: 'art-ia',                  label: 'Art & IA',                  question: "Une œuvre générée par IA est-elle de l'art ?",                 description: 'Créativité, droits d\'auteur et valeur artistique.',                                  icon: '🎨', category: 'culture' },
  { id: 'jeux-video-violence',     label: 'Jeux vidéo & Violence',     question: 'Les jeux vidéo violents rendent-ils agressif ?',              description: 'Études contradictoires, catharsis et influence médiatique.',                          icon: '🎮', category: 'culture' },
  { id: 'streaming-cinema',        label: 'Streaming vs Cinéma',       question: 'Le streaming va-t-il tuer le cinéma ?',                       description: 'Salles obscures, exclusivités et démocratisation.',                                   icon: '🎬', category: 'culture' },
  { id: 'patrimoine-restitution',  label: 'Restitution du patrimoine', question: 'Faut-il restituer les œuvres d\'art coloniales ?',             description: 'Musées occidentaux, mémoire et justice historique.',                                  icon: '🏛️', category: 'culture' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTopicsByCategory(category: TopicCategory): Topic[] {
  return TOPICS.filter((t) => t.category === category);
}

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/** Deterministic daily topic — same for all users on a given day */
export function getDailyTopic(date?: Date): Topic {
  const d = date ?? new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return TOPICS[dayOfYear % TOPICS.length];
}

/** Get N random-looking topics for "trending" (deterministic per day) */
export function getTrendingTopics(count: number = 3, date?: Date): Topic[] {
  const d = date ?? new Date();
  const seed = d.getFullYear() * 1000 + Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const daily = getDailyTopic(d);
  const others = TOPICS.filter((t) => t.id !== daily.id);
  const result: Topic[] = [];
  for (let i = 0; i < Math.min(count, others.length); i++) {
    const idx = (seed * (i + 7) + 13) % others.length;
    const pick = others[idx];
    if (!result.find((r) => r.id === pick.id)) {
      result.push(pick);
    } else {
      result.push(others[(idx + 1) % others.length]);
    }
  }
  return result;
}
