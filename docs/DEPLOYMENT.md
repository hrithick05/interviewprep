# Deployment

PrepForge uses hosted Supabase, Vercel for the client, and Render for the API. Docker is not required.

## 1. Supabase

1. Create a Supabase project.
2. In VS Code PowerShell, run `npx supabase login`, then link the project with `npx supabase link --project-ref YOUR_PROJECT_REF`.
3. Push the migrations: `npm run db:push`.
4. Set the hosted project URL and publishable key in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Set the project URL and secret key only in Render: `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
6. In Authentication settings, add `http://localhost:5173`, the Vercel production URL, and each preview domain to allowed redirect URLs.
7. Create `resume-exports` and `avatars` storage buckets. The migration policies restrict both buckets by authenticated user folder.
8. Create the first admin directly in SQL, using the authenticated user's UUID:

   ```sql
   update public.user_profiles
   set role = 'ADMIN'
   where id = '00000000-0000-0000-0000-000000000000';
   ```

## 2. Render API

1. In Render, choose **New > Blueprint** and select this repository.
2. Confirm that `render.yaml` creates the Node service `prepforge-api` with the root build command and health check `/api/v1/health`.
3. Supply `CLIENT_ORIGIN`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` in Render environment settings.
4. Deploy and verify `https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health`.
5. Keep provider keys out of the client. Optional AI and Judge0 credentials belong in Render environment variables only.

## 3. Static client

### Netlify

The root [`netlify.toml`](../netlify.toml) configures the monorepo build, publishes `client/dist`, and serves the React app for client-side routes.

1. In Netlify, choose **Add new site > Import an existing project** and select this repository and deployment branch.
2. Leave the base directory blank so Netlify can install the root npm workspaces.
3. Add these environment variables in the Netlify site settings:
   - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`
   - `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Copy the resulting Netlify site URL and set it as Render's `CLIENT_ORIGIN`, then redeploy the API if needed.
5. Add the Netlify site URL to the allowed redirect URLs in Supabase Auth settings.

Never add `SUPABASE_SECRET_KEY` to Netlify; it belongs only in the backend's Render environment.

### Vercel

1. Import the repository in Vercel and set the root directory to `client`.
2. Build command: `npm run build`; output directory: `dist`.
3. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`.
4. Deploy and add the final production URL to Supabase Auth redirects and Render `CLIENT_ORIGIN`.

## 4. Post-deploy

```powershell
$env:PRODUCTION_API_URL="https://YOUR-RENDER-SERVICE.onrender.com"
$env:PRODUCTION_CLIENT_URL="https://YOUR-VERCEL-SITE.vercel.app"
npm run smoke:prod
```

For the automated workflow, GitHub Actions needs `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`, `PRODUCTION_CLIENT_URL`, and `PRODUCTION_API_URL`. Never add secret values to repository files.
