import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { CharacterExtractionDialog } from '@/components/CharacterExtractionDialog'

interface ImportDialogProps {
  onImport: (title: string, content: string, sourceUrl?: string) => void
}

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [googleDriveUrl, setGoogleDriveUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [characterExtractionOpen, setCharacterExtractionOpen] = useState(false)
  const [pendingDocument, setPendingDocument] = useState<{ title: string; content: string; sourceUrl?: string } | null>(null)

  const handleImportFromUrl = async () => {
    if (!googleDriveUrl.trim()) {
      toast.error('Google Drive URL is required. Please enter a valid URL.')
      return
    }

    setIsLoading(true)
    
    try {
      let fileId = ''
      
      if (googleDriveUrl.includes('/document/d/')) {
        const match = googleDriveUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      } else if (googleDriveUrl.includes('/file/d/')) {
        const match = googleDriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      } else if (googleDriveUrl.includes('id=')) {
        const match = googleDriveUrl.match(/id=([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      }

      if (!fileId) {
        toast.error('Invalid Google Drive URL format. Could not extract file ID. Expected format: https://docs.google.com/document/d/YOUR_FILE_ID/edit')
        setIsLoading(false)
        return
      }

      const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`
      
      let response: Response
      try {
        response = await fetch(exportUrl)
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown network error'
        toast.error(`Network error while fetching document: ${errorMsg}. Check your internet connection.`)
        console.error('Import fetch error:', fetchError)
        setIsLoading(false)
        return
      }
      
      if (!response.ok) {
        const statusText = response.statusText || 'Unknown error'
        if (response.status === 404) {
          toast.error(`Document not found (404). The file ID may be incorrect or the document may have been deleted.`)
        } else if (response.status === 403) {
          toast.error(`Access denied (403). Make sure the document is set to "Anyone with the link can view" in sharing settings.`)
        } else if (response.status === 401) {
          toast.error(`Unauthorized (401). The document is not publicly accessible. Update sharing settings to "Anyone with the link can view".`)
        } else {
          toast.error(`HTTP ${response.status}: ${statusText}. Failed to fetch document from Google Drive.`)
        }
        console.error('Import HTTP error:', response.status, statusText)
        setIsLoading(false)
        return
      }

      let text: string
      try {
        text = await response.text()
      } catch (textError) {
        const errorMsg = textError instanceof Error ? textError.message : 'Unknown error'
        toast.error(`Failed to read document content: ${errorMsg}`)
        console.error('Import text read error:', textError)
        setIsLoading(false)
        return
      }

      if (!text || text.trim().length === 0) {
        toast.error('Document is empty. The imported document contains no text content.')
        setIsLoading(false)
        return
      }

      if (text.length < 10) {
        toast.error(`Document is too short (${text.length} characters). Expected at least 10 characters of content.`)
        setIsLoading(false)
        return
      }
      
      const docTitle = text.split('\n')[0] || 'Imported Document'
      
      setPendingDocument({ title: docTitle.trim(), content: text, sourceUrl: googleDriveUrl })
      setCharacterExtractionOpen(true)
      
      toast.success(`Document imported successfully! (${text.length} characters)`)
      setOpen(false)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Import failed: ${errorMsg}`)
      console.error('Import unexpected error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualImport = () => {
    if (!title.trim() && !content.trim()) {
      toast.error('Both title and content are required. Please provide the document title and content.')
      return
    }
    
    if (!title.trim()) {
      toast.error('Document title is required. Please provide a title for your document.')
      return
    }
    
    if (!content.trim()) {
      toast.error('Document content is required. Please provide content for your document.')
      return
    }

    if (title.trim().length < 2) {
      toast.error(`Title is too short (${title.trim().length} characters). Please provide at least 2 characters.`)
      return
    }

    if (content.trim().length < 10) {
      toast.error(`Content is too short (${content.trim().length} characters). Please provide at least 10 characters.`)
      return
    }

    setPendingDocument({ title: title.trim(), content: content.trim() })
    setCharacterExtractionOpen(true)
    
    toast.success('Document created successfully!')
    setOpen(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTitle('')
      setContent('')
      setGoogleDriveUrl('')
    }
  }

  const handleCharactersCreated = (characters: Array<{ title: string; content: string }>) => {
    if (pendingDocument) {
      onImport(pendingDocument.title, pendingDocument.content, pendingDocument.sourceUrl)
      
      characters.forEach((character) => {
        onImport(character.title, character.content)
      })
      
      setPendingDocument(null)
      setTitle('')
      setContent('')
      setGoogleDriveUrl('')
    }
  }

  const handleCharacterExtractionClose = () => {
    if (pendingDocument) {
      onImport(pendingDocument.title, pendingDocument.content, pendingDocument.sourceUrl)
      setPendingDocument(null)
      setTitle('')
      setContent('')
      setGoogleDriveUrl('')
    }
    setCharacterExtractionOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Upload size={18} />
            Import Document
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Document</DialogTitle>
            <DialogDescription>
              Import a document from Google Drive or create a new one manually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="google-drive-url">Google Drive URL</Label>
              <Input
                id="google-drive-url"
                placeholder="https://docs.google.com/document/d/..."
                value={googleDriveUrl}
                onChange={(e) => setGoogleDriveUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to a publicly accessible Google Doc
              </p>
              <Button
                onClick={handleImportFromUrl}
                disabled={!googleDriveUrl.trim() || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? 'Importing...' : (
                  <>
                    <Sparkle size={16} weight="fill" />
                    Import & Scan for Characters
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or create manually</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Document title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Document content... (Supports markdown: # Heading, ## Subheading)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualImport} disabled={!title.trim() || !content.trim()} className="gap-2">
              <Sparkle size={16} weight="fill" />
              Create & Scan for Characters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingDocument && (
        <CharacterExtractionDialog
          open={characterExtractionOpen}
          onOpenChange={handleCharacterExtractionClose}
          documentContent={pendingDocument.content}
          documentTitle={pendingDocument.title}
          onCharactersCreated={handleCharactersCreated}
        />
      )}
    </>
  )
}
