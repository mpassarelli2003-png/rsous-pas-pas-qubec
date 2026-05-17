import { useState, useEffect } from 'react';
import { Page, PageBody, PageHeader, PageTitle, Card, Button, Switch, Slider } from '@blinkdotnew/ui';
import { Type, Eye, Volume2, ShieldCheck, Save, RotateCcw } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.6,
    highContrast: false,
    autoRead: false,
    focusMode: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('user_accessibility_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('user_accessibility_settings', JSON.stringify(settings));
    toast.success('Paramètres enregistrés !');
  };

  const resetSettings = () => {
    const defaults = {
      fontSize: 18,
      lineHeight: 1.6,
      highContrast: false,
      autoRead: false,
      focusMode: false,
    };
    setSettings(defaults);
    localStorage.setItem('user_accessibility_settings', JSON.stringify(defaults));
    toast('Paramètres réinitialisés');
  };

  return (
    <Page>
      <PageHeader>
        <PageTitle>Paramètres d'accessibilité</PageTitle>
      </PageHeader>
      <PageBody className="max-w-3xl mx-auto py-8 space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Affichage du texte
          </h3>
          <Card className="p-6 space-y-8 border-2 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Taille du texte ({settings.fontSize}px)</label>
              </div>
              <Slider 
                value={[settings.fontSize]} 
                min={14} 
                max={32} 
                step={2} 
                onValueChange={([val]) => setSettings({...settings, fontSize: val})}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Espacement des lignes ({settings.lineHeight})</label>
              </div>
              <Slider 
                value={[settings.lineHeight * 10]} 
                min={12} 
                max={25} 
                step={1} 
                onValueChange={([val]) => setSettings({...settings, lineHeight: val / 10})}
              />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Confort visuel
          </h3>
          <Card className="p-6 space-y-6 border-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Mode haute visibilité</p>
                <p className="text-xs text-muted-foreground">Augmente les contrastes pour une meilleure lecture.</p>
              </div>
              <Switch 
                checked={settings.highContrast} 
                onCheckedChange={(val) => setSettings({...settings, highContrast: val})} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Mode concentration</p>
                <p className="text-xs text-muted-foreground">Masque les distractions pendant la résolution.</p>
              </div>
              <Switch 
                checked={settings.focusMode} 
                onCheckedChange={(val) => setSettings({...settings, focusMode: val})} 
              />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Audio
          </h3>
          <Card className="p-6 border-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Lecture automatique</p>
                <p className="text-xs text-muted-foreground">Lire le problème à voix haute dès qu'il s'affiche.</p>
              </div>
              <Switch 
                checked={settings.autoRead} 
                onCheckedChange={(val) => setSettings({...settings, autoRead: val})} 
              />
            </div>
          </Card>
        </section>

        <div className="flex gap-4 pt-4">
          <Button onClick={saveSettings} className="flex-1 h-14 gap-2 text-lg">
            <Save className="h-5 w-5" /> Enregistrer mes réglages
          </Button>
          <Button variant="outline" onClick={resetSettings} className="h-14 px-6">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 flex gap-4">
          <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-primary">Tes données sont en sécurité</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tes réglages et tes progrès sont sauvegardés pour que tu puisses les retrouver sur n'importe quel appareil.
            </p>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
