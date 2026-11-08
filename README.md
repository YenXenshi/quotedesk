<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8cc33ed4-d9b0-4e6b-bfbe-972808c32378

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Using your own Firebase project

This repo ships `firebase-applet-config.json` with placeholder values. Replace them with your own Firebase web app config (Firebase console > Project settings > Your apps), enable Google sign-in and Firestore, and deploy `firestore.rules`. The Gemini key, where used, is read from the `GEMINI_API_KEY` environment variable (see `.env.example`).
