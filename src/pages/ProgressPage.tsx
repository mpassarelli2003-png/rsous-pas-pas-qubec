import { useState, useEffect } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Card, Button, Badge, Progress } from '@/lib/ui';
import { CheckCircle2, XCircle, Target, TrendingUp, Lightbulb, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { loadProgress, saveProgress, type CompletedProblem } from '../lib/progressStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STEP_LABELS = [
  { key: 'reading', label: 'Lecture' },
  { key: 'questionIdentified', label: 'Question identifiée' },
  { key: 'dataIdentified', label: 'Données identifiées' },
  { key: 'planning', label: 'Planification' },
  { key: 'calculations', label: 'Calculs' },
  { key: 'finalAnswer', label: 'Phrase-réponse' },
];

function StatsCards({ problems }: { problems: CompletedProblem[] }) {
  const total = problems.length;
  const correct = problems.filter(p => p.isCorrect).length;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgHints = total > 0 ? (problems.reduce((s, p) => s + p.hintsUsed, 0) / total).toFixed(1) : '0';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-5 border-2 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Problèmes terminés</p>
          <p className="text-3xl font-black">{total}</p>
        </div>
      </Card>
      <Card className="p-5 border-2 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Réussis</p>
          <p className="text-3xl font-black">{correct}</p>
        </div>
      </Card>
      <Card className="p-5 border-2 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Taux de réussite</p>
          <p className="text-3xl font-black">{rate}%</p>
        </div>
      </Card>
      <Card className="p-5 border-2 flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Indices en moyenne</p>
          <p className="text-3xl font-black">{avgHints}</p>
        </div>
      </Card>
    </div>
  );
}

function StepProgressBar({ problems }: { problems: CompletedProblem[] }) {
  const total = problems.length;
  if (total === 0) return null;

  return (
    <Card className="p-6 border-2 space-y-5">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Progression par étape
      </h3>
      <div className="space-y-4">
        {STEP_LABELS.map(({ key, label }) => {
          const count = problems.filter(p => p.stepScores[key as keyof CompletedProblem['stepScores']]).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-sm font-medium">
                <span>{label}</span>
                <span className={cn('font-bold', pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-orange-500' : 'text-red-500')}>
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HistoryRow({ p }: { p: CompletedProblem }) {
  const [open, setOpen] = useState(false);
  const dateStr = (() => {
    try { return format(new Date(p.date), 'd MMM yyyy', { locale: fr }); }
    catch { return p.date; }
  })();

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="shrink-0">{p.isCorrect
          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
          : <XCircle className="h-5 w-5 text-red-400" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="font-semibold text-sm truncate block">{p.title}</span>
          <span className="text-xs text-muted-foreground">{dateStr} · {p.level} année · {p.theme}</span>
        </span>
        <Badge variant={p.isCorrect ? 'default' : 'secondary'} className={cn('shrink-0 text-xs', p.isCorrect ? 'bg-green-100 text-green-700 border-green-200' : '')}>
          {p.isCorrect ? 'Réussi' : 'À retravailler'}
        </Badge>
        <span className="shrink-0 text-muted-foreground ml-1">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-muted/20 space-y-3 border-t text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Ta réponse</p>
              <p className="italic text-foreground">{p.studentAnswer || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Réponse attendue</p>
              <p className="text-green-700 font-medium">{p.correctAnswer || '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Score : <strong>{p.score}/100</strong></span>
            <span className="text-xs text-muted-foreground">Indices utilisés : <strong>{p.hintsUsed}</strong></span>
          </div>
          {p.needsPractice?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">À retravailler</p>
              <div className="flex flex-wrap gap-1">
                {p.needsPractice.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProgressPage() {
  const [problems, setProblems] = useState<CompletedProblem[]>([]);

  useEffect(() => {
    setProblems(loadProgress());
  }, []);

  const isEmpty = problems.length === 0;

  return (
    <Page>
      <PageHeader>
        <PageTitle>Mes Progrès</PageTitle>
        {problems.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm('Effacer tout l\'historique ? Cette action est irréversible.')) {
                saveProgress([]);
                setProblems([]);
              }
            }}
          >
            Effacer l'historique
          </Button>
        )}
      </PageHeader>
      <PageBody className="space-y-8 pb-12">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-bold">Aucun progrès pour l'instant</h2>
              <p className="text-muted-foreground">
                Tu n'as pas encore terminé de problème. Commence un premier problème pour voir tes progrès ici.
              </p>
            </div>
            <Button asChild>
              <Link to="/select">Choisir un problème</Link>
            </Button>
          </div>
        ) : (
          <>
            <StatsCards problems={problems} />
            <StepProgressBar problems={problems} />
            <div className="space-y-3">
              <h3 className="text-lg font-bold">Historique</h3>
              <div className="space-y-2">
                {[...problems].reverse().map(p => (
                  <HistoryRow key={p.id} p={p} />
                ))}
              </div>
            </div>
          </>
        )}
      </PageBody>
    </Page>
  );
}
