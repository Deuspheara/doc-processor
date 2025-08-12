'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';

type Result = {
  id: string;
  filename: string;
  url: string;
  status: 'processed' | 'processing' | 'failed';
  timestamp: string;
};

const mockResults: Result[] = [
  {
    id: '1',
    filename: 'invoice-123.pdf',
    url: '/document',
    status: 'processed',
    timestamp: '2023-10-27T10:00:00Z',
  },
  {
    id: '2',
    filename: 'receipt-456.jpg',
    url: '/document',
    status: 'processing',
    timestamp: '2023-10-27T11:30:00Z',
  },
  {
    id: '3',
    filename: 'contract-789.docx',
    url: '/document',
    status: 'failed',
    timestamp: '2023-10-27T12:15:00Z',
  },
  {
    id: '4',
    filename: 'statement-abc.pdf',
    url: '/document',
    status: 'processed',
    timestamp: '2023-10-26T09:00:00Z',
  },
];

const ResultsPage = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading results...</div>
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
      <h1 className="text-3xl font-bold mb-8">Processed Document Results</h1>
      
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
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(result => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.filename}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(result.status)}>
                      {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(result.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        View Document
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
    </div>
  );
};

export default ResultsPage;