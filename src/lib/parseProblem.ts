/**
 * parseProblem.ts
 * Analyse un texte formaté avec des balises en majuscules et retourne
 * un objet partiel de formulaire prêt à remplir les champs admin.
 *
 * Format attendu :
 *   BALISE:
 *   contenu (peut être multi-lignes)
 *
 *   BALISE SUIVANTE:
 *   contenu...
 *
 * Balise combinée supportée :
 *   INDICE 1/2/3:
 *   Indice 1 : ...
 *   Indice 2 : ...
 *   Indice 3 : ...
 */

// ─── Mapping balise → valeur de notion ────────────────────────────────────────
const NOTION_MAP: Record<string, string> = {
  'nombres naturels':              'nombres-naturels',
  'nombre naturel':                'nombres-naturels',
  'fractions':                     'fractions',
  'fraction':                      'fractions',
  'nombres decimaux':              'decimaux',
  'nombres décimaux':              'decimaux',
  'nombre decimal':                'decimaux',
  'nombre décimal':                'decimaux',
  'decimaux':                      'decimaux',
  'pourcentages':                  'pourcentages',
  'pourcentage':                   'pourcentages',
  'operations':                    'operations',
  'opérations':                    'operations',
  'operation':                     'operations',
  'opération':                     'operations',
  'problemes a plusieurs etapes':  'multi-etapes',
  'problèmes à plusieurs étapes':  'multi-etapes',
  'plusieurs etapes':              'multi-etapes',
  'plusieurs étapes':              'multi-etapes',
  'multi-etapes':                  'multi-etapes',
  'argent':                        'argent',
  'mesure':                        'mesure',
  'temps':                         'temps',
  'aire et perimetre':             'aire-perimetre',
  'aire et périmètre':             'aire-perimetre',
  'aire-perimetre':                'aire-perimetre',
  'volume simple':                 'volume',
  'volume':                        'volume',
  'geometrie':                     'geometrie',
  'géométrie':                     'geometrie',
  'tableaux et diagrammes':        'tableaux-diagrammes',
  'tableau':                       'tableaux-diagrammes',
  'diagrammes':                    'tableaux-diagrammes',
  'moyenne':                       'moyenne',
  'proportionnalite':              'proportionnalite',
  'proportionnalité':              'proportionnalite',
  'proportionnalite simple':       'proportionnalite',
  'proportionnalité simple':       'proportionnalite',
};

// ─── Mapping niveau ────────────────────────────────────────────────────────────
function parseNiveau(raw: string): number {
  const s = raw.toLowerCase().trim();
  if (s.includes('5')) return 5;
  if (s.includes('6')) return 6;
  return 6; // défaut
}

// ─── Mapping difficulté ───────────────────────────────────────────────────────
function parseDifficulte(raw: string): 'facile' | 'moyen' | 'difficile' | 'defi' {
  const s = raw.toLowerCase().trim();
  if (s.includes('facile'))              return 'facile';
  if (s.includes('difficile'))          return 'difficile';
  if (s.includes('defi') || s.includes('défi')) return 'defi';
  return 'moyen'; // défaut
}

// ─── Mapping notion ───────────────────────────────────────────────────────────
function parseNotion(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (NOTION_MAP[s]) return NOTION_MAP[s];
  for (const [key, val] of Object.entries(NOTION_MAP)) {
    if (s.includes(key) || key.includes(s)) return val;
  }
  return s.replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ôò]/g, 'o');
}

// ─── Résultat du parsing ──────────────────────────────────────────────────────
export interface ParseResult {
  ok: boolean;
  missingFields: string[];
  fields: {
    titre?: string;
    niveau?: number;
    notion?: string;
    difficulte?: 'facile' | 'moyen' | 'difficile' | 'defi';
    enonce?: string;
    question?: string;
    donnees?: string;
    operations?: string;
    corrige?: string;
    reponsefinale?: string;
    phrasereponse?: string;
    indice1?: string;
    indice2?: string;
    indice3?: string;
    retroaction?: string;
  };
}

// ─── Sections obligatoires ────────────────────────────────────────────────────
const REQUIRED_SECTIONS = [
  'TITRE',
  'NIVEAU',
  'NOTION',
  'DIFFICULTE',
  'ENONCE',
  'QUESTION',
  'DONNEES IMPORTANTES',
  'OPERATIONS ATTENDUES',
  'CORRIGE',
  'REPONSE FINALE',
  'PHRASE-REPONSE',
];

// ─── Normalise une balise (retire accents) pour la comparaison ─────────────
function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ─── Regex pour détecter les balises de section ─────────────────────────────
// IMPORTANT : les lignes internes "Indice 1 :", "Indice 2 :", "Indice 3 :"
// NE sont PAS des balises de section — elles sont des marqueurs à l'intérieur
// du corps de la section INDICE 1/2/3. On ne les inclut donc pas ici.
//
// Formats supportés pour la balise d'indices :
//   INDICE 1/2/3:   (combiné — le plus courant)
//   INDICE 1:       (séparé — fallback, mais sans conflit interne)
const TAG_REGEX =
  /^(TITRE|NIVEAU|NOTION|DIFFICULT[EÉ]|[EÉ]NONC[EÉ]|QUESTION|DONN[EÉ]ES IMPORTANTES|OP[EÉ]RATIONS ATTENDUES|CORRIG[EÉ]|R[EÉ]PONSE FINALE|PHRASE-R[EÉ]PONSE|INDICE\s+[123][\/][123](?:[\/][123])?|R[EÉ]TROACTION)\s*:/i;

/**
 * Découpe le corps d'une section "INDICE 1/2/3:" en trois indices séparés.
 * Cherche les marqueurs "Indice 1 :", "Indice 2 :", "Indice 3 :" et extrait
 * le texte situé entre chaque marqueur.
 *
 * Exemple de corps attendu :
 *   "Indice 1 : Transforme d'abord...\n\nIndice 2 : Additionne...\n\nIndice 3 : Compare..."
 */
function splitIndices(body: string): { i1?: string; i2?: string; i3?: string } {
  // Collecte les positions (index de début du marqueur + index de fin du marqueur)
  const markerRegex = /Indice\s+([123])\s*:/gi;
  let m: RegExpExecArray | null;
  const markers: Array<{ n: number; start: number; contentStart: number }> = [];

  while ((m = markerRegex.exec(body)) !== null) {
    markers.push({
      n:            parseInt(m[1]),
      start:        m.index,
      contentStart: m.index + m[0].length,
    });
  }

  if (markers.length === 0) return {};

  const result: { i1?: string; i2?: string; i3?: string } = {};

  for (let i = 0; i < markers.length; i++) {
    // Le texte de cet indice va de contentStart jusqu'au début du marqueur suivant
    const textEnd = i + 1 < markers.length ? markers[i + 1].start : body.length;
    const text = body.slice(markers[i].contentStart, textEnd).trim();
    if (!text) continue;
    if (markers[i].n === 1) result.i1 = text;
    if (markers[i].n === 2) result.i2 = text;
    if (markers[i].n === 3) result.i3 = text;
  }

  return result;
}

// ─── Parsing principal ────────────────────────────────────────────────────────
export function parseProblemText(text: string): ParseResult {
  const lines = text.split('\n');

  const sections: Record<string, string> = {};
  let currentTag: string | null = null;
  const currentLines: string[] = [];

  const flushCurrent = () => {
    if (currentTag !== null) {
      sections[currentTag] = currentLines.join('\n').trim();
    }
  };

  for (const line of lines) {
    const match = line.match(TAG_REGEX);
    if (match) {
      flushCurrent();
      currentTag = normalize(match[1]);
      currentLines.length = 0;
    } else if (currentTag !== null) {
      currentLines.push(line);
    }
  }
  flushCurrent();

  // Retrouve une valeur par nom normalisé
  const get = (key: string): string | undefined => {
    const norm = normalize(key);
    for (const [k, v] of Object.entries(sections)) {
      if (normalize(k) === norm) return v || undefined;
    }
    return undefined;
  };

  const getAny = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = get(k);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  const titreRaw      = getAny('TITRE');
  const niveauRaw     = getAny('NIVEAU');
  const notionRaw     = getAny('NOTION');
  const difficulteRaw = getAny('DIFFICULTÉ', 'DIFFICULTE');
  const enonceRaw     = getAny('ÉNONCÉ', 'ENONCE');
  const questionRaw   = getAny('QUESTION');
  const donneesRaw    = getAny('DONNÉES IMPORTANTES', 'DONNEES IMPORTANTES');
  const operationsRaw = getAny('OPÉRATIONS ATTENDUES', 'OPERATIONS ATTENDUES');
  const corrigeRaw    = getAny('CORRIGÉ', 'CORRIGE');
  const reponseFRaw   = getAny('RÉPONSE FINALE', 'REPONSE FINALE');
  const phraseRRaw    = getAny('PHRASE-RÉPONSE', 'PHRASE-REPONSE');
  const retroactionRaw = getAny('RÉTROACTION', 'RETROACTION');

  // ─── Indices ─────────────────────────────────────────────────────────────────
  // Priorité 1 : balise combinée INDICE 1/2/3: (format standard)
  //   → la clé normalisée commence par "INDICE" et contient "/"
  //   → splitIndices() découpe le corps en trois
  // Priorité 2 : balises séparées INDICE 1:, INDICE 2:, INDICE 3:
  //   (uniquement si le format combiné est absent de TAG_REGEX)
  let indice1Raw: string | undefined;
  let indice2Raw: string | undefined;
  let indice3Raw: string | undefined;

  const combinedKey = Object.keys(sections).find(k =>
    k.startsWith('INDICE') && k.includes('/')
  );
  if (combinedKey && sections[combinedKey]) {
    const { i1, i2, i3 } = splitIndices(sections[combinedKey]);
    indice1Raw = i1;
    indice2Raw = i2;
    indice3Raw = i3;
  } else {
    // Fallback : indices dans des sections séparées (ex: "INDICE 1:", "INDICE 2:", "INDICE 3:")
    // Possible seulement si ces balises sont dans TAG_REGEX (non incluses actuellement
    // pour éviter le conflit avec les marqueurs internes).
    // On garde ce fallback pour la compatibilité future.
    indice1Raw = getAny('INDICE 1');
    indice2Raw = getAny('INDICE 2');
    indice3Raw = getAny('INDICE 3');
  }

  // ─── Validation des sections obligatoires ────────────────────────────────
  const missing: string[] = [];
  if (!titreRaw)      missing.push('TITRE');
  if (!niveauRaw)     missing.push('NIVEAU');
  if (!notionRaw)     missing.push('NOTION');
  if (!difficulteRaw) missing.push('DIFFICULTÉ');
  if (!enonceRaw)     missing.push('ÉNONCÉ');
  if (!questionRaw)   missing.push('QUESTION');
  if (!donneesRaw)    missing.push('DONNÉES IMPORTANTES');
  if (!operationsRaw) missing.push('OPÉRATIONS ATTENDUES');
  if (!corrigeRaw)    missing.push('CORRIGÉ');
  if (!reponseFRaw)   missing.push('RÉPONSE FINALE');
  if (!phraseRRaw)    missing.push('PHRASE-RÉPONSE');

  return {
    ok: missing.length === 0,
    missingFields: missing,
    fields: {
      titre:         titreRaw,
      niveau:        niveauRaw     ? parseNiveau(niveauRaw)        : undefined,
      notion:        notionRaw     ? parseNotion(notionRaw)        : undefined,
      difficulte:    difficulteRaw ? parseDifficulte(difficulteRaw): undefined,
      enonce:        enonceRaw,
      question:      questionRaw,
      donnees:       donneesRaw,
      operations:    operationsRaw,
      corrige:       corrigeRaw,
      reponsefinale: reponseFRaw,
      phrasereponse: phraseRRaw,
      indice1:       indice1Raw,
      indice2:       indice2Raw,
      indice3:       indice3Raw,
      retroaction:   retroactionRaw,
    },
  };
}

export { REQUIRED_SECTIONS };