import { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function ApiKeyChecker() {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const checkApiKey = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Check if API key is set in the frontend
      const frontendKey = (window as any).__SPORTZSOFT_API_KEY__;
      setApiKey(frontendKey || 'Not set');
      
      if (!frontendKey) {
        setTestResult({
          success: false,
          message: 'API Key is not loaded. The SPORTZSOFT_API_KEY environment variable may not be set.',
        });
        setLoading(false);
        return;
      }
      
      // Test the API key with a simple SportzSoft API call
      const testResponse = await fetch(
        'https://www.sportzsoft.com/ssRest/TeamRest.dll/getSeasons?OrgID=520',
        {
          headers: {
            'Content-Type': 'application/json',
            'ApiKey': frontendKey || '',
            'TZO': new Date().getTimezoneOffset().toString(),
            'LocalTime': new Date().toISOString(),
          },
        }
      );

      const data = await testResponse.json();

      
      if (data.Success) {
        setTestResult({
          success: true,
          message: 'API Key is valid and working!',
        });
      } else {
        setTestResult({
          success: false,
          message: `API Error: ${data.Error || 'Invalid API key'}${data.ErrorCode ? ` (Code: ${data.ErrorCode})` : ''}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApiKey = async () => {
    setUpdating(true);
    setTestResult(null);

    try {
      // Save to database first
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/cms/settings/sportzsoft-key`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: newApiKey }),
        }
      );

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to save API key to database');
      }

      // Update the API key in the frontend
      (window as any).__SPORTZSOFT_API_KEY__ = newApiKey;
      setApiKey(newApiKey);

      // Test the API key with a simple SportzSoft API call
      const testResponse = await fetch(
        'https://www.sportzsoft.com/ssRest/TeamRest.dll/getSeasons?OrgID=520',
        {
          headers: {
            'Content-Type': 'application/json',
            'ApiKey': newApiKey || '',
            'TZO': new Date().getTimezoneOffset().toString(),
            'LocalTime': new Date().toISOString(),
          },
        }
      );

      const data = await testResponse.json();

      if (data.Success) {
        setTestResult({
          success: true,
          message: 'API Key is valid and working! Saved to database.',
        });
        toast.success('API Key saved successfully!');
      } else {
        setTestResult({
          success: false,
          message: `API Error: ${data.Error || 'Invalid API key'}`,
        });
        toast.error('API Key test failed!');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
      });
      toast.error('Failed to update API Key!');
    } finally {
      setUpdating(false);
      setShowUpdateForm(false);
    }
  };

  useEffect(() => {
    checkApiKey();
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">SportzSoft API Key Status</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current API Key:
            </label>
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm">
              {apiKey ? `${apiKey.substring(0, 4)}${'*'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.substring(Math.max(0, apiKey.length - 4))}` : 'Loading...'}
            </div>
          </div>

          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded ${
              testResult.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{testResult.message}</p>
                {!testResult.success && (
                  <div className="text-sm mt-2 space-y-1">
                    <p>To fix this issue:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Check that SPORTZSOFT_API_KEY is set in your Supabase environment variables</li>
                      <li>Verify the API key is correct and has no leading/trailing spaces</li>
                      <li>Or use the "Update API Key" button below to set it temporarily</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={checkApiKey}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {loading ? 'Testing...' : 'Test API Key'}
            </Button>

            <Button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              disabled={updating}
              variant="outline"
              size="sm"
            >
              {showUpdateForm ? 'Cancel' : 'Update API Key'}
            </Button>
          </div>

          {showUpdateForm && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter New API Key:
              </label>
              <Input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Paste your SportzSoft API key here"
                className="w-full font-mono"
              />
              <p className="text-xs text-gray-500">
                Note: This will only update the key temporarily. For permanent changes, update the SPORTZSOFT_API_KEY environment variable in Supabase.
              </p>
              <Button
                onClick={updateApiKey}
                disabled={updating || !newApiKey.trim()}
                className="w-full"
                size="sm"
              >
                {updating ? 'Updating...' : 'Update & Test Key'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
