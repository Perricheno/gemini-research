
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Upload, Trash2, Link, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchSettings as ResearchSettingsType } from '../types/research';

interface ResearchSettingsProps {
  topic: string;
  setTopic: (topic: string) => void;
  settings: ResearchSettingsType;
  setSettings: (settings: ResearchSettingsType) => void;
  onStartResearch: () => void;
  isResearching: boolean;
}

const ResearchSettings: React.FC<ResearchSettingsProps> = ({
  topic,
  setTopic,
  settings,
  setSettings,
  onStartResearch,
  isResearching
}) => {
  const [newUrl, setNewUrl] = React.useState('');
  const [bulkUrls, setBulkUrls] = React.useState('');

  const addCustomUrl = () => {
    if (newUrl.trim() && !settings.customUrls.includes(newUrl.trim())) {
      setSettings({
        ...settings,
        customUrls: [...settings.customUrls, newUrl.trim()]
      });
      setNewUrl('');
      toast.success('URL добавлен в исследовательский контекст');
    }
  };

  const addBulkUrls = () => {
    if (bulkUrls.trim()) {
      const urls = bulkUrls
        .split(/[\n,;]/)
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'))
        .filter(url => !settings.customUrls.includes(url));
      
      if (urls.length > 0) {
        setSettings({
          ...settings,
          customUrls: [...settings.customUrls, ...urls]
        });
        setBulkUrls('');
        toast.success(`Добавлено ${urls.length} URL в исследовательский контекст`);
      } else {
        toast.error('Не найдены валидные URL в тексте');
      }
    }
  };

  const removeCustomUrl = (index: number) => {
    setSettings({
      ...settings,
      customUrls: settings.customUrls.filter((_, i) => i !== index)
    });
  };

  const clearAllUrls = () => {
    setSettings({
      ...settings,
      customUrls: []
    });
    toast.success('Все URL удалены');
  };

  return (
    <Card className="border-2 border-foreground hover:shadow-2xl transition-all duration-500 animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-light">
          <Settings className="h-5 w-5" />
          Настройки исследования
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium">Тема исследования</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Введите вашу тему исследования..."
            rows={3}
            className="border-muted focus:border-foreground transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Академический уровень</Label>
          <Select value={settings.tone} onValueChange={(value: any) => setSettings({...settings, tone: value})}>
            <SelectTrigger className="border-muted focus:border-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phd">Уровень PhD</SelectItem>
              <SelectItem value="bachelor">Уровень бакалавра</SelectItem>
              <SelectItem value="school">Школьный уровень</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">AI модель</Label>
          <Select value={settings.model} onValueChange={(value) => setSettings({...settings, model: value})}>
            <SelectTrigger className="border-muted focus:border-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Глубина поиска</Label>
          <Select value={settings.searchDepth} onValueChange={(value: any) => setSettings({...settings, searchDepth: value})}>
            <SelectTrigger className="border-muted focus:border-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shallow">Поверхностный (Быстро)</SelectItem>
              <SelectItem value="medium">Средний (Сбалансированно)</SelectItem>
              <SelectItem value="deep">Глубокий (Всесторонне)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Включить Grounding</Label>
          <Switch
            checked={settings.useGrounding}
            onCheckedChange={(checked) => setSettings({...settings, useGrounding: checked})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Количество слов: {settings.wordCount.toLocaleString()}</Label>
          <input
            type="range"
            min="2000"
            max="50000"
            step="1000"
            value={settings.wordCount}
            onChange={(e) => setSettings({...settings, wordCount: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Параллельные запросы: {settings.parallelQueries}</Label>
          <input
            type="range"
            min="2"
            max="200"
            step="2"
            value={settings.parallelQueries}
            onChange={(e) => setSettings({...settings, parallelQueries: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Размер батча: {settings.batchSize}</Label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={settings.batchSize}
            onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Custom URLs Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Пользовательский URL контекст ({settings.customUrls.length})
          </Label>
          
          {/* Single URL input */}
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button onClick={addCustomUrl} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk URL input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Массовое добавление URL (Ctrl+V)</Label>
            <Textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="Вставьте несколько URL (по одному на строке или через запятую)"
              rows={3}
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={addBulkUrls} size="sm" variant="outline" className="flex-1">
                <Upload className="h-3 w-3 mr-1" />
                Добавить все
              </Button>
              {settings.customUrls.length > 0 && (
                <Button onClick={clearAllUrls} size="sm" variant="outline" className="text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* URL list */}
          {settings.customUrls.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto border border-muted rounded p-2">
              {settings.customUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-1 rounded">
                  <Link className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate" title={url}>{url}</span>
                  <Button
                    onClick={() => removeCustomUrl(index)}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={onStartResearch}
          disabled={isResearching}
          className="w-full bg-foreground hover:bg-muted-foreground text-background border-0 py-3 text-lg font-light transition-all duration-300 hover:scale-105"
          size="lg"
        >
          {isResearching ? (
            <>
              <Settings className="mr-2 h-5 w-5 animate-spin" />
              Исследую...
            </>
          ) : (
            <>
              <Settings className="mr-2 h-5 w-5" />
              Начать исследование
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ResearchSettings;
