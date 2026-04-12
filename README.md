# Rentmies Video Editor

A professional video editor built with Next.js 14 and Remotion for creating YouTube Shorts and standard YouTube videos with AI-powered auto-captioning.

## Features

- **Video Editor Dashboard** - Upload videos, manage projects
- **Template System** - Pre-built templates for Shorts (9:16) and YouTube (16:9)
- **Auto-Captioning** - OpenAI Whisper API integration for automatic subtitle generation
- **Text Overlays** - Animated titles, lower thirds, CTAs with multiple animation styles
- **Scene Composition** - Combine multiple clips, images, and text with transitions
- **Export/Render** - Render final video via Remotion
- **Marketing Automation** - Batch render API for programmatic video production

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Remotion** for programmatic video rendering
- **OpenAI Whisper API** for auto-captioning/subtitles
- **TailwindCSS** for UI styling
- **Zod** for runtime validation
- **Vercel-ready** deployment configuration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for auto-captioning feature)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-your-key-here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Remotion Preview

To preview compositions in the Remotion Studio:

```bash
npm run remotion:preview
```

### Rendering Videos

```bash
# Render standard video
npm run remotion:render

# Render YouTube Short
npm run remotion:render-short

# Render YouTube video
npm run remotion:render-youtube
```

## Project Structure

```
src/
  app/
    page.tsx              # Dashboard - project management
    editor/page.tsx       # Main video editor
    api/
      transcribe/route.ts # Whisper transcription endpoint
      render/route.ts     # Video render endpoint
  components/
    VideoPreview.tsx      # Remotion Player wrapper
    Timeline.tsx          # Scene list sidebar
    PropertiesPanel.tsx   # Element property editor
    TemplateSelector.tsx  # Template browser
    CaptionEditor.tsx     # Caption management
    ExportPanel.tsx       # Export settings
    SceneCard.tsx         # Scene thumbnail card
  remotion/
    Root.tsx              # Remotion composition registry
    compositions/         # Video compositions
    components/           # Remotion render components
  lib/
    types.ts              # TypeScript type definitions
    store.ts              # React context state management
    templates.ts          # Pre-built video templates
    whisper.ts            # OpenAI Whisper client
    utils.ts              # Helper utilities
```

## Templates

| Template | Aspect Ratio | Use Case |
|----------|-------------|----------|
| YouTube Standard | 16:9 | Regular YouTube videos |
| YouTube Shorts | 9:16 | Shorts, TikTok, Reels |
| Marketing Promo | 16:9 | Product launches, promotions |
| Product Demo | 16:9 | SaaS demos, tutorials |

## API Endpoints

### POST /api/transcribe

Upload an audio/video file for AI transcription.

```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F "file=@audio.mp3" \
  -F "fps=30"
```

### POST /api/render

Trigger a video render job.

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{"projectId": "uuid", "outputFormat": "mp4", "quality": "high"}'
```

## Deployment

The project is configured for Vercel deployment:

```bash
# Deploy to Vercel
npx vercel
```

For production video rendering, set up Remotion Lambda or a dedicated render server.

## License

Private - All rights reserved.
