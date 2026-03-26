/**
 * Proxy endpoint for downloading files from external URLs and uploading to Supabase Storage
 * Bypasses CORS restrictions by downloading on the server side
 */

import { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DOCUMENTS_BUCKET_NAME = 'make-9a1ba23f-documents';

export async function proxyDownload(c: Context) {
  try {
    const { url, filename: requestedFilename } = await c.req.json();
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    // Validate URL format
    let downloadUrl: URL;
    try {
      downloadUrl = new URL(url);
    } catch (error) {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(downloadUrl.protocol)) {
      return c.json({ error: 'Only HTTP and HTTPS URLs are allowed' }, 400);
    }

    console.log(`[Proxy] Downloading file from: ${url}`);

    // Fetch the file from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RMLL-CMS/1.0',
      },
      // Add a timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`[Proxy] Failed to download: ${response.status} ${response.statusText}`);
      return c.json({ 
        error: `Failed to download file: ${response.status} ${response.statusText}` 
      }, response.status);
    }

    // Get the file data as ArrayBuffer (more memory efficient)
    const arrayBuffer = await response.arrayBuffer();
    
    // Get content type from response or guess from URL
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get filename from URL or Content-Disposition header
    let filename = requestedFilename || url.split('/').pop()?.split('?')[0] || 'download';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Clean filename for storage
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `imports/${timestamp}-${cleanFilename}`;

    console.log(`[Proxy] Successfully downloaded ${arrayBuffer.byteLength} bytes, uploading to storage as: ${storagePath}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Upload directly to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Proxy] Error uploading to storage:', uploadError);
      return c.json({ 
        error: `Failed to upload to storage: ${uploadError.message}` 
      }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .getPublicUrl(storagePath);

    console.log(`[Proxy] Successfully uploaded to storage: ${storagePath}`);

    return c.json({
      success: true,
      storagePath: uploadData.path,
      publicUrl: urlData.publicUrl,
      contentType,
      filename: cleanFilename,
      size: arrayBuffer.byteLength,
    });

  } catch (error) {
    console.error('[Proxy] Error downloading file:', error);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return c.json({ error: 'Download timeout - file took too long to download' }, 408);
    }
    
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to download file' 
    }, 500);
  }
}
