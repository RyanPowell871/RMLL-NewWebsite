/**
 * Service for fetching component data from the database
 * Allows components to be dynamically editable via the CMS
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

interface ComponentData {
  [key: string]: unknown;
}

/**
 * Fetch component data from the database
 * @param pageId - The component's pageId (e.g., 'registration', 'combines')
 * @param defaultData - Fallback data if nothing in database
 * @returns The component data (from database or defaults)
 */
export async function fetchComponentData(
  pageId: string,
  defaultData: ComponentData = {}
): Promise<ComponentData> {
  try {
    const { data, error } = await supabase
      .from('rmll_component_content')
      .select('extracted_data')
      .eq('page_id', pageId)
      .maybeSingle();

    if (error) {
      console.error(`[ComponentData] Error fetching ${pageId}:`, error);
      return defaultData;
    }

    // If no data in database, return defaults
    if (!data || !data.extracted_data) {
      return defaultData;
    }

    // Merge database data with defaults (defaults as fallback)
    return { ...defaultData, ...(data.extracted_data as ComponentData) };
  } catch (error) {
    console.error(`[ComponentData] Error fetching ${pageId}:`, error);
    return defaultData;
  }
}

/**
 * React hook for fetching component data
 * @param pageId - The component's pageId
 * @param defaultData - Fallback data
 * @returns The component data and loading state
 */
export function useComponentData(
  pageId: string,
  defaultData: ComponentData = {}
): { data: ComponentData; loading: boolean; error: Error | null } {
  // This is a simplified synchronous version for client components
  // For production, you'd want to use React's useState and useEffect
  // But for now, we'll return defaults synchronously

  // In a real implementation, this would use React hooks:
  // const [data, setData] = useState(defaultData);
  // const [loading, setLoading] = useState(true);
  // useEffect(() => { fetchComponentData(pageId, defaultData).then(setData).finally(() => setLoading(false)); }, [pageId]);

  // For server components, we'd use async/await directly
  return { data: defaultData, loading: false, error: null };
}