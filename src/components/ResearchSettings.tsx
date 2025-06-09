
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
  theme?: 'light' | 'dark';
}

const ResearchSettings: React.FC<ResearchSettingsProps> = ({
  topic,
  setTopic,
  settings,
  setSettings,
  onStartResearch,
  isResearching,
  theme = 'light'
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
      toast.success('URL added to research context');
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
        toast.success(`Added ${urls.length} URLs to research context`);
      } else {
        toast.error('No valid URLs found in text');
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
    toast.success('All URLs removed');
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 border-white text-white' 
    : 'bg-white border-black text-black';

  const buttonClasses = theme === 'dark'
    ? 'border-white hover:bg-white hover:text-black'
    : 'border-black hover:bg-black hover:text-white';

  return (
    <Card className={`border-2 hover:shadow-2xl transition-all duration-500 animate-scale-in ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-light">
          <Settings className="h-5 w-5" />
          Research Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium">Deep Research Topic</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic for automatic splitting and deep analysis..."
            rows={3}
            className={`transition-colors duration-200 ${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}
          />
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Gemini 2.5 Flash Preview will automatically split topic into subtopics</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Academic Level</Label>
          <Select value={settings.tone} onValueChange={(value: any) => setSettings({...settings, tone: value})}>
            <SelectTrigger className={`${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phd">PhD Level (Advanced)</SelectItem>
              <SelectItem value="bachelor">Bachelor Level (Academic)</SelectItem>
              <SelectItem value="school">School Level (Simple)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">AI Model</Label>
          <Select value={settings.model} onValueChange={(value) => setSettings({...settings, model: value})}>
            <SelectTrigger className={`${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview (web search)</SelectItem>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (web search)</SelectItem>
              <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp (web search)</SelectItem>
              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (web search)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Web Analysis Depth</Label>
          <Select value={settings.searchDepth} onValueChange={(value: any) => setSettings({...settings, searchDepth: value})}>
            <SelectTrigger className={`${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shallow">Shallow (Fast)</SelectItem>
              <SelectItem value="medium">Medium (Balanced)</SelectItem>
              <SelectItem value="deep">Deep (Maximum)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Forced Web Search</Label>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>NO limits on web search and analysis!</p>
          </div>
          <Switch
            checked={true}
            disabled={true}
            className="opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Words in Report: {settings.wordCount.toLocaleString()}</Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Multi-part generation by 10,000 words per part</p>
          <input
            type="range"
            min="10000"
            max="100000"
            step="5000"
            value={settings.wordCount}
            onChange={(e) => setSettings({...settings, wordCount: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Automatic Subtopics: {settings.parallelQueries}</Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Gemini 2.5 Flash Preview will split topic into unique subtopics</p>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={settings.parallelQueries}
            onChange={(e) => setSettings({...settings, parallelQueries: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Batch Size: {settings.batchSize}</Label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={settings.batchSize}
            onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Custom URLs Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Custom URLs for Web Search ({settings.customUrls.length})
          </Label>
          
          {/* Single URL input */}
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button onClick={addCustomUrl} size="sm" variant="outline" className={buttonClasses}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk URL input */}
          <div className="space-y-2">
            <Label className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Bulk URL Addition (Ctrl+V)</Label>
            <Textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="Paste multiple URLs to include in web search"
              rows={3}
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={addBulkUrls} size="sm" variant="outline" className={`flex-1 ${buttonClasses}`}>
                <Upload className="h-3 w-3 mr-1" />
                Add All
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
            <div className={`space-y-2 max-h-32 overflow-y-auto border rounded p-2 ${theme === 'dark' ? 'border-white' : 'border-black'}`}>
              {settings.customUrls.map((url, index) => (
                <div key={index} className={`flex items-center gap-2 text-xs p-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Link className={`h-3 w-3 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
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
          className={`w-full py-3 text-lg font-light transition-all duration-300 hover:scale-105 ${
            theme === 'dark' 
              ? 'bg-white text-black hover:bg-gray-200' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}
          size="lg"
        >
          {isResearching ? (
            <>
              <Globe className="mr-2 h-5 w-5 animate-spin" />
              Research Machine Working...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-5 w-5" />
              Start Research Machine
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ResearchSettings;
