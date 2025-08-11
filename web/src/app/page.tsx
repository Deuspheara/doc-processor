'use client';

import { useState, useEffect } from 'react';
import { FileText, Upload, Workflow, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface HealthStatus {
  status: string;
  mistral_api_configured: boolean;
  langextract_api_configured: boolean;
  available_endpoints: string[];
}

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check API health status
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Failed to fetch health status:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    { name: 'Documents Processed', value: '12', icon: FileText, color: 'bg-blue-500' },
    { name: 'Active Workflows', value: '3', icon: Workflow, color: 'bg-green-500' },
    { name: 'Success Rate', value: '98%', icon: TrendingUp, color: 'bg-purple-500' },
    { name: 'Files Uploaded', value: '24', icon: Upload, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Document processing and workflow management
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* API Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">API Status</h2>
        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : healthStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                healthStatus.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">API Health: {healthStatus.status}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                healthStatus.mistral_api_configured ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">Mistral OCR: {
                healthStatus.mistral_api_configured ? 'Configured' : 'Not Configured'
              }</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                healthStatus.langextract_api_configured ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">LangExtract: {
                healthStatus.langextract_api_configured ? 'Configured' : 'Not Configured'
              }</span>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Failed to load API status</div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/upload" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <p className="text-gray-600">Process new documents with OCR and extraction</p>
            </div>
          </div>
        </Link>

        <Link href="/workflows" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Workflow className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Create Workflow</h3>
              <p className="text-gray-600">Build custom document processing workflows</p>
            </div>
          </div>
        </Link>

        <Link href="/results" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">View Results</h3>
              <p className="text-gray-600">Browse processed documents and results</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
