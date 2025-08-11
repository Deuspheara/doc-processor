'use client';

import { useState, useEffect } from 'react';

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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Processed Document Results</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Filename
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{result.filename}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {result.status === 'processed' && (
                    <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-green-200 opacity-50 rounded-full"
                      ></span>
                      <span className="relative">Processed</span>
                    </span>
                  )}
                  {result.status === 'processing' && (
                    <span className="relative inline-block px-3 py-1 font-semibold text-yellow-900 leading-tight">
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-yellow-200 opacity-50 rounded-full"
                      ></span>
                      <span className="relative">Processing</span>
                    </span>
                  )}
                  {result.status === 'failed' && (
                    <span className="relative inline-block px-3 py-1 font-semibold text-red-900 leading-tight">
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-red-200 opacity-50 rounded-full"
                      ></span>
                      <span className="relative">Failed</span>
                    </span>
                  )}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Document
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsPage;