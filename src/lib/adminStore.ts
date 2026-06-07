const KEY = 'resous_custom_problems';
const AUTH_KEY = 'resous_admin_auth';

// ⚠️  MOT DE PASSE D'ESSAI SEULEMENT
// Le mot de passe ci-dessous est temporaire, utilisé pour la version de démonstration.
// IMPORTANT : avant tout déploiement public, remplacer cette authentification simple
// par un système sécurisé (ex. : vérification serveur, Supabase Auth, bcrypt, etc.).
// Ne jamais utiliser un mot de passe en clair en production.
const ADMIN_PASSWORD = 'admin';

export interface AdminProblem {
  id: string;
  title: string;
  level: number;
  theme: string;
  difficulty: 'facile' | 'moyen' | 'difficile' | 'defi';
  status: 'brouillon' | 'publie';
  content: string;
  question: string;
  /** Image optionnelle pour soutenir la compréhension de l'énoncé */
  imageUrl?: string;
  /** Description courte de l'image pour l'accessibilité */
  imageAlt?: string;
  /** Légende optionnelle affichée sous l'image */
  imageCaption?: string;
  solution_data: {
    steps_count: number;
    /** Données importantes — une entrée par ligne */
    operations: string[];
    /** Opérations attendues — ex: "addition, division" */
    expected_operations: string;
    /** Rétroaction pédagogique */
    feedback: string;
    final_answer: string;
    expected_steps: string[];
    expected_calculations: string;
    model_answer: string;
    /** @deprecated Anciennement utilisé pour ops+rétroaction — conservé pour compatibilité */
    estimation?: string;
  };
  hints: {
    level1: string;
    level2: string;
    level3: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function isAdmin(): boolean {
  return localStorage.getItem(AUTH_KEY) === ADMIN_PASSWORD;
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, ADMIN_PASSWORD);
    return true;
  }
  return false;
}

export function adminLogout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function loadCustomProblems(): AdminProblem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCustomProblems(problems: AdminProblem[]): void {
  localStorage.setItem(KEY, JSON.stringify(problems));
}
