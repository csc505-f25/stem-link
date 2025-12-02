# Welcome to STEM-Link!

## How to run the code locally:

Please use the `current_system_branch`, as it contains all of the updated code. The `main` branch contains the older version that was originally forked.

Clone the repo from this branch and follow these steps:

1. Ensure you have the following installed:
   - `npm` and `Node.js`
   - `Supabase`
   - `Next.js` 
   - `Gemini` API access

2. Install project dependencies: `npm install`

3. Create a `.env.local` (or `.env.development`) file in the project root and add the necessary environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

4. Run the development server: `npm run dev`

5. Open your browser at: `http://localhost:3000`

## How to run the code in production:

Please run all of the steps for running locally before deciding to try it in production.

1. Either keep `.env.local` or change it to `.env.production` if `.env.development` was used.

2. Try to run the production build: `npm run build` + `npm start`

3. Open your browser at: `http://localhost:3000`

If trying to deploy to Vercel, please follow deployment instructions on Vercel's documentation.

## Software License:

MIT-License from previously forked system.

## Link to Access Working Version:

Not fully live yet, will be deploying to Vercel soon.
