import { useState, useEffect } from 'react';
import { AlertCircle, X, Settings, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { isApiKeyReady } from '../services/sportzsoft';
import { Card } from './ui/card';

export function ApiKeyAlert() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if API key is ready after a short delay
    const timer = setTimeout(() => {
      if (!isApiKeyReady() && !isDismissed) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDismissed]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <Alert className="bg-yellow-50 border-yellow-200 shadow-lg">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900 font-bold flex items-center justify-between">
          SportzSoft API Key Missing
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsDismissed(true);
              setIsVisible(false);
            }}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="text-yellow-800 text-sm space-y-3">
          <p>
            The SportzSoft API key is not configured. Please set it up to enable games, teams, and player statistics.
          </p>
          
          {showInstructions ? (
            <Card className="bg-white p-4 space-y-3 text-gray-800">
              <h4 className="font-bold text-base">📝 Setup Instructions:</h4>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>
                  <strong>Option 1: Set in Supabase (Permanent)</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to: Project Settings → Edge Functions → Environment Variables</li>
                    <li>Add a new variable: <code className="bg-gray-100 px-2 py-0.5 rounded">SPORTZSOFT_API_KEY</code></li>
                    <li>Paste your SportzSoft API key as the value</li>
                    <li>Restart your edge functions or redeploy</li>
                  </ul>
                </li>
                <li>
                  <strong>Option 2: Use CMS (Temporary)</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Go to <code className="bg-gray-100 px-2 py-0.5 rounded">/cms</code> in your browser</li>
                    <li>Navigate to the Settings tab</li>
                    <li>Use the API Key Checker section</li>
                    <li>Enter your SportzSoft API key and test it</li>
                    <li>Note: This is temporary and will reset on page reload</li>
                  </ul>
                </li>
              </ol>
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                <p className="font-semibold mb-1">💡 Don't have a SportzSoft API key?</p>
                <p>Contact SportzSoft Solutions to obtain an API key for organization ID: 520 (RMLL)</p>
              </div>
            </Card>
          ) : null}
          
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="bg-white"
            >
              {showInstructions ? 'Hide' : 'Show'} Setup Instructions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/cms';
              }}
              className="flex items-center gap-2 bg-white"
            >
              <Settings className="h-4 w-4" />
              Go to CMS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDismissed(true);
                setIsVisible(false);
              }}
              className="bg-white"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}