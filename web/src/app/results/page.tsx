'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

type DocumentRecord = {
  id: string;
  filename: string;
  status: 'processed' | 'processing' | 'failed';
  timestamp: string;
  file_size_mb: number;
  content_type: string;
  error_message?: string;
};

type DocumentListResponse = {
  documents: DocumentRecord[];
  total_count: number;
};

const ResultsPage = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/documents?limit=50&offset=0');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data: DocumentListResponse = await response.json();
      setDocuments(data.documents);
      setTotalCount(data.total_count);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <div className="text-xl font-semibold">Loading documents...</div>
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
              <h3 className="text-lg font-semibold mb-2">Error Loading Documents</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchDocuments} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            </CardContent>
          </Card>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Document Results</h1>
          <p className="text-gray-600 mt-2">
            {totalCount} document{totalCount !== 1 ? 's' : ''} processed
          </p>
        </div>
        <Button onClick={fetchDocuments} variant="outline" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Documents Processed</h3>
              <p>Upload and process documents to see results here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Document Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(document => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.filename}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(document.status)}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </Badge>
                      {document.status === 'failed' && document.error_message && (
                        <div className="text-xs text-red-600 mt-1" title={document.error_message}>
                          {document.error_message.length > 50 
                            ? `${document.error_message.substring(0, 50)}...` 
                            : document.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {document.file_size_mb.toFixed(1)} MB
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {document.content_type.split('/')[1]?.toUpperCase() || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(document.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={document.status !== 'processed'}
                      >
                        <a
                          href={`/document/${document.id}`}
                          className="flex items-center"
                        >
                          View Results
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsPage;