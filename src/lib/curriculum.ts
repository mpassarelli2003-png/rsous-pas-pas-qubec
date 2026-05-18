import { Hash, Ruler, Square, BarChart, Dice5 } from 'lucide-react';

export const MATH_DOMAINS = [
  { id: 'arithmetique', label: 'Arithmétique', icon: Hash, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { id: 'mesure', label: 'Mesure', icon: Ruler, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { id: 'geometrie', label: 'Géométrie', icon: Square, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { id: 'statistique', label: 'Statistique', icon: BarChart, color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  { id: 'probabilite', label: 'Probabilité', icon: Dice5, color: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
] as const;

export const MATH_SUBCONCEPTS = [
  { id: 'nombres-naturels', label: 'Nombres naturels', domain: 'arithmetique' },
  { id: 'nombres-decimaux', label: 'Nombres décimaux', domain: 'arithmetique' },
  { id: 'fractions', label: 'Fractions', domain: 'arithmetique' },
  { id: 'pourcentages', label: 'Pourcentages', domain: 'arithmetique' },
  { id: 'nombres-entiers', label: 'Nombres entiers', domain: 'arithmetique' },
  { id: 'sens-operations', label: 'Sens des opérations', domain: 'arithmetique' },
  { id: 'addition', label: 'Addition', domain: 'arithmetique' },
  { id: 'soustraction', label: 'Soustraction', domain: 'arithmetique' },
  { id: 'multiplication', label: 'Multiplication', domain: 'arithmetique' },
  { id: 'division', label: 'Division', domain: 'arithmetique' },
  { id: 'ordre-operations', label: 'Ordre des opérations', domain: 'arithmetique' },
  { id: 'estimation', label: 'Estimation et approximation', domain: 'arithmetique' },
  { id: 'proportionnalite', label: 'Proportionnalité simple', domain: 'arithmetique' },
  { id: 'longueur', label: 'Longueur', domain: 'mesure' },
  { id: 'perimetre', label: 'Périmètre', domain: 'mesure' },
  { id: 'aire', label: 'Aire', domain: 'mesure' },
  { id: 'masse', label: 'Masse', domain: 'mesure' },
  { id: 'capacite', label: 'Capacité', domain: 'mesure' },
  { id: 'temps', label: 'Temps', domain: 'mesure' },
  { id: 'temperature', label: 'Température', domain: 'mesure' },
  { id: 'monnaie', label: 'Monnaie', domain: 'mesure' },
  { id: 'unites-mesure', label: 'Unités de mesure', domain: 'mesure' },
  { id: 'figures-planes', label: 'Figures planes', domain: 'geometrie' },
  { id: 'solides', label: 'Solides', domain: 'geometrie' },
  { id: 'angles', label: 'Angles', domain: 'geometrie' },
  { id: 'polygones', label: 'Polygones', domain: 'geometrie' },
  { id: 'reperage-espace', label: 'Repérage dans l’espace', domain: 'geometrie' },
  { id: 'symetrie', label: 'Symétrie', domain: 'geometrie' },
  { id: 'tableau', label: 'Tableau', domain: 'statistique' },
  { id: 'diagramme-bandes', label: 'Diagramme à bandes', domain: 'statistique' },
  { id: 'diagramme-pictogrammes', label: 'Diagramme à pictogrammes', domain: 'statistique' },
  { id: 'diagramme-ligne', label: 'Diagramme à ligne brisée', domain: 'statistique' },
  { id: 'moyenne', label: 'Moyenne arithmétique', domain: 'statistique' },
  { id: 'comparaison-donnees', label: 'Comparaison de données', domain: 'statistique' },
  { id: 'probabilite-simple', label: 'Probabilité simple', domain: 'probabilite' },
  { id: 'comparer-probabilites', label: 'Comparer des probabilités', domain: 'probabilite' },
] as const;

export const SOCIAL_CONTEXTS = [
  'Société canadienne vers 1820',
  'Société québécoise vers 1905',
  'Société québécoise vers 1980',
  'Société canadienne entre 1745 et 1820',
  'Société canadienne et société québécoise entre 1820 et 1905',
  'Société québécoise entre 1905 et 1980',
  'Prairies vers 1905',
  'Côte Ouest vers 1905',
  'Société québécoise et société non démocratique vers 1980',
  'Micmacs et Inuits vers 1980',
  'Territoire',
  'Population',
  'Transport',
  'Ressources naturelles',
  'Activités économiques',
  'Changements sociaux',
] as const;

export const LEGACY_THEME_TO_DOMAIN: Record<string, string> = {
  arithmetique: 'arithmetique',
  'nombres-naturels': 'arithmetique',
  fractions: 'arithmetique',
  decimaux: 'arithmetique',
  'nombres-decimaux': 'arithmetique',
  pourcentages: 'arithmetique',
  operations: 'arithmetique',
  'multi-etapes': 'arithmetique',
  proportionnalite: 'arithmetique',
  argent: 'mesure',
  mesure: 'mesure',
  temps: 'mesure',
  'aire-perimetre': 'mesure',
  volume: 'mesure',
  geometrie: 'geometrie',
  statistiques: 'statistique',
  'tableaux-diagrammes': 'statistique',
  moyenne: 'statistique',
  probabilite: 'probabilite',
};

export const LEGACY_THEME_TO_SUBCONCEPT: Record<string, string> = {
  arithmetique: 'sens-operations',
  'nombres-naturels': 'nombres-naturels',
  fractions: 'fractions',
  decimaux: 'nombres-decimaux',
  'nombres-decimaux': 'nombres-decimaux',
  pourcentages: 'pourcentages',
  operations: 'sens-operations',
  'multi-etapes': 'sens-operations',
  proportionnalite: 'proportionnalite',
  argent: 'monnaie',
  mesure: 'unites-mesure',
  temps: 'temps',
  'aire-perimetre': 'perimetre',
  volume: 'capacite',
  geometrie: 'figures-planes',
  statistiques: 'tableau',
  'tableaux-diagrammes': 'tableau',
  moyenne: 'moyenne',
  probabilite: 'probabilite-simple',
};

export function getProblemDomain(problem: { mathDomain?: string; theme?: string }) {
  return problem.mathDomain || LEGACY_THEME_TO_DOMAIN[problem.theme || ''] || problem.theme || 'arithmetique';
}

export function getProblemSubConcept(problem: { subConcept?: string; theme?: string }) {
  return problem.subConcept || LEGACY_THEME_TO_SUBCONCEPT[problem.theme || ''] || problem.theme || 'sens-operations';
}

export function getDomainLabel(id: string) {
  return MATH_DOMAINS.find(d => d.id === id)?.label ?? id;
}

export function getSubConceptLabel(id: string) {
  return MATH_SUBCONCEPTS.find(s => s.id === id)?.label ?? id;
}
