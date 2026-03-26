/**
 * Component File Editor - Direct Component File Editing CMS
 *
 * This component allows editors to modify React component files directly,
 * updating arrays and values that are then immediately reflected on the public site.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Code,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
  ArrowUp,
  ArrowDown,
  Copy,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { COMPONENT_SCHEMAS, getEditableSchemas, type ComponentSchema, type EditableField, type ArrayField } from '../../utils/component-schemas';

interface ComponentData {
  [fieldName: string]: unknown;
}

interface EditingState {
  selectedPageId: string | null;
  schema: ComponentSchema | null;
  componentData: ComponentData;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  originalContent: string;
  expandedFields: Set<string>;
  expandedItems: Set<string>;
}

export function ComponentFileEditor() {
  const [state, setState] = useState<EditingState>({
    selectedPageId: null,
    schema: null,
    componentData: {},
    isDirty: false,
    isLoading: false,
    isSaving: false,
    originalContent: '',
    expandedFields: new Set(),
    expandedItems: new Set(),
  });

  const editableSchemas = getEditableSchemas();

  // Load component data when a page is selected
  const loadComponent = useCallback(async (schema: ComponentSchema) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Fetch stored data from the database
      const dbResponse = await fetch(`/make-server-9a1ba23f/component-editor/${schema.pageId}`);

      console.log('[ComponentFileEditor] Response status:', dbResponse.status, dbResponse.statusText);
      console.log('[ComponentFileEditor] Response headers:', Object.fromEntries(dbResponse.headers.entries()));

      if (!dbResponse.ok) {
        const contentType = dbResponse.headers.get('content-type');
        console.log('[ComponentFileEditor] Content-Type:', contentType);
        if (contentType && contentType.includes('text/html')) {
          // Got HTML instead of JSON - likely 404 or server error page
          throw new Error(`Server error: Received HTML response. The edge function may not be deployed or may have an error.`);
        }
        throw new Error(`Server error: ${dbResponse.status} ${dbResponse.statusText}`);
      }

      let dbResult;
      let responseText = '';
      try {
        responseText = await dbResponse.text();
        console.log('[ComponentFileEditor] Response text:', responseText);
        dbResult = JSON.parse(responseText);
      } catch (e) {
        console.error('[ComponentFileEditor] Failed to parse JSON:', e);
        console.error('[ComponentFileEditor] Response text (first 500 chars):', responseText?.substring(0, 500));
        throw new Error(`Invalid JSON response from server. The edge function may not be deployed correctly.`);
      }

      if (!dbResult.success || !dbResult.data?.extractedData) {
        throw new Error(dbResult.error || 'No data found for this component');
      }

      const extractedData = dbResult.data.extractedData;

      setState((prev) => ({
        ...prev,
        selectedPageId: schema.pageId,
        schema,
        componentData: extractedData || {},
        isDirty: false,
        isLoading: false,
        originalContent: '',
        expandedFields: new Set(),
        expandedItems: new Set(),
      }));

      toast.success(`Loaded ${schema.title}`);
    } catch (error) {
      console.error('Error loading component:', error);
      toast.error('Failed to load component');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save component changes
  const handleSave = async () => {
    if (!state.schema || !state.isDirty) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const response = await fetch(`/make-server-9a1ba23f/component-editor/${state.schema.pageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: null, // Update all fields
          data: state.componentData,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server error: Received HTML response. The edge function may not be deployed correctly.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save component');
      }

      setState((prev) => ({
        ...prev,
        isDirty: false,
        originalContent: result.data?.content || prev.originalContent,
      }));

      toast.success('Component saved successfully');
    } catch (error) {
      console.error('Error saving component:', error);
      toast.error('Failed to save component');
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      componentData: { ...prev.componentData, [fieldName]: value },
      isDirty: true,
    }));
  };

  // Handle array item changes
  const handleArrayItemChange = (fieldName: string, index: number, key: string, value: unknown) => {
    const array = (state.componentData[fieldName] as unknown[]) || [];
    const newArray = [...array];

    if (!newArray[index]) {
      newArray[index] = {};
    }

    (newArray[index] as Record<string, unknown>)[key] = value;

    handleFieldChange(fieldName, newArray);
  };

  // Add new item to array
  const handleAddItem = (fieldName: string, defaultItem: Record<string, unknown>) => {
    const array = (state.componentData[fieldName] as unknown[]) || [];
    handleFieldChange(fieldName, [...array, { ...defaultItem }]);
  };

  // Remove item from array
  const handleRemoveItem = (fieldName: string, index: number) => {
    const array = (state.componentData[fieldName] as unknown[]) || [];
    const newArray = [...array];
    newArray.splice(index, 1);
    handleFieldChange(fieldName, newArray);
  };

  // Move item in array
  const handleMoveItem = (fieldName: string, index: number, direction: 'up' | 'down') => {
    const array = (state.componentData[fieldName] as unknown[]) || [];
    const newArray = [...array];

    if (direction === 'up' && index > 0) {
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
    } else if (direction === 'down' && index < newArray.length - 1) {
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
    }

    handleFieldChange(fieldName, newArray);
  };

  // Toggle field expansion
  const toggleFieldExpansion = (fieldName: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedFields);
      if (newExpanded.has(fieldName)) {
        newExpanded.delete(fieldName);
      } else {
        newExpanded.add(fieldName);
      }
      return { ...prev, expandedFields: newExpanded };
    });
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return { ...prev, expandedItems: newExpanded };
    });
  };

  // Render field editor based on field type
  const renderFieldEditor = (field: EditableField) => {
    if (field.type === 'array') {
      return <ArrayFieldEditor
        key={field.name}
        field={field}
        data={state.componentData[field.name] as unknown[]}
        onChange={(value) => handleFieldChange(field.name, value)}
        onItemChange={(index, key, value) => handleArrayItemChange(field.name, index, key, value)}
        onAddItem={() => handleAddItem(field.name, field.defaultItem || {})}
        onRemoveItem={(index) => handleRemoveItem(field.name, index)}
        onMoveItem={(index, direction) => handleMoveItem(field.name, index, direction)}
        isExpanded={state.expandedFields.has(field.name)}
        onToggleExpand={() => toggleFieldExpansion(field.name)}
        expandedItems={state.expandedItems}
        onToggleItemExpand={toggleItemExpansion}
      />;
    } else if (field.type === 'simple') {
      return <SimpleFieldEditor
        key={field.name}
        field={field}
        value={state.componentData[field.name] as string}
        onChange={(value) => handleFieldChange(field.name, value)}
      />;
    }

    return (
      <Card key={field.name || field.label}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Info className="w-4 h-4" />
            <span className="text-sm">This field type ({field.type}) is not yet editable.</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Component File Editor</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Edit React component data. Initial data is loaded from source files, edits are saved to the database.
          </p>
        </div>
        {state.isDirty && (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">How it works</p>
              <p className="mb-2">
                This editor loads initial data from <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded font-mono text-xs">
                  src/components/league-info/
                </code> and stores your edits in the database. Edits are currently saved separately from the source files.
              </p>
              <p>
                Only components with array-based data structures are editable. Components with hardcoded JSX or
                API-based content are not editable through this interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Component List Sidebar */}
        <Card className="w-72 shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">Select Component</CardTitle>
            <CardDescription>Choose a component to edit</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {editableSchemas.map((schema) => (
                <button
                  key={schema.pageId}
                  onClick={() => loadComponent(schema)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    state.selectedPageId === schema.pageId
                      ? 'bg-[#013fac]/5 border-l-4 border-l-[#013fac]'
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {schema.title}
                  </div>
                  {schema.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {schema.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor Panel */}
        <div className="flex-1">
          {!state.schema ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <FileText className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a component to edit</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </CardContent>
            </Card>
          ) : state.isLoading ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-[400px]">
                <RefreshCw className="w-8 h-8 mb-4 text-[#013fac] animate-spin" />
                <p className="text-gray-600">Loading component...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Component Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{state.schema.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Editing: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                          {state.schema.componentFile}
                        </code>
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={!state.isDirty || state.isSaving}
                      className="bg-[#013fac] hover:bg-[#0149c9]"
                    >
                      {state.isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Fields */}
              <div className="space-y-4">
                {state.schema.editableFields.map((field) => renderFieldEditor(field))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Array Field Editor Component
// ============================================

interface ArrayFieldEditorProps {
  field: ArrayField;
  data: unknown[] | undefined;
  onChange: (value: unknown[]) => void;
  onItemChange: (index: number, key: string, value: unknown) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedItems: Set<string>;
  onToggleItemExpand: (itemId: string) => void;
}

function ArrayFieldEditor({
  field,
  data,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  isExpanded,
  onToggleExpand,
  expandedItems,
  onToggleItemExpand,
}: ArrayFieldEditorProps) {
  const items = data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <div>
              <CardTitle className="text-base">{field.label}</CardTitle>
              <CardDescription>{items.length} items</CardDescription>
            </div>
          </div>
          <Button
            onClick={onAddItem}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Code className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No items yet. Click "Add Item" to create one.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const itemId = `${field.name}-${index}`;
              const itemExpanded = expandedItems.has(itemId);

              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Item Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleItemExpand(itemId)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {itemExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getItemTitle(item, field.itemSchema)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Fields */}
                  {itemExpanded && (
                    <div className="p-3 space-y-3">
                      {Object.entries(field.itemSchema).map(([key, propSchema]) => (
                        <div key={key}>
                          <Label className="text-sm font-medium">
                            {propSchema.label}
                            {propSchema.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {propSchema.type === 'multiline' ? (
                            <Textarea
                              value={(item as Record<string, unknown>)[key] as string || ''}
                              onChange={(e) => onItemChange(index, key, e.target.value)}
                              placeholder={propSchema.placeholder}
                              className="mt-1 min-h-[80px]"
                            />
                          ) : (
                            <Input
                              type={propSchema.type === 'number' ? 'number' : 'text'}
                              value={(item as Record<string, unknown>)[key] as string || ''}
                              onChange={(e) =>
                                onItemChange(
                                  index,
                                  key,
                                  propSchema.type === 'number'
                                    ? Number(e.target.value)
                                    : e.target.value
                                )
                              }
                              placeholder={propSchema.placeholder}
                              className="mt-1"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================
// Simple Field Editor Component
// ============================================

interface SimpleFieldEditorProps {
  field: { type: 'simple'; name: string; label: string; fieldType: 'text' | 'multiline'; defaultValue?: string };
  value: string | undefined;
  onChange: (value: string) => void;
}

function SimpleFieldEditor({ field, value, onChange }: SimpleFieldEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{field.label}</CardTitle>
      </CardHeader>
      <CardContent>
        {field.fieldType === 'multiline' ? (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="min-h-[100px]"
          />
        ) : (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Helper Functions
// ============================================

function getItemTitle(item: unknown, schema: Record<string, { type: string; label: string }>): string {
  const obj = item as Record<string, unknown>;

  // Try to find a "name", "title", or first string field
  const priorityKeys = ['name', 'title', 'letter', 'division', 'role'];
  for (const key of priorityKeys) {
    if (schema[key] && typeof obj[key] === 'string' && obj[key]) {
      return obj[key] as string;
    }
  }

  // Use the first field as fallback
  const firstKey = Object.keys(schema)[0];
  if (firstKey && typeof obj[firstKey] === 'string') {
    return obj[firstKey] as string;
  }

  return 'Untitled Item';
}