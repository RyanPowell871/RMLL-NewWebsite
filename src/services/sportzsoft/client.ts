// SportzSoft API Client Configuration

// API Key - Read from environment variable
// Note: In production, this should be fetched from your backend
let API_KEY = typeof window !== 'undefined' 
  ? (window as any).__SPORTZSOFT_API_KEY__ 
  : '';

let API_KEY_INITIALIZED = false;

// Shared initialization promise so all consumers await the same result
let _initPromise: Promise<boolean> | null = null;

// Function to check if API key is ready
export function isApiKeyReady(): boolean {
  return API_KEY_INITIALIZED && !!API_KEY && API_KEY.length > 0;
}

// Function to wait for API key to be initialized (with timeout)
export async function waitForApiKey(timeoutMs: number = 15000): Promise<boolean> {
  // If already ready, return immediately
  if (isApiKeyReady()) return true;

  const startTime = Date.now();

  // If _initPromise isn't set yet, poll briefly for it to appear
  // (initializeApiKey is called in App.tsx's useEffect which may fire after consumers)
  while (!_initPromise && !isApiKeyReady()) {
    if (Date.now() - startTime > timeoutMs) {
      console.error('[waitForApiKey] Timeout waiting for initializeApiKey to be called');
      return false;
    }
    await new Promise(r => setTimeout(r, 50));
  }

  if (isApiKeyReady()) return true;

  // Now _initPromise exists — race it against remaining timeout
  if (_initPromise) {
    const remaining = timeoutMs - (Date.now() - startTime);
    if (remaining > 0) {
      try {
        const result = await Promise.race([
          _initPromise,
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), remaining))
        ]);
        if (result) return true;
      } catch {
        // fall through
      }
    }
  }

  // Final check in case it was set by another path
  if (isApiKeyReady()) return true;

  console.error('[waitForApiKey] Timeout waiting for API key initialization after', timeoutMs, 'ms');
  return false;
}

// Function to set API key (if needed for dynamic updates)
export function setApiKey(apiKey: string) {
  API_KEY = apiKey;
  API_KEY_INITIALIZED = true;
  if (typeof window !== 'undefined') {
    (window as any).__SPORTZSOFT_API_KEY__ = apiKey;
  }

}

// Initialize API key from backend
export async function initializeApiKey(projectId: string, anonKey: string): Promise<boolean> {
  // If already initialized, return true
  if (isApiKeyReady()) return true;

  // If there's an active init promise, wait on it
  if (_initPromise) return _initPromise;

  // Create a new init promise
  _initPromise = new Promise(async (resolve) => {
    try {

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9a1ba23f/config/sportzsoft-key`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[initializeApiKey] Failed to fetch API key:', response.status, errorText);
        console.error('[initializeApiKey] ⚠️  IMPORTANT: The SportzSoft API key may be missing or incorrect.');
        console.error('[initializeApiKey] ⚠️  Please verify the SPORTZSOFT_API_KEY environment variable is set correctly.');
        console.error('[initializeApiKey] 🔧 HOW TO FIX:');
        console.error('[initializeApiKey]    1. Go to /cms in your browser');
        console.error('[initializeApiKey]    2. Navigate to Settings tab');
        console.error('[initializeApiKey]    3. Use the API Key Checker to test and update your SportzSoft API key');
        console.error('[initializeApiKey]    4. Or set SPORTZSOFT_API_KEY in your Supabase project environment variables');
        resolve(false);
        return;
      }

      const data = await response.json();

      
      if (data.apiKey && data.apiKey.trim().length > 0) {
        setApiKey(data.apiKey);

        resolve(true);
      } else if (data.error) {
        console.error('[initializeApiKey] Backend returned error:', data.error);
        console.error('[initializeApiKey] ⚠️  IMPORTANT: Please check that SPORTZSOFT_API_KEY is correctly set in your Supabase environment variables.');
        console.error('[initializeApiKey] 🔧 HOW TO FIX: Go to /cms → Settings → API Key Checker to update the key');
        resolve(false);
      } else {
        console.error('[initializeApiKey] No API key in response:', data);
        console.error('[initializeApiKey] ⚠️  IMPORTANT: The SportzSoft API key is not configured properly.');
        console.error('[initializeApiKey] 🔧 HOW TO FIX: Go to /cms → Settings → API Key Checker to update the key');
        resolve(false);
      }
    } catch (error) {
      console.error('[initializeApiKey] Error:', error);
      console.error('[initializeApiKey] ℹ️  NOTE: Some features requiring SportzSoft API data may not work correctly.');
      console.error('[initializeApiKey] ℹ️  NOTE: The Division Info page (from CMS) will still work as it does not depend on the SportzSoft API.');
      console.error('[initializeApiKey] 🔧 HOW TO FIX: Go to /cms → Settings → API Key Checker to update the key');
      resolve(false);
    }
  });

  const result = await _initPromise;
  // If init failed, clear the promise so a future call can retry
  if (!result) {
    _initPromise = null;
  }
  return result;
}

export interface ApiHeaders {
  'Content-Type': string;
  'ApiKey': string;
  'TZO': string;
  'LocalTime': string;
}

// Helper function to get headers with ApiKey, TZO, and LocalTime
export function getHeaders(): ApiHeaders {
  // Get timezone offset in minutes (e.g., -420 for MST which is UTC-7)
  const timezoneOffset = new Date().getTimezoneOffset();
  
  // Get current local time in ISO format
  const localTime = new Date().toISOString();
  
  // Check if API key exists
  if (!API_KEY || API_KEY.trim().length === 0) {
    console.error('[getHeaders] ❌ API_KEY is not set or empty!');
    console.error('[getHeaders] ⚠️  Please ensure SPORTZSOFT_API_KEY environment variable is configured.');
    console.error('[getHeaders] ⚠️  This API call will likely FAIL at the SportzSoft API server.');
  }
  
  const trimmedApiKey = API_KEY ? API_KEY.trim() : '';
  
  const headers = {
    'Content-Type': 'application/json',
    'ApiKey': trimmedApiKey,
    'TZO': timezoneOffset.toString(),
    'LocalTime': localTime,
  };
  
  return headers;
}