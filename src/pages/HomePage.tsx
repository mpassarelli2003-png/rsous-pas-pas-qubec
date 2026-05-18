import { useEffect } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Button } from '@blinkdotnew/ui';
import { Link } from '@tanstack/react-router';
import { BookOpen, BarChart2, Zap, ChevronRight, Shield } from 'lucide-react';
import { Card } from '@blinkdotnew/ui';

export function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <Page>
      <PageHeader className="hidden">
        <PageTitle>Bienvenue sur Résous Pas à Pas</PageTitle>
      </PageHeader>
      <PageBody className="flex flex-col items-center justify-start min-h-screen py-6 px-6">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div className="space-y-4 animate-fade-in">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20 transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <span className="text-4xl font-black italic">R!</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary leading-tight">
                Résous ton problème <br/> <span className="text-accent italic">pas à pas</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-snug">
                Une application pour apprendre à comprendre, planifier et résoudre les problèmes mathématiques comme en classe.
              </p>
            </div>
            <div className="inline-block px-4 py-3 bg-emerald-100 rounded-2xl border-2 border-emerald-300 text-emerald-950 font-bold shadow-md mt-2">
              Ici, tu avances une étape à la fois. C’est rassurant !
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 pt-4">
            <Card className="group relative overflow-hidden border-4 border-transparent hover:border-primary transition-all hover:scale-105 shadow-xl bg-white">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <Link to="/select" className="p-6 h-full flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold leading-tight">Commencer un problème</h3>
                <p className="text-xs text-muted-foreground">Pratique les thèmes de ton année scolaire.</p>
                <ChevronRight className="h-5 w-5 mt-auto text-primary" />
              </Link>
            </Card>

            <Card className="group relative overflow-hidden border-4 border-transparent hover:border-accent transition-all hover:scale-105 shadow-xl bg-white">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
              <Link to="/progress" className="p-6 h-full flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <BarChart2 className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold leading-tight">Mes progrès</h3>
                <p className="text-xs text-muted-foreground">Regarde tes trophées et tes compétences.</p>
                <ChevronRight className="h-5 w-5 mt-auto text-accent" />
              </Link>
            </Card>

            <Card className="group relative overflow-hidden border-4 border-transparent hover:border-yellow-500 transition-all hover:scale-105 shadow-xl bg-white">
              <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500" />
              <Link to="/select" search={{ examMode: true }} className="p-6 h-full flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold leading-tight">Mode examen</h3>
                <p className="text-xs text-muted-foreground">Prépare-toi aux examens de fin d'année.</p>
                <ChevronRight className="h-5 w-5 mt-auto text-yellow-600" />
              </Link>
            </Card>
          </div>
          
          <div className="text-muted-foreground text-sm flex items-center justify-center gap-2 pt-1">
            <div className="h-px w-12 bg-muted-foreground/20" />
            Spécialement conçu pour les élèves de 5e et 6e année
            <div className="h-px w-12 bg-muted-foreground/20" />
          </div>

          {/* Accès administrateur */}
          <div className="flex justify-center pt-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground/60 hover:text-muted-foreground text-xs"
            >
              <Link to="/admin/login">
                <Shield className="h-3.5 w-3.5" />
                Espace administrateur
              </Link>
            </Button>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
