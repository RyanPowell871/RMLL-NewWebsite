import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.ts";
import * as kv from "./kv_store.ts";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const DOCUMENTS_BUCKET_NAME = db.DOCUMENTS_BUCKET;

// Document type definition (matches KV store structure)
interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: string;
  subcategory?: string | null;
  document_year?: number | null;
  division_id?: number | null;
  season_id?: number | null;
  upload_date: string;
  is_public: boolean;
}

// ============================================
// KV STORE DOCUMENT OPERATIONS
// ============================================

// Get all documents from KV store
async function getAllDocuments(): Promise<Document[]> {
  const docs = await kv.getByPrefix('document:');
  return docs.filter((doc: Document) => doc && doc.id).sort((a: Document, b: Document) => {
    // Sort by year desc, then upload date desc
    const yearA = a.document_year || 0;
    const yearB = b.document_year || 0;
    if (yearA !== yearB) return yearB - yearA;
    return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
  });
}

// Filter documents
function filterDocuments(docs: Document[], options: { category?: string; division?: number; season?: number; publicOnly?: boolean }): Document[] {
  let filtered = docs;

  if (options.category) {
    filtered = filtered.filter(doc => doc.category === options.category);
  }
  if (options.division) {
    filtered = filtered.filter(doc => doc.division_id === options.division);
  }
  if (options.season) {
    filtered = filtered.filter(doc => doc.season_id === options.season);
  }
  if (options.publicOnly) {
    filtered = filtered.filter(doc => doc.is_public);
  }

  return filtered;
}

// Get a document by ID from KV store
async function getDocumentById(id: string): Promise<Document | null> {
  const doc = await kv.get(`document:${id}`);
  return doc || null;
}

// Create a document in KV store
async function createDocumentInKV(document: Document): Promise<Document> {
  const key = `document:${document.id}`;
  await kv.set(key, document);
  return document;
}

// Update a document in KV store
async function updateDocumentInKV(id: string, updates: Partial<Document>): Promise<Document> {
  const existing = await getDocumentById(id);
  if (!existing) {
    throw new Error('Document not found');
  }
  const updated = { ...existing, ...updates };
  await kv.set(`document:${id}`, updated);
  return updated;
}

// Delete a document from KV store
async function deleteDocumentFromKV(id: string): Promise<void> {
  await kv.del(`document:${id}`);
}

// Delete all documents from KV store
async function deleteAllDocumentsFromKV(): Promise<number> {
  const docs = await kv.getByPrefix('document:');
  const keys = docs.map((doc: Document) => `document:${doc.id}`);
  if (keys.length > 0) {
    await kv.mdel(keys);
  }
  return keys.length;
}

// ============================================
// DOCUMENT UPLOAD & MANAGEMENT ROUTES
// ============================================

// Get documents (with optional filters)
app.get("/documents", async (c) => {
  try {
    const { category, division, season } = c.req.query();

    const allDocuments = await getAllDocuments();
    const filtered = filterDocuments(allDocuments, {
      category,
      division: division ? parseInt(division) : undefined,
      season: season ? parseInt(season) : undefined,
      publicOnly: false, // Admin sees all
    });

    return c.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Upload document with metadata
app.post("/upload-document", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const subcategory = formData.get('subcategory') as string;
    const document_year = formData.get('document_year');
    const is_public = formData.get('is_public') === 'true';
    const division_id = formData.get('division_id');
    const season_id = formData.get('season_id');

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    if (!title) {
      return c.json({ success: false, error: 'Title is required' }, 400);
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 10MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop() || 'pdf';
    const filename = `${timestamp}-${randomString}.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .upload(filename, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const file_url = db.getPublicUrl(DOCUMENTS_BUCKET_NAME, filename);

    // Create document in KV store
    const id = crypto.randomUUID();
    const document: Document = {
      id,
      title,
      description: description || '',
      file_url,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      category: category || 'other',
      subcategory: subcategory || null,
      document_year: document_year ? parseInt(document_year) : null,
      division_id: division_id ? parseInt(division_id) : null,
      season_id: season_id ? parseInt(season_id) : null,
      upload_date: new Date().toISOString(),
      is_public,
    };

    await createDocumentInKV(document);

    return c.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create document record (metadata only or duplicate check)
app.post("/documents", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.title || !body.file_url) {
      return c.json({ success: false, error: "Title and file_url are required" }, 400);
    }

    // Check for duplicates by file_url
    if (!body.skipDuplicateCheck) {
      const allDocuments = await getAllDocuments();
      const duplicate = allDocuments.find(doc => doc.file_url === body.file_url);

      if (duplicate) {
        console.log(`[Documents] Duplicate detected: ${body.file_url} already exists as ${duplicate.id}`);
        return c.json({
          success: false,
          error: "Duplicate document",
          duplicate: true,
          existingDocument: duplicate
        }, 409);
      }
    }

    const id = body.id || crypto.randomUUID();
    const document: Document = {
      id,
      title: body.title,
      description: body.description || '',
      file_url: body.file_url,
      file_name: body.file_name || '',
      file_size: body.file_size || 0,
      file_type: body.file_type || 'application/pdf',
      category: body.category || 'other',
      subcategory: body.subcategory || null,
      document_year: body.document_year || null,
      division_id: body.division_id || null,
      season_id: body.season_id || null,
      upload_date: body.upload_date || new Date().toISOString(),
      is_public: body.is_public !== undefined ? body.is_public : true,
    };

    await createDocumentInKV(document);

    console.log(`[Documents] Created document: ${document.id} - ${document.title}`);

    return c.json({ success: true, data: document }, 201);
  } catch (error) {
    console.error("Error creating document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete document
app.delete("/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await getDocumentById(id);
    if (!existing) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }

    // Delete file from storage if we can extract the filename
    try {
      const url = new URL(existing.file_url);
      const filename = url.pathname.split('/').pop();
      if (filename) {
        await db.deleteFromStorage(DOCUMENTS_BUCKET_NAME, filename);
      }
    } catch (e) {
      console.log('[Documents] Could not extract filename from URL, skipping storage deletion');
    }

    await deleteDocumentFromKV(id);

    return c.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update document metadata
app.patch("/documents/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await getDocumentById(id);
    if (!existing) {
      return c.json({ success: false, error: "Document not found" }, 404);
    }

    const body = await c.req.json();

    const updates: Partial<Document> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory || null;
    if (body.document_year !== undefined) updates.document_year = body.document_year;

    const updatedDoc = await updateDocumentInKV(id, updates);

    console.log(`[Documents] Updated document: ${id} - category: ${updatedDoc.category}, subcategory: ${updatedDoc.subcategory}`);

    return c.json({ success: true, data: updatedDoc });
  } catch (error) {
    console.error("Error updating document:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete ALL documents (bulk delete)
app.delete("/documents", async (c) => {
  try {
    const allDocuments = await getAllDocuments();

    if (allDocuments.length === 0) {
      return c.json({ success: true, message: "No documents to delete", deletedCount: 0 });
    }

    // Delete all documents from KV store
    const deletedCount = await deleteAllDocumentsFromKV();

    console.log(`[Documents] Bulk deleted ${deletedCount} documents`);

    return c.json({
      success: true,
      message: `Deleted ${deletedCount} documents`,
      deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting documents:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Extract years from all documents
app.post("/documents/extract-years", async (c) => {
  try {
    const allDocuments = await getAllDocuments();

    if (allDocuments.length === 0) {
      return c.json({ success: true, message: "No documents to process", updatedCount: 0 });
    }

    let updatedCount = 0;

    // Process each document
    for (const doc of allDocuments) {
      const combinedText = `${doc.file_name || ''} ${doc.file_url || ''}`;

      // Match 4-digit years between 2000 and 2099
      const yearMatches = combinedText.match(/\b(20\d{2}|202[0-9])(?=\D|$)/g);

      let detectedYear = null;
      if (yearMatches && yearMatches.length > 0) {
        const years = yearMatches.map(y => parseInt(y, 10));
        detectedYear = Math.max(...years);
      }

      // Only update if we detected a year and it's different from current
      if (detectedYear !== null && doc.document_year !== detectedYear) {
        await updateDocumentInKV(doc.id, { document_year: detectedYear });
        updatedCount++;
        console.log(`[Documents] Updated document ${doc.id} with year ${detectedYear}`);
      }
    }

    console.log(`[Documents] Year extraction complete. Updated ${updatedCount} of ${allDocuments.length} documents`);

    return c.json({
      success: true,
      message: `Updated ${updatedCount} documents with detected years`,
      updatedCount,
      totalDocuments: allDocuments.length
    });
  } catch (error) {
    console.error("Error extracting years:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Re-categorize uncategorized documents by analyzing content
app.post("/documents/recategorize", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const forceAll = body?.forceAll === true;

    const allDocuments = await getAllDocuments();

    // If forceAll, process all documents; otherwise only uncategorized
    const docsToProcess = forceAll
      ? allDocuments
      : allDocuments.filter(doc =>
          doc.category === 'other' || doc.category === 'uncategorized' || !doc.category ||
          doc.category === 'administration' || doc.category === 'general'
        );

    if (docsToProcess.length === 0) {
      return c.json({
        success: true,
        message: "No documents to process",
        analyzedCount: 0,
        updatedCount: 0
      });
    }

    // Enhanced category definitions with RMLL-specific keywords
    const categoryKeywords: Record<string, { keywords: string[]; subcategories: Record<string, string[]> }> = {
      'governance': {
        keywords: ['bylaw', 'by-law', 'constitution', 'governance', 'charter', 'amendment', 'policy', 'procedure', 'protocol'],
        subcategories: {
          'bylaws': ['bylaw', 'by-law', 'amendment'],
          'constitution': ['constitution', 'charter'],
          'policies': ['policy', 'procedure', 'protocol', 'guideline'],
          'code-of-conduct': ['code of conduct', 'conduct', 'ethics', 'behaviour', 'behavior', 'discipline']
        }
      },
      'rules-regulations': {
        keywords: ['rule', 'regulation', 'playing', 'game rule', 'league rule', 'penalty', 'infraction'],
        subcategories: {
          'playing-rules': ['playing rule', 'game rule', 'rules of play', 'box lacrosse rule'],
          'league-regulations': ['league regulation', 'league rule', 'competition rule', 'rmll regulation'],
          'safety': ['safety', 'protection', 'equipment', 'injury', 'helmet', 'concussion'],
          'penalties': ['penalty', 'suspension', 'infraction', 'misconduct', 'ejection', 'match penalty']
        }
      },
      'officiating': {
        keywords: ['referee', 'official', 'officiating', 'ref ', 'umpire', 'game sheet', 'cra', 'arbiter', 'whistle', 'signal'],
        subcategories: {
          'referee-manuals': ['referee manual', 'referee guide', 'official guide', 'officiating manual'],
          'game-sheets': ['game sheet', 'score sheet', 'scoresheet', 'game report'],
          'referee-assignments': ['referee assignment', 'ref assignment', 'official assignment', 'arbiter'],
          'cra': ['cra', 'canadian referee', 'referee association'],
          'signals-mechanics': ['signal', 'mechanic', 'positioning', 'hand signal'],
          'officiating-forms': ['referee form', 'official form', 'incident report', 'misconduct report', 'ref report'],
          'referee-training': ['referee clinic', 'ref clinic', 'official clinic', 'referee training', 'certification']
        }
      },
      'forms': {
        keywords: ['form', 'application', 'template', 'blank', 'fillable', 'submission'],
        subcategories: {
          'registration': ['registration', 'intent to play', 'intent-to-play', 'itp', 'sign up', 'signup', 'ramp'],
          'waivers': ['waiver', 'release', 'liability', 'consent', 'assumption of risk'],
          'transfer': ['transfer', 'trade form', 'player movement', 'release form'],
          'team-forms': ['team form', 'franchise', 'team application', 'roster form', 'bench staff'],
          'player-forms': ['player form', 'player card', 'eligibility', 'age verification', 'overage'],
          'coaching-forms': ['coaching form', 'coach application', 'nccp', 'coaching certification'],
          'expense-forms': ['expense', 'reimbursement', 'mileage', 'travel claim'],
          'other-forms': ['form', 'template']
        }
      },
      'insurance': {
        keywords: ['insurance', 'coverage', 'claim', 'certificate', 'liability insurance', 'cgl'],
        subcategories: {
          'certificates': ['certificate', 'proof of insurance', 'cgl certificate', 'insurance cert'],
          'claims': ['claim', 'claim form', 'injury claim', 'accident claim'],
          'coverage': ['coverage', 'policy coverage', 'insurance policy'],
          'facility-insurance': ['facility insurance', 'venue insurance', 'arena insurance', 'additional insured']
        }
      },
      'meetings': {
        keywords: ['minute', 'meeting', 'agm', 'agenda', 'board', 'motion'],
        subcategories: {
          'board-minutes': ['board minute', 'board meeting', 'directors meeting', 'executive meeting'],
          'agm': ['agm', 'annual general meeting', 'annual meeting'],
          'committee-minutes': ['committee minute', 'committee meeting'],
          'special-meetings': ['special meeting', 'emergency meeting']
        }
      },
      'financial': {
        keywords: ['budget', 'financial', 'fee', 'cost', 'payment', 'invoice', 'fs', 'compiled financial', 'treasurer', 'revenue'],
        subcategories: {
          'budgets': ['budget', 'financial plan', 'operating budget'],
          'financial-reports': ['financial report', 'financial statement', 'treasurer report', 'audit'],
          'compiled-financial': ['fs', 'compiled financial', 'compiled fs'],
          'fee-schedules': ['fee schedule', 'registration fee', 'cost', 'price', 'fee structure']
        }
      },
      'schedules': {
        keywords: ['schedule', 'calendar', 'fixture', 'timetable', 'dates'],
        subcategories: {
          'game-schedules': ['game schedule', 'match schedule', 'fixture', 'weekly schedule'],
          'season-calendars': ['season calendar', 'season schedule', 'annual calendar', 'master calendar'],
          'playoff-schedules': ['playoff', 'tournament', 'provincial', 'championship schedule', 'bracket'],
          'event-schedules': ['event schedule', 'combine schedule', 'clinic schedule', 'draft schedule']
        }
      },
      'rosters': {
        keywords: ['roster', 'lineup', 'team list', 'player list', 'squad', 'protected'],
        subcategories: {
          'team-rosters': ['team roster', 'player roster', 'squad list', 'active roster'],
          'protected-lists': ['protected list', 'protected player', 'keeper list', 'protection list'],
          'draft-lists': ['draft list', 'draft pick', 'draft order', 'draft result', 'draft selection']
        }
      },
      'transactions': {
        keywords: ['transaction', 'trade', 'acquisition', 'release', 'waiver wire'],
        subcategories: {
          'trades': ['trade', 'traded', 'swap', 'deal'],
          'signings': ['signing', 'signed', 'acquisition', 'acquired'],
          'releases': ['release', 'released', 'waived', 'cut'],
          'call-ups': ['call-up', 'callup', 'loan', 'affiliate']
        }
      },
      'statistics': {
        keywords: ['stats', 'statistics', 'report', 'analysis', 'data', 'scoring'],
        subcategories: {
          'player-stats': ['player stat', 'individual stat', 'scoring leader'],
          'team-stats': ['team stat', 'team performance', 'team ranking', 'standings'],
          'season-reports': ['season report', 'annual report', 'year end', 'season summary'],
          'game-reports': ['game report', 'match report', 'box score', 'game summary']
        }
      },
      'communications': {
        keywords: ['newsletter', 'announcement', 'communication', 'bulletin', 'notice', 'memo'],
        subcategories: {
          'newsletters': ['newsletter', 'news letter'],
          'announcements': ['announcement', 'notice', 'alert'],
          'press-releases': ['press release', 'media release'],
          'memos': ['memo', 'memorandum', 'letter to']
        }
      },
      'historical': {
        keywords: ['history', 'historical', 'archive', 'past', 'legacy'],
        subcategories: {
          'archives': ['archive', 'archived', 'old', 'previous season'],
          'hall-of-fame': ['hall of fame', 'hof', 'legend', 'honour', 'honor'],
          'championships': ['championship', 'champion', 'title', 'winner', 'founders cup', 'minto cup'],
          'milestones': ['milestone', 'achievement', 'record']
        }
      }
    };

    let updatedCount = 0;

    for (const doc of docsToProcess) {
      try {
        let textToAnalyze = `${doc.title || ''} ${doc.description || ''} ${doc.file_name || ''} ${doc.file_url || ''}`.toLowerCase();

        // Extract year
        const combinedText = `${doc.file_name || ''} ${doc.file_url || ''}`;
        const yearMatches = combinedText.match(/\b(20\d{2}|202[0-9])(?=\D|$)/g);

        let detectedYear = doc.document_year;
        if (yearMatches && yearMatches.length > 0) {
          const years = yearMatches.map(y => parseInt(y, 10));
          detectedYear = Math.max(...years);
        }

        let bestMatch = {
          category: 'other',
          subcategory: 'uncategorized' as string | undefined,
          score: 0
        };

        for (const [categoryId, categoryData] of Object.entries(categoryKeywords)) {
          let categoryScore = 0;

          for (const keyword of categoryData.keywords) {
            if (textToAnalyze.includes(keyword)) {
              categoryScore += 2;
            }
          }

          let bestSubcategoryMatch: { id: string; score: number } | null = null;

          for (const [subcategoryId, subcategoryKeywords] of Object.entries(categoryData.subcategories)) {
            let subcategoryScore = 0;

            for (const keyword of subcategoryKeywords) {
              if (textToAnalyze.includes(keyword)) {
                subcategoryScore += 3;
              }
            }

            if (subcategoryScore > 0 && (!bestSubcategoryMatch || subcategoryScore > bestSubcategoryMatch.score)) {
              bestSubcategoryMatch = { id: subcategoryId, score: subcategoryScore };
            }
          }

          const totalScore = categoryScore + (bestSubcategoryMatch?.score || 0);

          if (totalScore > bestMatch.score) {
            bestMatch = {
              category: categoryId,
              subcategory: bestSubcategoryMatch?.id,
              score: totalScore
            };
          }
        }

        const minScore = forceAll ? 1 : 2;

        if (bestMatch.score >= minScore && bestMatch.category !== 'other') {
          await updateDocumentInKV(doc.id, {
            category: bestMatch.category,
            subcategory: bestMatch.subcategory || null,
            document_year: detectedYear
          });
          updatedCount++;
        } else if (detectedYear && detectedYear !== doc.document_year) {
          await updateDocumentInKV(doc.id, { document_year: detectedYear });
        }
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
      }
    }

    return c.json({
      success: true,
      message: `Re-categorized ${updatedCount} documents`,
      analyzedCount: docsToProcess.length,
      updatedCount,
      mode: forceAll ? 'force-all' : 'uncategorized-only'
    });
  } catch (error) {
    console.error("Error re-categorizing documents:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Import documents from CSV/JSON
app.post("/documents/import", async (c) => {
  try {
    const body = await c.req.json();
    const documents = body.documents as Document[];

    if (!Array.isArray(documents)) {
      return c.json({ success: false, error: 'documents must be an array' }, 400);
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const doc of documents) {
      try {
        if (!doc.id || !doc.title || !doc.file_url) {
          errors.push(`Missing required fields for document: ${JSON.stringify(doc)}`);
          continue;
        }

        // Check if already exists
        const existing = await getDocumentById(doc.id);
        if (existing) {
          skipped++;
          continue;
        }

        await createDocumentInKV(doc);
        imported++;
      } catch (e: any) {
        errors.push(`Error importing ${doc.id}: ${e.message}`);
      }
    }

    return c.json({
      success: true,
      message: `Imported ${imported} documents, skipped ${skipped} existing`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing documents:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;