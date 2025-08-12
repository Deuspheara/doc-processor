'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  Database, 
  AlertCircle, 
  RefreshCw,
  Download,
  Copy,
  Check
} from 'lucide-react';

type ExtractionEntity = {
  extraction_class: string;
  extraction_text: string;
  attributes: Record<string, any>;
  start_char?: number;
  end_char?: number;
};

type ProcessingResult = {
  ocr_text: string;
  extracted_entities: ExtractionEntity[];
  extraction_metadata: Record<string, any>;
  processing_stats: Record<string, any>;
};

type DocumentRecord = {
  id: string;
  filename: string;
  status: 'processed' | 'processing' | 'failed';
  timestamp: string;
  file_size_mb: number;
  content_type: string;
  processing_result?: ProcessingResult;
  error_message?: string;
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const data: DocumentRecord = await response.json();
      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadResults = () => {
    if (!document?.processing_result) return;
    
    const data = {
      document_info: {
        id: document.id,
        filename: document.filename,
        timestamp: document.timestamp,
        file_size_mb: document.file_size_mb,
        content_type: document.content_type
      },
      processing_results: document.processing_result
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.filename}_results.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <div className="text-xl font-semibold">Loading document...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Document</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={fetchDocument} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
                <Button variant="outline" onClick={() => router.push('/results')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Document not found</h2>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/results')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Results</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.filename}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={getStatusVariant(document.status)}>
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600">
                {document.file_size_mb.toFixed(1)} MB
              </span>
              <span className="text-sm text-gray-600">
                {new Date(document.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {document.status === 'processed' && document.processing_result && (
          <Button onClick={downloadResults} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download Results</span>
          </Button>
        )}
      </div>

      {/* Error State */}
      {document.status === 'failed' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Processing Failed</h3>
                <p className="text-red-700 mt-1">{document.error_message || 'Unknown error occurred'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {document.status === 'processing' && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <h3 className="font-semibold text-blue-800">Processing Document</h3>
                <p className="text-blue-700 mt-1">Your document is being processed. Please check back shortly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs - Only show if processed successfully */}
      {document.status === 'processed' && document.processing_result && (
        <Tabs defaultValue="entities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entities" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Extracted Data</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Extracted Text</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Processing Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Extracted Entities */}
          <TabsContent value="entities">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Entities ({document.processing_result.extracted_entities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {document.processing_result.extracted_entities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No entities were extracted from this document.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {document.processing_result.extracted_entities.map((entity, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {entity.extraction_class}
                                </Badge>
                                {entity.attributes.confidence && (
                                  <span className="text-xs text-gray-500">
                                    {Math.round(entity.attributes.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                                {entity.extraction_text}
                              </p>
                              {Object.keys(entity.attributes).length > 0 && (
                                <div className="mt-2">
                                  <details className="text-sm">
                                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                      View Attributes
                                    </summary>
                                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(entity.attributes, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(entity.extraction_text)}
                              className="flex items-center space-x-1"
                            >
                              {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extracted Text */}
          <TabsContent value="text">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>OCR Extracted Text</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(document.processing_result!.ocr_text)}
                  className="flex items-center space-x-2"
                >
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>Copy Text</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {document.processing_result.ocr_text}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Statistics */}
          <TabsContent value="stats">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(document.processing_result.processing_stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-mono">
                        {typeof value === 'number' 
                          ? (key.includes('time') ? `${value.toFixed(2)}s` : value.toLocaleString())
                          : String(value)
                        }
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Extraction Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(document.processing_result.extraction_metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}