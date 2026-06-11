import { useState, useMemo, useEffect } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Button, Progress } from '@/lib/ui';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, CheckCircle2, Home, Lightbulb, RotateCcw, Save } from 'lucide-react';
import problemsData from '../data/problems.json';
import pfeq5Batch1Rest from '../data/pfeq5-batch1-rest.json';
import pfeq5Batch2 from '../data/pfeq5-batch2.json';
import pfeq5Batch3 from '../data/pfeq5-batch3.json';
import { addCompletedProblem } from '../lib/progressStore';
import { loadCustomProblems } from '../lib/adminStore';

// Step Components
import { Step1Read } from '../components/solve/Step1Read';
import { Step2Question } from '../components/solve/Step2Question';
import { Step3Knowledge } from '../components/solve/Step3Knowledge';
import { Step4Plan } from '../components/solve/Step4Plan';
import { Step5Solve } from '../components/solve/Step5Solve';
import { Step6Answer } from '../components/solve/Step6Answer';
import { ProblemBanner } from '../components/solve/ProblemBanner';
import { HintPanel } from '../components/solve/HintPanel';

const STEPS = [
  { id: 1, title: 'Je lis' },
  { id: 2, title: 'Ce que je cherche' },
  { id: 3, title: 'Ce que je sais' },
  { id: 4, title: 'Je planifie' },
  { id: 5, title: 'Ma démarche' },
  { id: 6, title: 'Ma réponse' },
];

const getDraftKey = (problemId: string) => `resous_draft_${problemId}`;

function loadDraft(problemId: string) {
  try {
    const raw = localStorage.getItem(getDraftKey(problemId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function SolvePage() {
  const { problemId } = useParams({ from: '/solve/$problemId' });
  const navigate = useNavigate();
  const draft = useMemo(() => loadDraft(problemId), [problemId]);
  const [currentStep, setCurrentStep] = useState(() => draft?.currentStep || 1);
  const [answers, setAnswers] = useState<any>(() => draft?.answers || {});
  const [highlightedTokenIds, setHighlightedTokenIds] = useState<string[]>(() => draft?.highlightedTokenIds || []);
  const [strikethroughTokenIds, setStrikethroughTokenIds] = useState<string[]>(() => draft?.strikethroughTokenIds || []);
  const [markMode, setMarkMode] = useState<'highlight' | 'strike'>(() => draft?.markMode || 'highlight');

  const [hintOpen, setHintOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(() => draft?.hintLevel || 1);
  const [hintsUsedCount, setHintsUsedCount] = useState(() => draft?.hintsUsedCount || 0);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => draft?.savedAt || null);

  useEffect(() => {
    const payload = {
      currentStep,
      answers,
      highlightedTokenIds,
      strikethroughTokenIds,
      markMode,
      hintLevel,
      hintsUsedCount,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(getDraftKey(problemId), JSON.stringify(payload));
      setLastSavedAt(payload.savedAt);
    } catch {
      // Si le stockage local est plein ou indisponible, l'app continue de fonctionner.
    }
  }, [problemId, currentStep, answers, highlightedTokenIds, strikethroughTokenIds, markMode, hintLevel, hintsUsedCount]);

  const allProblems = useMemo(() => {
    const custom = loadCustomProblems()
      .filter(p => p.status === 'publie')
      .map(p => ({ ...p }));
    return [
      ...(problemsData as any[]),
      ...(pfeq5Batch1Rest as any[]),
      ...(pfeq5Batch2 as any[]),
      ...(pfeq5Batch3 as any[]),
      ...custom,
    ];
  }, []);

  const problem = useMemo(() => {
    return allProblems.find((p) => p.id === problemId);
  }, [allProblems, problemId]);

  if (!problem) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Problème non trouvé</PageTitle>
        </PageHeader>
        <PageBody className="flex flex-col items-center justify-center py-20 gap-4">
          <p>Désolé, ce problème n'existe pas.</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </PageBody>
      </Page>
    );
  }

  const handleNext = () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setMarkMode('highlight');
      setHintOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const nextStep = currentStep - 1;
      setCurrentStep(nextStep);
      setMarkMode('highlight');
      setHintOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const updateAnswer = (stepId: number, data: any) => {
    setAnswers((prev: any) => ({ ...prev, [stepId]: data }));
  };

  const toggleHighlight = (tokenId: string) => {
    setStrikethroughTokenIds(prev => prev.filter(id => id !== tokenId));
    setHighlightedTokenIds(prev =>
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  const toggleStrikethrough = (tokenId: string) => {
    setHighlightedTokenIds(prev => prev.filter(id => id !== tokenId));
    setStrikethroughTokenIds(prev =>
      prev.includes(tokenId)
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  const handleResetDraft = () => {
    const ok = window.confirm('Effacer toute la démarche de ce problème et recommencer à zéro ?');
    if (!ok) return;

    localStorage.removeItem(getDraftKey(problemId));
    setCurrentStep(1);
    setAnswers({});
    setHighlightedTokenIds([]);
    setStrikethroughTokenIds([]);
    setMarkMode('highlight');
    setHintOpen(false);
    setHintLevel(1);
    setHintsUsedCount(0);
    setLastSavedAt(null);
    window.scrollTo(0, 0);
  };

  const handleFinish = () => {
    const studentAnswer = answers[6]?.answer || '';
    const correctAnswer = problem?.solution_data.final_answer || '';
    const modelNumbers = correctAnswer.match(/\d+[,.]?\d*/g) || [];
    const studentNumbers = studentAnswer.match(/\d+[,.]?\d*/g) || [];
    const isCorrect = modelNumbers.length > 0 && modelNumbers.some((n: string) => studentNumbers.includes(n));

    const stepScores = {
      reading: !!(answers[1]?.readCount?.read1 && answers[1]?.readCount?.read2),
      questionIdentified: (answers[2]?.answer?.length || 0) > 5,
      dataIdentified: !!(answers[3]?.important?.trim()),
      planning: !!(answers[4]?.planRows?.length > 0 && answers[4]?.planRows[0]?.action),
      calculations: !!(answers[5]?.calculation?.trim()),
      finalAnswer: isCorrect,
    };

    const needsPractice: string[] = [];
    if (!stepScores.reading) needsPractice.push('Lecture attentive');
    if (!stepScores.questionIdentified) needsPractice.push('Identifier la question');
    if (!stepScores.dataIdentified) needsPractice.push('Trier les données');
    if (!stepScores.planning) needsPractice.push('Planification');
    if (!stepScores.calculations) needsPractice.push('Précision des calculs');
    if (!stepScores.finalAnswer) needsPractice.push('Résultat final');

    addCompletedProblem({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      problemId: problem.id,
      date: new Date().toISOString(),
      level: `${problem.level}e`,
      theme: problem.theme,
      title: problem.title,
      studentAnswer,
      correctAnswer,
      isCorrect,
      hintsUsed: hintsUsedCount,
      score: isCorrect ? 100 : Math.round((Object.values(stepScores).filter(Boolean).length / 6) * 100),
      stepScores,
      needsPractice,
    });

    localStorage.removeItem(getDraftKey(problemId));
    navigate({ to: '/progress' });
  };

  const handleOpenHint = () => {
    if (!hintOpen) setHintOpen(true);
  };

  const handleNextHintLevel = () => {
    if (hintLevel < 3) {
      setHintLevel(hintLevel + 1);
      setHintsUsedCount(prev => prev + 1);
    }
  };

  const hintButtonLabel = hintLevel >= 3 && hintOpen
    ? 'Tu as vu tous les indices'
    : hintOpen
    ? `Indice ${hintLevel}/3 affiché`
    : hintLevel === 1
    ? 'Indice'
    : `Revoir l'indice ${hintLevel}/3`;

  const progress = (currentStep / 6) * 100;
  const problemHints = problem.hints ?? undefined;
  const bodyWidthClass = 'max-w-6xl';
  const showHeaderHint = currentStep >= 5;
  const savedLabel = lastSavedAt
    ? `Sauvegardé automatiquement ${new Date(lastSavedAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`
    : 'Sauvegarde automatique active';

  return (
    <Page>
      <PageHeader className="border-b bg-background/95 sticky top-0 z-10 backdrop-blur">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/select"><Home className="h-5 w-5" /></Link>
              </Button>
              <PageTitle className="text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{problem.title}</PageTitle>
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-200">
                <Save className="h-3 w-3" /> {savedLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showHeaderHint && (
                <Button variant="outline" size="sm" onClick={handleOpenHint} disabled={hintLevel >= 3 && hintOpen} className="gap-2 border-yellow-300 text-yellow-800 hover:bg-yellow-50 hover:border-yellow-400 disabled:opacity-60">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">{hintButtonLabel}</span>
                  <span className="sm:hidden">Indice</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleResetDraft} className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Recommencer</span>
              </Button>
              <div className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full whitespace-nowrap">Étape {currentStep} sur 6</div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="lg:hidden flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-200 w-fit">
            <Save className="h-3 w-3" /> {savedLabel}
          </div>
        </div>
      </PageHeader>

      <PageBody className={`pb-24 pt-6 ${bodyWidthClass} mx-auto w-full`}>
        <ProblemBanner
          problem={problem}
          highlightedTokenIds={highlightedTokenIds}
          strikethroughTokenIds={strikethroughTokenIds}
          markMode={markMode}
          showMarkTools={currentStep === 3}
          onMarkModeChange={setMarkMode}
          onToggleHighlight={toggleHighlight}
          onToggleStrikethrough={currentStep === 3 ? toggleStrikethrough : undefined}
        />

        {hintOpen && showHeaderHint && (
          <div className="mb-6">
            <HintPanel currentStep={currentStep} hintLevel={hintLevel} hints={problemHints} onNextLevel={handleNextHintLevel} onClose={() => setHintOpen(false)} />
          </div>
        )}

        <div className="space-y-6 animate-fade-in" key={currentStep}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{currentStep}</div>
            <h2 className="text-xl font-bold">{STEPS[currentStep - 1].title}</h2>
          </div>

          <div className="min-h-[400px]">
            {currentStep === 1 && <Step1Read problem={problem} onUpdate={(data) => updateAnswer(1, data)} savedData={answers[1]} />}
            {currentStep === 2 && <Step2Question problem={problem} onUpdate={(data) => updateAnswer(2, data)} savedData={answers[2]} highlightedTokenIds={highlightedTokenIds} />}
            {currentStep === 3 && <Step3Knowledge problem={problem} onUpdate={(data) => updateAnswer(3, data)} savedData={answers[3]} highlightedTokenIds={highlightedTokenIds} />}
            {currentStep === 4 && <Step4Plan problem={problem} onUpdate={(data) => updateAnswer(4, data)} savedData={answers[4]} step3Data={answers[3]} />}
            {currentStep === 5 && <Step5Solve problem={problem} onUpdate={(data) => updateAnswer(5, data)} savedData={answers[5]} planData={answers[4]} step3Data={answers[3]} />}
            {currentStep === 6 && <Step6Answer problem={problem} onUpdate={(data) => updateAnswer(6, data)} savedData={answers[6]} />}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t z-20 flex justify-center">
          <div className={`${bodyWidthClass} w-full flex justify-between gap-4`}>
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="gap-2"><ChevronLeft className="h-4 w-4" /> Précédent</Button>
            {currentStep === 6 ? (
              <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleFinish}>Terminer le problème <CheckCircle2 className="h-4 w-4" /></Button>
            ) : (
              <Button onClick={handleNext} className="gap-2 px-8">Étape suivante <ChevronRight className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
