# Deployment Guide

## Quick Start

1. **Get a Maptiler API Key** (Free tier: 100k requests/month)
   - Visit https://cloud.maptiler.com/
   - Sign up for a free account
   - Create an API key
   - Copy the key

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_MAPTILER_API_KEY=your_actual_key_here
   NEXT_PUBLIC_APP_NAME=Healthcare Deployments Registry
   NEXT_PUBLIC_APP_DESCRIPTION=Global registry of healthcare deployments
   NEXT_PUBLIC_ORGANIZATION_NAME=Open Healthcare Network
   NEXT_PUBLIC_ORGANIZATION_URL=https://ohc.network
   ```

3. **Build and Deploy**
   ```bash
   pnpm install
   pnpm build
   ```

## Deployment Options

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add all `NEXT_PUBLIC_*` variables

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=out
```

Configure in `netlify.toml`:
```toml
[build]
  command = "pnpm build"
  publish = "out"
```

Add environment variables in Netlify dashboard.

### GitHub Pages

1. Add GitHub Actions workflow (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
        env:
          NEXT_PUBLIC_MAPTILER_API_KEY: ${{ secrets.MAPTILER_API_KEY }}
          NEXT_PUBLIC_APP_NAME: ${{ vars.APP_NAME }}
          NEXT_PUBLIC_APP_DESCRIPTION: ${{ vars.APP_DESCRIPTION }}
          NEXT_PUBLIC_ORGANIZATION_NAME: ${{ vars.ORGANIZATION_NAME }}
          NEXT_PUBLIC_ORGANIZATION_URL: ${{ vars.ORGANIZATION_URL }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

2. Add secrets and variables in GitHub:
   - Settings → Secrets and variables → Actions
   - Add `MAPTILER_API_KEY` as secret
   - Add other variables

### Self-hosted (Nginx/Apache)

Build the static files:
```bash
pnpm build
```

The `out/` directory contains all static files. Serve with any web server:

**Nginx example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/deployments_registry/out;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## White-labeling

To customize the application for different organizations, update environment variables:

```env
# Example: Care Deployments
NEXT_PUBLIC_APP_NAME=Care Deployments Registry
NEXT_PUBLIC_APP_DESCRIPTION=Global registry of Care deployments
NEXT_PUBLIC_ORGANIZATION_NAME=Open Healthcare Network
NEXT_PUBLIC_ORGANIZATION_URL=https://ohc.network

# Example: Generic Deployments
NEXT_PUBLIC_APP_NAME=Deployments Map
NEXT_PUBLIC_APP_DESCRIPTION=Interactive deployment visualization
NEXT_PUBLIC_ORGANIZATION_NAME=Your Organization
NEXT_PUBLIC_ORGANIZATION_URL=https://yoursite.com
```

## Updating Deployment Data

Edit `public/deployments.json` to add/modify deployments:

```json
{
  "id": "unique-id",
  "name": "Facility Name",
  "description": "Detailed description of the deployment",
  "program": "10bedicu",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": {
      "city": "Bangalore",
      "state": "Karnataka",
      "country": "India"
    }
  },
  "dateDeployed": "2024-11-20",
  "website": "https://example.com",
  "status": "active"
}
```

After updating, rebuild:
```bash
pnpm build
```

## Troubleshooting

### Map doesn't load
- Check that `NEXT_PUBLIC_MAPTILER_API_KEY` is set correctly
- Verify the API key is valid at https://cloud.maptiler.com/
- Check browser console for errors

### Build fails
- Ensure all dependencies are installed: `pnpm install`
- Check for TypeScript errors: `pnpm run type-check`
- Verify JSON syntax in `deployments.json`

### Markers don't appear
- Verify latitude/longitude coordinates are correct
- Check that `program` field matches one of: `10bedicu`, `keralacare`, `palliative-ngo`, `hmis`
- Ensure deployments.json is in `public/` directory

## Performance Optimization

For large datasets (100+ deployments):
- Markers are automatically clustered using supercluster
- Map lazy-loads tiles as you navigate
- Static export means instant page loads

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Maptiler API key is exposed in client-side code (by design for static sites)
- Use Maptiler's free tier restrictions to prevent abuse
- Consider using environment-specific API keys for dev/production
