# Deployments Registry

A global, open-source registry that visualizes deployments on an interactive map. Built with Next.js, MapLibre GL JS, and shadcn/ui.

## Features

- 🗺️ **Interactive Map**: Powered by MapLibre GL JS with Maptiler tiles
- 🌓 **Dark Mode**: Seamless theme switching with next-themes
- 🔍 **Search & Filter**: Find deployments by name or filter by program type
- 📍 **Smart Clustering**: Automatic marker clustering using supercluster
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎨 **White-labelable**: Configure via environment variables
- 🚀 **Static Export**: Deploy anywhere (Vercel, Netlify, GitHub Pages, etc.)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Maptiler API key (free tier: https://cloud.maptiler.com/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ohcnetwork/deployments_registry.git
cd deployments_registry
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Maptiler API key and white-label configuration:
```env
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here
NEXT_PUBLIC_APP_NAME=Your Deployments Registry
NEXT_PUBLIC_APP_DESCRIPTION=Your description
NEXT_PUBLIC_ORGANIZATION_NAME=Your Organization
NEXT_PUBLIC_ORGANIZATION_URL=https://yoursite.com
```

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the map.

### Build for Production

```bash
pnpm build
```

The static files will be generated in the `out/` directory and can be deployed to any static hosting service.

## Data Structure

Deployment data is stored in `public/deployments.json`. Each deployment has:

```typescript
{
  "id": "unique-id",
  "name": "Deployment Name",
  "description": "Description",
  "program": "10bedicu" | "kerala-care" | "palliative-ngo" | "hmis",
  "location": {
    "latitude": 0.0,
    "longitude": 0.0,
    "address": {
      "city": "City",
      "country": "Country"
    }
  },
  "dateDeployed": "2024-01-01",  // Optional
  "website": "https://...",       // Optional
  "status": "active"              // Optional
}
```

## White-labeling

The application can be white-labeled through environment variables:

- `NEXT_PUBLIC_APP_NAME`: Application title
- `NEXT_PUBLIC_APP_DESCRIPTION`: Meta description for SEO
- `NEXT_PUBLIC_ORGANIZATION_NAME`: Organization name shown in header
- `NEXT_PUBLIC_ORGANIZATION_URL`: Link to organization website

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Mapping**: MapLibre GL JS + Maptiler
- **UI**: shadcn/ui + Tailwind CSS
- **Theme**: next-themes
- **Clustering**: supercluster
- **Language**: TypeScript

## Project Structure

```
deployments_registry/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── map/               # Map-related components
│   │   ├── deployment-map.tsx
│   │   └── map-popup.tsx
│   ├── filters/           # Filter components
│   │   └── deployment-filters.tsx
│   ├── ui/                # shadcn components
│   └── theme-provider.tsx
├── lib/
│   ├── config.ts          # Environment config
│   ├── data.ts            # Data loading utilities
│   ├── map-utils.ts       # Map helper functions
│   └── utils.ts           # General utilities
├── types/
│   └── deployment.ts      # TypeScript types
├── public/
│   └── deployments.json   # Deployment data
└── next.config.ts         # Next.js configuration
```

## License

MIT License - see [LICENSE](LICENSE) file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by [Open Healthcare Network](https://ohc.network)
