import { useState, useMemo } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Card, Button, Badge } from '@/lib/ui';
import { Link } from '@tanstack/react-router';
import { BookOpen, GraduationCap, Trophy, ChevronRight, Zap, SlidersHorizontal } from 'lucide-react';
import problemsData from '../data/problems.json';
import pfeq5Batch1Rest from '../data/pfeq5-batch1-rest.json';
import pfeq5Batch2 from '../data/pfeq5-batch2.json';
import pfeq5Batch3 from '../data/pfeq5-batch3.json';
import { cn } from '@/lib/utils';
import { useSearch } from '@tanstack/react-router';
import { loadCustomProblems } from '../lib/adminStore';
import {
  MATH_DOMAINS,
  MATH_SUBCONCEPTS,
  SOCIAL_CONTEXTS,
  getProblemDomain,
  getProblemSubConcept,
  getDomainLabel,
  getSubConceptLabel,
} from '../lib/curriculum';

const DIFFICULTIES = [
  { id: 'facile', label: 'Facile', helper: 'Je débute ou je révise.' },
  { id: 'moyen', label: 'Moyen', helper: 'Je pratique avec un défi normal.' },
  { id: 'difficile', label: 'Difficile', helper: 'Je veux un problème plus long.' },
  { id: 'defi', label: 'Défi', helper: 'Je veux me dépasser.' },
] as const;

const getDifficultyLabel = (difficulty?: string) => {
  if (difficulty === 'defi') return 'Défi';
  return DIFFICULTIES.find(d => d.id === difficulty)?.label ?? difficulty ?? 'Moyen';
};

export function SelectPage() {
  const search = useSearch({ from: '/select' });
  const examMode = search.examMode;
  const [level, setLevel] = useState<number | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubConcept, setSelectedSubConcept] = useState<string | null>(null);
  const [selectedSocialContext, setSelectedSocialContext] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const allProblems = useMemo(() => {
    const custom = loadCustomProblems().filter(p => p.status === 'publie');
    return [
      ...(problemsData as any[]),
      ...(pfeq5Batch1Rest as any[]),
      ...(pfeq5Batch2 as any[]),
      ...(pfeq5Batch3 as any[]),
      ...custom,
    ];
  }, []);

  const visibleSubConcepts = useMemo(() => {
    if (!selectedDomain) return MATH_SUBCONCEPTS;
    return MATH_SUBCONCEPTS.filter(item => item.domain === selectedDomain);
  }, [selectedDomain]);

  const filteredProblems = allProblems.filter(problem => {
    const problemDomain = getProblemDomain(problem);
    const problemSubConcept = getProblemSubConcept(problem);
    const socialContext = (problem as any).socialStudiesContext || '';
    const difficulty = (problem as any).difficulty || 'moyen';

    if (level && problem.level !== level) return false;
    if (selectedDomain && problemDomain !== selectedDomain) return false;
    if (selectedSubConcept && problemSubConcept !== selectedSubConcept) return false;
    if (selectedSocialContext && socialContext !== selectedSocialContext) return false;
    if (selectedDifficulty && difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleDomainClick = (domainId: string) => {
    setSelectedDomain(selectedDomain === domainId ? null : domainId);
    setSelectedSubConcept(null);
  };

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between w-full">
          <PageTitle>Choisis ton défi</PageTitle>
          {examMode && (
            <Badge className="bg-yellow-500 text-white border-none px-4 py-1 animate-pulse flex gap-2">
              <Zap className="h-4 w-4" /> Mode Examen Activé
            </Badge>
          )}
        </div>
      </PageHeader>
      <PageBody className="space-y-8 pb-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            1. Choisis ton niveau
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button variant={level === 5 ? 'primary' : 'outline'} className="h-24 flex flex-col gap-1 rounded-2xl border-2" onClick={() => setLevel(5)}>
              <span className="text-3xl font-black">5e</span>
              <span className="text-sm font-medium">Année du primaire</span>
            </Button>
            <Button variant={level === 6 ? 'primary' : 'outline'} className="h-24 flex flex-col gap-1 rounded-2xl border-2" onClick={() => setLevel(6)}>
              <span className="text-3xl font-black">6e</span>
              <span className="text-sm font-medium">Année du primaire</span>
            </Button>
          </div>
        </section>

        <section className={cn("space-y-4 transition-all", !level && "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            2. Choisis une notion mathématique
          </h2>
          <p className="text-sm text-muted-foreground">
            Les catégories suivent les grands champs de la Progression des apprentissages : arithmétique, mesure, géométrie, statistique et probabilité.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {MATH_DOMAINS.map(domain => {
              const Icon = domain.icon;
              const selected = selectedDomain === domain.id;
              return (
                <Button key={domain.id} variant={selected ? 'primary' : 'outline'} className="h-20 flex flex-col gap-2 rounded-xl" onClick={() => handleDomainClick(domain.id)}>
                  <div className={cn("p-2 rounded-lg", selected ? 'bg-white/20 text-white' : domain.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider">{domain.label}</span>
                </Button>
              );
            })}
          </div>
        </section>

        <section className={cn("space-y-4 transition-all", !level && "opacity-30 pointer-events-none")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-base font-bold">Sous-notion ciblée</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant={!selectedSubConcept ? 'primary' : 'outline'} size="sm" className="rounded-full" onClick={() => setSelectedSubConcept(null)}>Toutes</Button>
                {visibleSubConcepts.map(item => (
                  <Button key={item.id} variant={selectedSubConcept === item.id ? 'primary' : 'outline'} size="sm" className="rounded-full" onClick={() => setSelectedSubConcept(selectedSubConcept === item.id ? null : item.id)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold">Contexte d’univers social</h3>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                <Button variant={!selectedSocialContext ? 'primary' : 'outline'} size="sm" className="rounded-full" onClick={() => setSelectedSocialContext(null)}>Tous</Button>
                {SOCIAL_CONTEXTS.map(context => (
                  <Button key={context} variant={selectedSocialContext === context ? 'primary' : 'outline'} size="sm" className="rounded-full" onClick={() => setSelectedSocialContext(selectedSocialContext === context ? null : context)}>
                    {context}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Niveau de difficulté
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Button variant={!selectedDifficulty ? 'primary' : 'outline'} className="h-auto min-h-16 flex flex-col items-start text-left gap-1 rounded-xl p-3" onClick={() => setSelectedDifficulty(null)}>
                <span className="font-bold">Tous</span>
                <span className="text-xs opacity-80">Voir tous les problèmes.</span>
              </Button>
              {DIFFICULTIES.map(difficulty => (
                <Button key={difficulty.id} variant={selectedDifficulty === difficulty.id ? 'primary' : 'outline'} className="h-auto min-h-16 flex flex-col items-start text-left gap-1 rounded-xl p-3" onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty.id ? null : difficulty.id)}>
                  <span className="font-bold">{difficulty.label}</span>
                  <span className="text-xs opacity-80">{difficulty.helper}</span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className={cn("space-y-6 transition-all", !level && "opacity-30 pointer-events-none")}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              3. Choisis un problème
            </h2>
            <Badge variant="secondary">{filteredProblems.length} problèmes trouvés</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map(problem => {
              const domain = getProblemDomain(problem);
              const subConcept = getProblemSubConcept(problem);
              const socialContext = (problem as any).socialStudiesContext;
              const difficulty = (problem as any).difficulty || 'moyen';
              return (
                <Card key={problem.id} className="p-6 hover:shadow-lg transition-all border-2 group hover:border-primary/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 flex flex-col items-end gap-1">
                    <Badge className="bg-primary/10 text-primary border-none">{problem.level}e année</Badge>
                    <Badge variant="outline" className="bg-white/90 text-[10px] font-bold uppercase">{getDifficultyLabel(difficulty)}</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 pr-20">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase">{getDomainLabel(domain)}</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{getSubConceptLabel(subConcept)}</Badge>
                      </div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{problem.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{problem.content}</p>
                    {socialContext && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">Univers social : {socialContext}</p>}
                    <Button asChild className="w-full mt-4 group-hover:bg-primary transition-all">
                      <Link to="/solve/$problemId" params={{ problemId: problem.id }}>
                        Commencer <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredProblems.length === 0 && level && (
            <div className="text-center py-12 bg-muted/50 rounded-2xl border-2 border-dashed">
              <p className="text-muted-foreground italic">Aucun problème ne correspond à tes critères. Essaie d'autres options !</p>
            </div>
          )}
        </section>
      </PageBody>
    </Page>
  );
}
