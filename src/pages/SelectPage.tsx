import { useState, useMemo } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Card, Button, Badge } from '@blinkdotnew/ui';
import { Link } from '@tanstack/react-router';
import { BookOpen, GraduationCap, Trophy, ChevronRight, Hash, Ruler, Clock, Coins, Square, PieChart, BarChart, Zap } from 'lucide-react';
import problemsData from '../data/problems.json';
import { cn } from '@/lib/utils';
import { useSearch } from '@tanstack/react-router';
import { loadCustomProblems } from '../lib/adminStore';

const THEMES = [
  { id: 'arithmetique', label: 'Arithmétique', icon: <Hash className="h-5 w-5" />, color: 'bg-blue-100 text-blue-700' },
  { id: 'argent', label: 'Argent & Budget', icon: <Coins className="h-5 w-5" />, color: 'bg-green-100 text-green-700' },
  { id: 'mesure', label: 'Mesure', icon: <Ruler className="h-5 w-5" />, color: 'bg-orange-100 text-orange-700' },
  { id: 'geometrie', label: 'Géométrie', icon: <Square className="h-5 w-5" />, color: 'bg-purple-100 text-purple-700' },
  { id: 'fractions', label: 'Fractions', icon: <PieChart className="h-5 w-5" />, color: 'bg-pink-100 text-pink-700' },
  { id: 'statistiques', label: 'Statistiques', icon: <BarChart className="h-5 w-5" />, color: 'bg-indigo-100 text-indigo-700' },
];

export function SelectPage() {
  const search = useSearch({ from: '/select' });
  const examMode = search.examMode;
  const [level, setLevel] = useState<number | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const allProblems = useMemo(() => {
    const custom = loadCustomProblems().filter(p => p.status === 'publie');
    // Map custom problems to match the schema if necessary
    return [...problemsData, ...custom];
  }, []);

  const filteredProblems = allProblems.filter(p => {
    if (level && p.level !== level) return false;
    if (selectedTheme && p.theme !== selectedTheme) return false;
    return true;
  });

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
      <PageBody className="space-y-12 pb-12">
        {/* Level Selection */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            1. Choisis ton niveau
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button
              variant={level === 5 ? 'primary' : 'outline'}
              className="h-32 flex flex-col gap-2 rounded-2xl border-2"
              onClick={() => setLevel(5)}
            >
              <span className="text-4xl font-black">5e</span>
              <span className="text-sm font-medium">Année du primaire</span>
            </Button>
            <Button
              variant={level === 6 ? 'primary' : 'outline'}
              className="h-32 flex flex-col gap-2 rounded-2xl border-2"
              onClick={() => setLevel(6)}
            >
              <span className="text-4xl font-black">6e</span>
              <span className="text-sm font-medium">Année du primaire</span>
            </Button>
          </div>
        </section>

        {/* Theme Selection */}
        <section className={cn("space-y-6 transition-all", !level && "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            2. Choisis un thème (optionnel)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {THEMES.map(theme => (
              <Button
                key={theme.id}
                variant={selectedTheme === theme.id ? 'primary' : 'outline'}
                className="h-24 flex flex-col gap-2 rounded-xl"
                onClick={() => setSelectedTheme(selectedTheme === theme.id ? null : theme.id)}
              >
                <div className={cn("p-2 rounded-lg", theme.color)}>{theme.icon}</div>
                <span className="text-[10px] uppercase font-bold tracking-wider">{theme.label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Problems Grid */}
        <section className={cn("space-y-6 transition-all", !level && "opacity-30 pointer-events-none")}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              3. Choisis un problème
            </h2>
            <Badge variant="secondary">{filteredProblems.length} problèmes trouvés</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map(problem => (
              <Card key={problem.id} className="p-6 hover:shadow-lg transition-all border-2 group hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                   <Badge className="bg-primary/10 text-primary border-none">{problem.level}e année</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{problem.theme}</p>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{problem.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {problem.content}
                  </p>
                  <Button asChild className="w-full mt-4 group-hover:bg-primary transition-all">
                    <Link to="/solve/$problemId" params={{ problemId: problem.id }}>
                      Commencer <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
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
