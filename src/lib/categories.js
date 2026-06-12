// Source unique pour toutes les catégories de l'application
// Importez depuis ce fichier dans CategoryChart, TransactionForm, TransactionList, etc.

export const CATEGORY_LABELS = {
  // Revenus
  salaire:       'Salaire',
  freelance:     'Freelance',
  investissement:'Investissement',
  vente:         'Vente',
  // Dépenses
  logement:      'Logement',
  loyer:         'Loyer',           // rétrocompatibilité anciennes données
  courses:       'Courses',
  alimentation:  'Alimentation',
  restaurant_bar:'Restaurant & Bar',
  transport:     'Transport',
  loisirs:       'Loisirs',
  sante:         'Santé',
  education:     'Éducation',
  services:      'Services',
  impots:        'Impôts',
  epargne:       'Épargne',
  dettes:        'Dettes',
  autre:         'Autre',
  global:        'Global',
};

export const CATEGORIES_REVENU = [
  { value: 'salaire',        label: 'Salaire' },
  { value: 'freelance',      label: 'Freelance' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'vente',          label: 'Vente' },
  { value: 'autre',          label: 'Autre' },
];

export const CATEGORIES_DEPENSE = [
  { value: 'logement',       label: 'Logement' },
  { value: 'courses',        label: 'Courses' },
  { value: 'alimentation',   label: 'Alimentation' },
  { value: 'restaurant_bar', label: 'Restaurant & Bar' },
  { value: 'transport',      label: 'Transport' },
  { value: 'loisirs',        label: 'Loisirs' },
  { value: 'sante',          label: 'Santé' },
  { value: 'education',      label: 'Éducation' },
  { value: 'services',       label: 'Services' },
  { value: 'impots',         label: 'Impôts' },
  { value: 'epargne',        label: 'Épargne' },
  { value: 'dettes',         label: 'Dettes' },
  { value: 'autre',          label: 'Autre' },
];

// Toutes les catégories (dédupliquées) — utile pour les filtres
export const ALL_CATEGORIES = [
  ...CATEGORIES_REVENU,
  ...CATEGORIES_DEPENSE,
].filter((c, i, arr) => arr.findIndex(x => x.value === c.value) === i);
