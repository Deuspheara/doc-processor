import { 
  Alert, 
  AlertDescription, 
  AlertTitle,
  Badge,
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Progress,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui'
import { AlertCircle, CheckCircle, FileText, Settings, Upload } from 'lucide-react'

export default function ComponentsDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Shadcn UI Components Demo</h1>
        <p className="text-muted-foreground">
          Your finance app is now powered by beautiful, accessible components
        </p>
      </div>

      <Separator />

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Different button variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-x-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent className="space-x-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </CardContent>
      </Card>

      {/* Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Inputs, labels, and form controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Document processed successfully. Your data has been extracted.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            Failed to process document. Please check your file format.
          </AlertDescription>
        </Alert>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Indicators</CardTitle>
          <CardDescription>Show processing status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing document...</span>
              <span>65%</span>
            </div>
            <Progress value={65} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>OCR analysis</span>
              <span>Complete</span>
            </div>
            <Progress value={100} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Tabs</CardTitle>
          <CardDescription>Organize content into tabs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="process" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Process
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4 p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Document Upload</h3>
              <p className="text-muted-foreground">
                Drag and drop your documents here or click to browse files.
              </p>
            </TabsContent>
            <TabsContent value="process" className="mt-4 p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Processing Options</h3>
              <p className="text-muted-foreground">
                Configure how you want your documents to be processed.
              </p>
            </TabsContent>
            <TabsContent value="settings" className="mt-4 p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Application Settings</h3>
              <p className="text-muted-foreground">
                Manage your preferences and API configurations.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Dialogs & Modals</CardTitle>
          <CardDescription>Interactive popup components</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Document Processing Settings</DialogTitle>
                <DialogDescription>
                  Configure how you want your document to be processed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="extraction-type">Extraction Type</Label>
                  <Input
                    id="extraction-type"
                    placeholder="e.g., Financial Data, Text Only"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Format</Label>
                  <Input
                    id="output-format"
                    placeholder="e.g., JSON, CSV, Excel"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Settings</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
