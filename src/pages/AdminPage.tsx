import { useState, useEffect } from 'react';
import {
  Page, PageBody, PageHeader, PageTitle, Card, Button, Badge,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  toast
} from '@/lib/ui';
import { useNavigate } from '@tanstack/react-router';
import {
  Shield, LogOut, Plus, Search,
  Edit, Trash2, Eye, EyeOff, Save, Send,
  BookOpen, Calculator, HelpCircle, FileText, AlertCircle, ClipboardPaste
} from 'lucide-react';
import { PasteModal } from '../components/admin/PasteModal';
import { type ParseResult } from '../lib/parseProblem';
import { isAdmin, adminLogout, loadCustomProblems, saveCustomProblems, type AdminProblem } from '../lib/adminStore';
import { cn } from '@/lib/utils';

// ─── Notions mathématiques QC 5e-6e ───────────────────────────────────────────
const NOTIONS = [
  { value: 'nombres-naturels',    label: 'Nombres naturels' },
  { value: 'fractions',           label: 'Fractions' },
  { value: 'decimaux',            label: 'Nombres décimaux' },
  { value: 'pourcentages',        label: 'Pourcentages' },
  { value: 'operations',          label: 'Opérations' },
  { value: 'multi-etapes',        label: 'Problèmes à plusieurs étapes' },
  { value: 'argent',              label: 'Argent' },
  { value: 'mesure',              label: 'Mesure' },
  { value: 'temps',               label: 'Temps' },
  { value: 'aire-perimetre',      label: 'Aire et périmètre' },
  { value: 'volume',              label: 'Volume simple' },
  { value: 'geometrie',           label: 'Géométrie' },
  { value: 'tableaux-diagrammes', label: 'Tableaux et diagrammes' },
  { value: 'moyenne',             label: 'Moyenne' },
  { value: 'proportionnalite',    label: 'Proportionnalité simple' },
];

const NOTION_LABEL: Record<string, string> = Object.fromEntries(NOTIONS.map(n => [n.value, n.label]));

// ─── Formulaire initial ────────────────────────────────────────────────────────
type ProblemForm = Omit<AdminProblem, 'id' | 'createdAt' | 'updatedAt'>;

const INITIAL_FORM: ProblemForm = {
  title: '',
  level: 6,
  theme: 'argent',
  difficulty: 'moyen',
  status: 'brouillon',
  content: '',
  question: '',
  solution_data: {
    steps_count: 1,
    operations: [],
    expected_operations: '',
    feedback: '',
    final_answer: '',
    expected_steps: [],
    expected_calculations: '',
    model_answer: '',
  },
  hints: { level1: '', level2: '', level3: '' },
};

// ─── Validation avant publication ─────────────────────────────────────────────
function canPublish(f: ProblemForm): { ok: boolean; reason: string } {
  if (!f.solution_data.final_answer.trim())
    return { ok: false, reason: 'Ajoutez une réponse finale avant de publier.' };
  if (!f.solution_data.expected_calculations.trim())
    return { ok: false, reason: 'Ajoutez le corrigé détaillé avant de publier.' };
  return { ok: true, reason: '' };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProblemForm>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showPasteModal, setShowPasteModal] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      navigate({ to: '/admin/login' });
      return;
    }
    setProblems(loadCustomProblems());
  }, [navigate]);

  const handleLogout = () => {
    adminLogout();
    navigate({ to: '/admin/login' });
  };

  const persistProblems = (next: AdminProblem[]) => {
    setProblems(next);
    saveCustomProblems(next);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setActiveTab('form');
  };

  const handleEdit = (p: AdminProblem) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      level: p.level,
      theme: p.theme,
      difficulty: p.difficulty,
      status: p.status,
      content: p.content,
      question: p.question,
      solution_data: { ...p.solution_data },
      hints: { ...p.hints },
    });
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce problème définitivement ?')) {
      persistProblems(problems.filter(p => p.id !== id));
      toast.success('Problème supprimé.');
    }
  };

  const handleTogglePublish = (p: AdminProblem) => {
    if (p.status === 'publie') {
      // Dépublier sans validation
      const next = problems.map(x =>
        x.id === p.id ? { ...x, status: 'brouillon' as const, updatedAt: new Date().toISOString() } : x
      );
      persistProblems(next);
      toast.success('Problème dépublié.');
    } else {
      // Valider avant publication
      const check = canPublish({
        title: p.title, level: p.level, theme: p.theme, difficulty: p.difficulty,
        status: p.status, content: p.content, question: p.question,
        solution_data: p.solution_data, hints: p.hints,
      });
      if (!check.ok) { toast.error(check.reason); return; }
      const next = problems.map(x =>
        x.id === p.id ? { ...x, status: 'publie' as const, updatedAt: new Date().toISOString() } : x
      );
      persistProblems(next);
      toast.success('Problème publié !');
    }
  };

  const handleSubmit = (status: 'brouillon' | 'publie') => {
    if (!formData.title.trim()) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error("L'énoncé du problème est obligatoire.");
      return;
    }
    if (status === 'publie') {
      const check = canPublish(formData);
      if (!check.ok) { toast.error(check.reason); return; }
    }

    const saved: AdminProblem = {
      ...formData,
      id: editingId || `custom_${Date.now()}`,
      status,
      solution_data: {
        ...formData.solution_data,
        steps_count: (formData.solution_data.expected_calculations.match(/^Étape/gm) || []).length || 1,
        expected_steps: formData.solution_data.expected_calculations
          .split('\n')
          .filter(l => l.trim().startsWith('Étape')),
      },
      createdAt: editingId
        ? (problems.find(p => p.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      persistProblems(problems.map(p => p.id === editingId ? saved : p));
      toast.success('Problème mis à jour !');
    } else {
      persistProblems([...problems, saved]);
      toast.success('Nouveau problème créé !');
    }
    setActiveTab('list');
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  // ─── Appliquer le résultat du parsing au formulaire ─────────────────────────
  const handlePasteApply = (result: ParseResult) => {
    const f = result.fields;

    // Résolution de la notion : le parseur retourne déjà la valeur interne
    // (ex: 'nombres-naturels') via parseNotion(). On vérifie juste que la valeur
    // est connue, sinon fallback vers 'argent'.
    const knownNotions = NOTIONS.map(n => n.value);
    const finalNotion = f.notion && knownNotions.includes(f.notion) ? f.notion : 'argent';

    setFormData({
      title:      f.titre      ?? '',
      level:      f.niveau     ?? 6,
      theme:      finalNotion,
      difficulty: f.difficulte ?? 'moyen',
      status:     'brouillon',
      content:    f.enonce     ?? '',
      question:   f.question   ?? '',
      solution_data: {
        steps_count:           1,
        // DONNÉES IMPORTANTES → opérations (tableau de lignes non vides)
        operations:            f.donnees
          ? f.donnees.split('\n').filter(l => l.trim() !== '')
          : [],
        // OPÉRATIONS ATTENDUES → champ dédié
        expected_operations:   f.operations ?? '',
        // RÉTROACTION → champ dédié
        feedback:              f.retroaction ?? '',
        // RÉPONSE FINALE → préserve les retours à la ligne
        final_answer:          f.reponsefinale  ?? '',
        expected_steps:        [],
        // CORRIGÉ → étapes détaillées
        expected_calculations: f.corrige        ?? '',
        // PHRASE-RÉPONSE
        model_answer:          f.phrasereponse  ?? '',
      },
      hints: {
        level1: f.indice1 ?? '',
        level2: f.indice2 ?? '',
        level3: f.indice3 ?? '',
      },
    });
    setEditingId(null);
    setActiveTab('form');
    toast.success('Formulaire rempli automatiquement. Vérifie les champs avant de publier.');
  };

  const filteredProblems = problems.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(q) || (NOTION_LABEL[p.theme] ?? p.theme).toLowerCase().includes(q);
    const matchLevel = filterLevel === 'all' || String(p.level) === filterLevel;
    return matchSearch && matchLevel;
  });

  // ─── Helpers pour mise à jour du formulaire ────────────────────────────────
  const setField = (field: keyof ProblemForm, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const setSolutionField = (field: keyof ProblemForm['solution_data'], value: any) =>
    setFormData(prev => ({
      ...prev,
      solution_data: { ...prev.solution_data, [field]: value },
    }));

  const setHintField = (level: 'level1' | 'level2' | 'level3', value: string) =>
    setFormData(prev => ({ ...prev, hints: { ...prev.hints, [level]: value } }));

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <Page>
      <PageHeader className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <PageTitle className="text-xl font-black">Banque de problèmes — Administration</PageTitle>
          </div>
          <Button variant="ghost" className="text-primary-foreground hover:bg-white/10 gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </PageHeader>

      <PageBody className="py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px] mx-auto">
            <TabsTrigger value="list">Mes problèmes ({problems.length})</TabsTrigger>
            <TabsTrigger value="form">{editingId ? 'Modifier' : 'Ajouter un problème'}</TabsTrigger>
          </TabsList>

          {/* ══════════ LISTE ══════════ */}
          <TabsContent value="list" className="space-y-6 pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou notion..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="5">5e année</SelectItem>
                    <SelectItem value="6">6e année</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0 border-primary/40 text-primary hover:bg-primary/5"
                  onClick={() => setShowPasteModal(true)}
                >
                  <ClipboardPaste className="h-4 w-4" /> Coller un problème complet
                </Button>
                <Button className="gap-2 shrink-0" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4" /> Nouveau
                </Button>
              </div>
            </div>

            <Card className="border-2 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Titre</th>
                      <th className="px-4 py-3 font-bold">Niveau</th>
                      <th className="px-4 py-3 font-bold">Notion</th>
                      <th className="px-4 py-3 font-bold">Difficulté</th>
                      <th className="px-4 py-3 font-bold">Statut</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProblems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                          {problems.length === 0
                            ? 'Aucun problème créé. Cliquez sur « Nouveau » pour commencer.'
                            : 'Aucun problème ne correspond à la recherche.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProblems.map(p => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{p.level}e année</td>
                          <td className="px-4 py-3 text-sm">{NOTION_LABEL[p.theme] ?? p.theme}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{p.difficulty}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(
                              'font-semibold',
                              p.status === 'publie'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            )}>
                              {p.status === 'publie' ? 'Publié' : 'Brouillon'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {/* Toggle publier / dépublier */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8',
                                  p.status === 'publie'
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                    : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'
                                )}
                                title={p.status === 'publie' ? 'Dépublier' : 'Publier'}
                                onClick={() => handleTogglePublish(p)}
                              >
                                {p.status === 'publie' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => handleEdit(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Supprimer"
                                onClick={() => handleDelete(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Légende */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-green-600" /> Publié (visible par les élèves)</span>
              <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Brouillon (invisible pour les élèves)</span>
            </div>
          </TabsContent>

          {/* ══════════ FORMULAIRE ══════════ */}
          <TabsContent value="form" className="space-y-8 pt-6 max-w-3xl mx-auto">

            {/* ── Avertissement règles de publication ── */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Règles de publication</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Un problème ne peut pas être publié sans <strong>réponse finale</strong>.</li>
                  <li>Un problème ne peut pas être publié sans <strong>corrigé détaillé</strong>.</li>
                  <li>La correction complète est visible par l'élève <strong>seulement après l'étape 6</strong>.</li>
                </ul>
              </div>
            </div>

            {/* ── 1-4 : Informations générales ── */}
            <section className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                <FileText className="h-5 w-5" /> Informations générales
              </h3>

              {/* 1. Titre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                  1. Titre du problème <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: La sortie au zoo"
                  value={formData.title}
                  onChange={e => setField('title', e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* 2. Niveau */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">2. Niveau</label>
                  <Select value={String(formData.level)} onValueChange={v => setField('level', parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5e année</SelectItem>
                      <SelectItem value="6">6e année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Notion mathématique */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">3. Notion mathématique principale</label>
                  <Select value={formData.theme} onValueChange={v => setField('theme', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NOTIONS.map(n => (
                        <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4. Difficulté */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">4. Difficulté</label>
                <div className="flex gap-3 flex-wrap">
                  {(['facile', 'moyen', 'difficile', 'defi'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setField('difficulty', d)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                        formData.difficulty === d
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background hover:border-primary/40'
                      )}
                    >
                      {d === 'defi' ? 'Défi' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 5-6 : Énoncé ── */}
            <section className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                <BookOpen className="h-5 w-5" /> Énoncé et question
              </h3>

              {/* 5. Énoncé */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                  5. Énoncé du problème <span className="text-red-500">*</span>
                </label>
                <Textarea
                  className="min-h-[140px] leading-relaxed"
                  placeholder="Écris l'histoire du problème ici. Inclus tous les éléments narratifs et les données numériques."
                  value={formData.content}
                  onChange={e => setField('content', e.target.value)}
                />
              </div>

              {/* 6. Question finale */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">6. Question finale</label>
                <Input
                  placeholder="Ex: Quel est le prix total ?"
                  value={formData.question}
                  onChange={e => setField('question', e.target.value)}
                />
              </div>
            </section>

            {/* ── 7-11 : Corrigé ── */}
            <section className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                <Calculator className="h-5 w-5" /> Corrigé
              </h3>

              {/* 7. Données importantes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">7. Données importantes</label>
                <Textarea
                  className="min-h-[72px] font-mono text-sm"
                  placeholder={"Ex: Prix initial : 80 $\nRabais : 25 %"}
                  value={formData.solution_data.operations.join('\n')}
                  onChange={e => setSolutionField('operations', e.target.value.split('\n'))}
                />
                <p className="text-xs text-muted-foreground">Liste les données numériques clés, une par ligne.</p>
              </div>

              {/* 8. Opérations attendues */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">8. Opérations attendues</label>
                <Input
                  placeholder="Ex: multiplication, soustraction"
                  value={formData.solution_data.expected_operations}
                  onChange={e => setSolutionField('expected_operations', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Séparées par des virgules.</p>
              </div>

              {/* 9. Étapes du corrigé */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                  9. Étapes du corrigé <span className="text-red-500">*</span>
                </label>
                <Textarea
                  className="min-h-[200px] font-mono text-sm leading-relaxed"
                  placeholder={"Étape 1 : Calculer le rabais.\n25 % de 80 $ = 20 $\n\nÉtape 2 : Calculer le prix final.\n80 $ - 20 $ = 60 $"}
                  value={formData.solution_data.expected_calculations}
                  onChange={e => setSolutionField('expected_calculations', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Écris chaque étape en commençant par «&nbsp;Étape N :&nbsp;» suivi du calcul.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* 10. Réponse finale */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                    10. Réponse finale <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: 60 $"
                    value={formData.solution_data.final_answer}
                    onChange={e => setSolutionField('final_answer', e.target.value)}
                  />
                </div>
              </div>

              {/* 11. Phrase-réponse complète */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">11. Phrase-réponse complète</label>
                <Textarea
                  className="min-h-[72px]"
                  placeholder="Ex: Le prix final du manteau est de 60 $."
                  value={formData.solution_data.model_answer}
                  onChange={e => setSolutionField('model_answer', e.target.value)}
                />
              </div>
            </section>

            {/* ── 12 : Indices ── */}
            <section className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                <HelpCircle className="h-5 w-5" /> Indices progressifs (max. 3)
              </h3>
              <p className="text-sm text-muted-foreground -mt-2">
                Ces indices sont révélés un à la fois. Ils ne doivent pas donner directement la réponse.
              </p>

              <div className="space-y-4">
                {([
                  { field: 'level1' as const, num: 1, label: 'Indice 1 — Petit rappel', placeholder: 'Ex: Relis la question et repère ce qu\'on cherche.' },
                  { field: 'level2' as const, num: 2, label: 'Indice 2 — Aide plus précise', placeholder: 'Ex: Commence par identifier les nombres utiles.' },
                  { field: 'level3' as const, num: 3, label: 'Indice 3 — Début de solution', placeholder: 'Ex: Tu devras d\'abord calculer le rabais, puis soustraire du prix initial.' },
                ]).map(({ field, num, label, placeholder }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                      {num}. {label}
                    </label>
                    <Textarea
                      className="min-h-[72px]"
                      placeholder={placeholder}
                      value={formData.hints[field]}
                      onChange={e => setHintField(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ── 13 : Rétroaction pédagogique ── */}
            <section className="space-y-5">
              <h3 className="text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                <AlertCircle className="h-5 w-5" /> Rétroaction pédagogique générale
              </h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">13. Message d'encouragement ou explication</label>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Ex: Dans ce problème, l'astuce est de bien repérer le pourcentage et de calculer le rabais avant de trouver le prix final."
                  value={formData.solution_data.feedback}
                  onChange={e => setSolutionField('feedback', e.target.value)}
                />
              </div>
            </section>

            {/* ── Boutons de sauvegarde ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => { setActiveTab('list'); setEditingId(null); setFormData(INITIAL_FORM); }}
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-12 gap-2"
                onClick={() => handleSubmit('brouillon')}
              >
                <Save className="h-4 w-4" /> Enregistrer brouillon
              </Button>
              <Button
                className="flex-1 h-12 gap-2"
                onClick={() => handleSubmit('publie')}
              >
                <Send className="h-4 w-4" /> Publier le problème
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* ── Modal "Coller un problème complet" ── */}
      {showPasteModal && (
        <PasteModal
          onApply={handlePasteApply}
          onClose={() => setShowPasteModal(false)}
        />
      )}
    </Page>
  );
}
