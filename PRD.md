# Planning Guide

A wiki-style documentation platform that imports and beautifully renders text documents from Google Drive, creating an organized knowledge base with navigation and search capabilities.

**Experience Qualities**: 
1. **Scholarly** - Clean typography and spacious layouts that prioritize readability and focus, reminiscent of academic journals and thoughtful documentation
2. **Intuitive** - Effortless navigation between documents with clear visual hierarchy and discoverable features that guide users naturally
3. **Refined** - Polished interactions and elegant transitions that make document browsing feel sophisticated and purposeful

**Complexity Level**: Light Application (multiple features with basic state)
This application manages document imports, displays content with formatting, and provides navigation/search functionality, but doesn't require complex data relationships or advanced backend integration beyond Google Drive import.

## Essential Features

### Warhammer Entity Database
- **Functionality**: Store and manage structured data for Warhammer characters, factions, and battles in a JSON database with relationships between entities
- **Purpose**: Provides structured metadata that can be linked to wiki documents, enabling rich cross-references and organized information architecture
- **Trigger**: User clicks database icon in header to open Database Manager
- **Progression**: Open manager → View entities (factions/battles/characters) → Add new entities with forms → Link entities via IDs (characters to factions/battles) → Export database as JSON
- **Success criteria**: Entities are stored persistently, relationships are maintained correctly, database can be exported to JSON format, and entity metadata displays on linked documents

### Document Import from Google Drive
- **Functionality**: Allow users to paste a Google Drive text document URL to import content
- **Purpose**: Enables users to quickly populate their wiki with existing documentation without manual copy-paste
- **Trigger**: User clicks "Import Document" button or uses import dialog
- **Progression**: Click import → Enter Google Drive URL → Validate URL → Fetch content → Parse text → Display success message → Document appears in sidebar
- **Success criteria**: Document content is successfully retrieved and stored, appears in navigation, and renders properly

### Document Rendering
- **Functionality**: Display imported text documents with proper formatting, headings, paragraphs, and basic markdown support
- **Purpose**: Make documents readable and well-structured for knowledge consumption
- **Trigger**: User clicks on a document in the navigation sidebar
- **Progression**: Select document → Content loads → Rendered with typography hierarchy → Scrollable content area
- **Success criteria**: Documents render with clear visual hierarchy, proper spacing, and readable typography

### Navigation Sidebar
- **Functionality**: Persistent sidebar showing all imported documents as a list with titles
- **Purpose**: Provides quick access to all wiki pages and spatial orientation
- **Trigger**: Always visible on desktop, toggle button on mobile
- **Progression**: View sidebar → See document list → Click document → Content loads in main area
- **Success criteria**: All documents are listed, clicking switches active document, current document is highlighted

### Search Functionality
- **Functionality**: Search across all document titles and content to find relevant pages
- **Purpose**: Quick discovery of information without browsing through all documents
- **Trigger**: User types in search input field
- **Progression**: Focus search → Type query → Results filter in real-time → Click result → Document loads
- **Success criteria**: Search returns relevant documents, highlights matches, responds instantly

### Document Management
- **Functionality**: Edit document titles, delete documents, reorder documents in sidebar
- **Purpose**: Allows users to organize and maintain their wiki structure
- **Trigger**: Hover/click on document in sidebar reveals edit/delete actions
- **Progression**: Hover document → Actions appear → Click edit/delete → Confirm action → Sidebar updates
- **Success criteria**: Documents can be renamed, deleted, and the changes persist

## Edge Case Handling
- **No Entities State**: Display empty state messages for each entity type (factions, battles, characters) with prompts to add first entry
- **Orphaned Characters**: When deleting a faction, clear the factionId for affected characters rather than deleting them
- **Battle Cleanup**: When deleting a battle, remove battle ID from all characters' battleIds arrays
- **Character Without Faction**: Require faction selection when creating character, validate faction exists
- **Export Empty Database**: Allow exporting empty database structure for reference/templates
- **No Documents State**: Display welcoming empty state with clear call-to-action to import first document
- **Invalid Google Drive URLs**: Show friendly error message with format example when URL validation fails
- **Network Failures**: Display toast notification explaining the issue and suggest retry action
- **Duplicate Documents**: Detect and warn user before importing document with same title/URL
- **Long Document Titles**: Truncate with ellipsis in sidebar while showing full title on hover tooltip
- **Search No Results**: Show helpful "no matches" message suggesting trying different keywords
- **Mobile Navigation**: Hamburger menu to toggle sidebar, ensuring content is accessible on small screens

## Design Direction
The design should evoke the feeling of an elegant digital library - scholarly yet welcoming, with emphasis on typography and generous whitespace. Think of a modern take on classic academic journals combined with contemporary documentation platforms like Notion or GitBook. The interface should fade into the background, letting the content take center stage.

## Color Selection
A sophisticated, muted palette emphasizing readability with warm accents for interaction points.

- **Primary Color**: Deep indigo `oklch(0.35 0.08 270)` - Communicates trust, knowledge, and sophistication for primary actions and navigation highlights
- **Secondary Colors**: 
  - Warm cream background `oklch(0.98 0.01 85)` - Soft, paper-like quality that's easier on eyes than pure white
  - Cool gray for text `oklch(0.25 0.01 270)` - High contrast without harshness
  - Light lavender `oklch(0.95 0.02 285)` - Subtle backgrounds for cards and hover states
- **Accent Color**: Warm amber `oklch(0.65 0.15 65)` - Draws attention to CTAs and interactive elements with approachable warmth
- **Foreground/Background Pairings**: 
  - Primary (Deep Indigo #463B7C): White text (#FEFDFB) - Ratio 7.2:1 ✓
  - Background (Warm Cream #FAF9F5): Cool Gray (#3A3A42) - Ratio 13.5:1 ✓
  - Accent (Warm Amber #C4952C): Deep Gray (#1F1F24) - Ratio 6.8:1 ✓
  - Light Lavender Hover (#F3F1F9): Cool Gray (#3A3A42) - Ratio 12.1:1 ✓

## Font Selection
Typography should convey scholarly refinement with excellent readability for long-form content - using a classical serif for headings paired with a modern sans-serif for body text.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Crimson Pro SemiBold/36px/tight letter-spacing/-0.02em
  - H2 (Major Sections): Crimson Pro SemiBold/28px/normal letter-spacing
  - H3 (Subsections): Crimson Pro Medium/22px/normal letter-spacing
  - Body Text: Inter Regular/16px/line-height 1.7/letter-spacing normal
  - Sidebar Items: Inter Medium/14px/line-height 1.5
  - Small Text/Metadata: Inter Regular/13px/text-muted-foreground

## Animations
Animations should be subtle and purposeful, reinforcing hierarchy and spatial relationships. Use gentle fades when switching documents (200ms), smooth sliding for sidebar on mobile (300ms), and micro-interactions on hover states (100-150ms). Page transitions should feel like turning pages in a book - graceful rather than abrupt. Search results should fade in as users type, and interactive elements like buttons should have satisfying pressed states.

## Component Selection
- **Components**: 
  - `Dialog` for document import modal with URL input
  - `Card` for empty states and document preview cards if needed
  - `Input` for search bar and URL input with clean styling
  - `Button` for primary import action and secondary actions (edit, delete) with variants
  - `ScrollArea` for document content to handle long pages smoothly
  - `Separator` between sidebar sections
  - `Sheet` for mobile sidebar drawer
  - `AlertDialog` for delete confirmations to prevent accidental data loss
  - `Badge` for document count or status indicators
  
- **Customizations**: 
  - Custom document content renderer component that parses text and applies typography styles
  - Custom sidebar navigation component with hover states and active indicators
  - Search result highlighting component that emphasizes matching text
  
- **States**: 
  - Buttons: Default with subtle shadow, hover with lift effect and accent color, active with pressed appearance, disabled with reduced opacity
  - Sidebar items: Default neutral, hover with lavender background, active with primary color left border and background tint
  - Search input: Default with subtle border, focus with ring and slight scale, populated with clear button
  
- **Icon Selection**: 
  - `FileText` for documents in sidebar
  - `Plus` or `Upload` for import action
  - `MagnifyingGlass` for search
  - `Pencil` for edit actions
  - `Trash` for delete
  - `List` for mobile menu toggle
  - `X` for closing modals/sheets
  - `Database` for entity database manager
  - `Download` for export database action
  
- **Spacing**: 
  - Page padding: `p-8` (desktop), `p-4` (mobile)
  - Sidebar padding: `p-4` with `gap-2` between items
  - Document content: `max-w-3xl mx-auto` for optimal reading width with `space-y-4` for paragraphs
  - Section spacing: `mb-8` between major sections
  
- **Mobile**: 
  - Sidebar becomes Sheet drawer triggered by hamburger menu button in top-left
  - Search moves to top bar with full width
  - Content padding reduces from `p-8` to `p-4`
  - Font sizes reduce slightly (H1: 28px, Body: 15px)
  - Touch targets minimum 44x44px for all interactive elements
