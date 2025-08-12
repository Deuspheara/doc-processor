'use client';

import { useState, useEffect } from 'react';
import { FileText, Upload, Workflow, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface HealthStatus {
  status: string;
  mistral_api_configured: boolean;
  langextract_api_configured: boolean;
  available_endpoints: string[];
}

function AuthenticatedDashboard() {
  const { user } = useUser();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const documents = useQuery(api.documents.list, {});
  const workflows = useQuery(api.workflows.list, {});

  useEffect(() => {
    // Check API health status
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Failed to fetch health status:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const processedDocuments = documents?.documents?.filter(doc => doc.status === 'processed').length || 0;
  const activeWorkflows = workflows?.filter(wf => wf.is_active).length || 0;
  const totalDocuments = documents?.documents?.length || 0;
  const successRate = totalDocuments > 0 ? Math.round((processedDocuments / totalDocuments) * 100) : 0;

  const stats = [
    { name: 'Documents Processed', value: processedDocuments.toString(), icon: FileText, color: 'bg-blue-500' },
    { name: 'Active Workflows', value: activeWorkflows.toString(), icon: Workflow, color: 'bg-green-500' },
    { name: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'bg-purple-500' },
    { name: 'Files Uploaded', value: totalDocuments.toString(), icon: Upload, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Document processing and workflow management
          </p>
        </div>
        <Button asChild>
          <Link href="/upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Link>
        </Button>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : healthStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthStatus.status}
                </Badge>
                <span className="text-sm font-medium">API Health</span>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={healthStatus.mistral_api_configured ? 'default' : 'secondary'}>
                  {healthStatus.mistral_api_configured ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className="text-sm font-medium">Mistral OCR</span>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={healthStatus.langextract_api_configured ? 'default' : 'secondary'}>
                  {healthStatus.langextract_api_configured ? 'Configured' : 'Not Configured'}
                </Badge>
                <span className="text-sm font-medium">LangExtract</span>
              </div>
            </div>
          ) : (
            <div className="text-destructive">Failed to load API status</div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/upload" className="block">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload Document</CardTitle>
                  <CardDescription>Process new documents with OCR and extraction</CardDescription>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/workflows" className="block">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Workflow className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Workflow</CardTitle>
                  <CardDescription>Build custom document processing workflows</CardDescription>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/results" className="block">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">View Results</CardTitle>
                  <CardDescription>Browse processed documents and results</CardDescription>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

function UnauthenticatedLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Document Processing Platform</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          AI-powered document processing with OCR, information extraction, and custom workflows. 
          Sign in to get started.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-lg inline-block mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="mb-2">Upload & Process</CardTitle>
            <CardDescription>
              Upload documents and extract information with advanced OCR and AI
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-block mb-4">
              <Workflow className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="mb-2">Custom Workflows</CardTitle>
            <CardDescription>
              Build custom processing workflows for your specific needs
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-lg inline-block mb-4">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="mb-2">Secure Results</CardTitle>
            <CardDescription>
              All your documents and results are private and secure
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      
      <SignInButton mode="modal">
        <Button size="lg" className="px-8">
          Get Started
        </Button>
      </SignInButton>
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      <SignedIn>
        <AuthenticatedDashboard />
      </SignedIn>
      <SignedOut>
        <UnauthenticatedLanding />
      </SignedOut>
    </>
  );
}
