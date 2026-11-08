# Build notes: QuoteDesk

The capstone: the quote calculator plus Google sign-in, quotes saved per owner in Firestore, and a Gemini-drafted customer message. Built in Google AI Studio's Build mode. This is project 5 of 5 in my [AI Studio build notes](https://github.com/YenXenshi/ai-studio-build-notes), where the full write-up lives.

This is an independent project, not made or endorsed by Google. Notes are from 2026-11-04, 2026-11-05 and 2026-11-07.

## What I'm working on here
Putting the earlier lessons together: a login, a database, a price list, and retries and a time limit on the Gemini call.

## What broke, and how it got fixed
Save Quote with an empty notes box failed with "Unsupported field value: undefined". One smallest-fix prompt (2 files, 56 seconds) made blank optional fields save as an empty string. The retest passed.

## What I tested
- 4,500 sq ft math: Mow and Edge $72.75, Bag clippings $18.75, total $91.50.
- Gemini-drafted message with the correct total.
- Sign in, save, status change, and reload persistence.
- A second account saw an empty list. That is the screen level only.
- Fresh clone: typecheck and build pass, and the page loads.

## Security notes (read from the code, NOT attack-tested)
- The Firestore rules look sound on paper: default deny, owner-only access, limited fields.
- The Gemini endpoint validates input but has no login or rate limit, so anyone with the app URL could likely use the owner's Gemini quota.

## What I learned
Reading rules is not attacking them. Fixing the database does not fix an open server endpoint.

## NOT tested
Direct database access by a second account, delete, a real phone, clipboard contents, and real Gemini and sign-in calls from the fresh clone.

## Running it
`firebase-applet-config.json` has placeholder values. Add your own Firebase project and deploy `firestore.rules`, and set `GEMINI_API_KEY`. Use `npm install --legacy-peer-deps` (tested on Node 22).
