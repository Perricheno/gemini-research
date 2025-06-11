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
  const [newApiKey, setNewApiKey] = React.useState('');
  const [showApiKeyInput, setShowApiKeyInput] = React.useState(false);

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

  const addApiKey = () => {
    if (newApiKey.trim() && !settings.apiKeys.includes(newApiKey.trim())) {
      setSettings({
        ...settings,
        apiKeys: [...settings.apiKeys, newApiKey.trim()]
      });
      setNewApiKey('');
      toast.success('API key added successfully');
    }
  };

  const removeApiKey = (index: number) => {
    setSettings({
      ...settings,
      apiKeys: settings.apiKeys.filter((_, i) => i !== index)
    });
    toast.success('API key removed');
  };

  const requiresAdditionalKeys = settings.batchSize >= 50;

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
          Enhanced Research Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topic input */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium">Deep Research Topic</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic for automatic logical splitting and comprehensive analysis..."
            rows={3}
            className={`transition-colors duration-200 ${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}
          />
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Gemini 2.5 Flash Preview will create enhanced logical structure with up to 1000 subtopics
          </p>
        </div>

        {/* Academic Level */}
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

        {/* AI Model */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">AI Model</Label>
          <Select value={settings.model} onValueChange={(value) => setSettings({...settings, model: value})}>
            <SelectTrigger className={`${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview (Enhanced)</SelectItem>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</SelectItem>
              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Web Analysis Depth */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enhanced Analysis Depth</Label>
          <Select value={settings.searchDepth} onValueChange={(value: any) => setSettings({...settings, searchDepth: value})}>
            <SelectTrigger className={`${theme === 'dark' ? 'border-white focus:border-gray-300' : 'border-black focus:border-gray-600'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shallow">Shallow (Fast)</SelectItem>
              <SelectItem value="medium">Medium (Balanced)</SelectItem>
              <SelectItem value="deep">Deep (Maximum with completion verification)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Word Count */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Words in Report: {settings.wordCount.toLocaleString()}</Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Enhanced multi-part generation with completion verification
          </p>
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={settings.wordCount}
            onChange={(e) => setSettings({...settings, wordCount: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Enhanced Subtopics */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enhanced Logical Subtopics: {settings.parallelQueries}</Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Advanced logical structuring up to 1000 unique subtopics
          </p>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={settings.parallelQueries}
            onChange={(e) => setSettings({...settings, parallelQueries: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Optimized Batch Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Optimized Batch Size: {settings.batchSize}</Label>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {requiresAdditionalKeys ? 'High volume mode - requires additional API keys' : 'Standard processing mode'}
          </p>
          <input
            type="range"
            min="5"
            max="250"
            step="5"
            value={settings.batchSize}
            onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
          {requiresAdditionalKeys && (
            <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-100 border-yellow-500'}`}>
              <p className="text-sm font-medium">⚠️ High Volume Mode</p>
              <p className="text-xs">Batch size ≥50 requires 5 additional API keys for optimal performance</p>
            </div>
          )}
        </div>

        {/* API Keys Management */}
        {requiresAdditionalKeys && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              🔑 Additional API Keys ({settings.apiKeys.length}/5 recommended)
            </Label>
            
            <div className="flex gap-2">
              <Input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1"
              />
              <Button onClick={addApiKey} size="sm" variant="outline" className={buttonClasses}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {settings.apiKeys.length > 0 && (
              <div className={`space-y-2 max-h-32 overflow-y-auto border rounded p-2 ${theme === 'dark' ? 'border-white' : 'border-black'}`}>
                {settings.apiKeys.map((key, index) => (
                  <div key={index} className={`flex items-center gap-2 text-xs p-1 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <span className="flex-1">Key {index + 1}: ****{key.slice(-4)}</span>
                    <Button
                      onClick={() => removeApiKey(index)}
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
        )}

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
          disabled={isResearching || (requiresAdditionalKeys && settings.apiKeys.length < 3)}
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
              Enhanced Research Machine Working...
            </>
          ) : requiresAdditionalKeys && settings.apiKeys.length < 3 ? (
            <>
              🔑 Add API Keys for High Volume Mode
            </>
          ) : (
            <>
              <Globe className="mr-2 h-5 w-5" />
              Start Enhanced Research Machine
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ResearchSettings;
