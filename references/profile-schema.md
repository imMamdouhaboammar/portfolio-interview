# profile.json

One file drives the whole site. Any text field can be given in either of two forms:

- a **string**, used for every locale, or
- an **object keyed by locale**: `{ "en": "...", "ar": "..." }`.

List fields (`markets`, `stickers`, `about.body`) follow the same rule with arrays: `["a", "b"]` or `{ "en": [...], "ar": [...] }`.

File paths (avatar, work images, ogImage) are relative to `profile.json`. `http(s)` URLs are used as they are.

Fields marked **required** are enforced by `check.mjs`. Every other field is optional. When a field is empty, its section disappears from the page, the navigation and the schema.

```jsonc
{
  "version": 1,
  "locales": ["en", "ar"],            // first entry = default page at /, the rest at /<code>/

  "site": {
    "url": "https://name.github.io/",  // absolute https. Drives canonical, hreflang, sitemap, OG and JSON-LD URLs
    "updated": "2026-09-23",           // dateModified and sitemap lastmod; defaults to today
    "style": "bold",                   // "bold" | "calm"; defaults from the archetype
    "brand": "lilac",                  // palette name or hex; defaults from the archetype
    "dialect": "egyptian",             // Arabic interface strings: "egyptian" | "msa" | "gulf"
    "title": { "en": "..." },          // overrides "<name> | <jobTitle>"
    "ogImage": "og.jpg",               // 1200x630 share image; build --og renders one when this is absent
    "footerNote": { "en": "..." }
  },

  "field": {
    "archetype": "designer",           // see field-playbook.md
    "specialty": { "en": "Product design for Arabic-first apps" },
    "seniority": "senior"              // "junior" | "mid" | "senior" | "founder"
  },

  "person": {
    "name": { "en": "Sara Adel", "ar": "سارة عادل" },     // required
    "givenName": "Sara", "familyName": "Adel",              // og profile tags
    "alternateNames": ["saraadel.design"],                  // every spelling people search for
    "jobTitle": { "en": "Senior Product Designer" },        // required
    "roleLine": { "en": "Product design · RTL · Systems" }, // small line under the name in the header
    "eyebrow": { "en": "Product designer, Cairo" },         // chip above the h1
    "headline": {                                           // the h1, in three parts
      "lead": { "en": "I design apps that read" },
      "highlight": { "en": "right to left" },
      "tail": { "en": "without feeling translated" }
    },
    "summary": { "en": "2 to 3 sentences: what, for whom, how." },  // required. Hero lede and llms.txt
    "metaDescription": { "en": "120 to 160 characters." },         // falls back to summary
    "location": { "city": { "en": "Cairo" }, "country": { "en": "Egypt" }, "countryCode": "EG" },
    "languages": ["ar", "en"],
    "audience": { "en": "Fintech startups in MENA" },       // "Works with" row in the facts card
    "availability": {
      "open": true,                                          // false hides the badge and the availability chips
      "types": ["freelance", "full-time"],                   // freelance | full-time | part-time | contract | consulting | speaking | collaborations
      "markets": { "en": ["Egypt", "UAE"], "ar": ["مصر", "الإمارات"] },
      "note": { "en": "Booking projects from November" }    // replaces the caption under the photo
    },
    "stickers": { "en": ["RTL first", "tested"] },          // up to 3 tilted chips (bold style only)
    "avatar": "avatar.jpg",
    "avatarAlt": { "en": "Sara Adel smiling in her studio" },
    "email": "sara@example.com",
    "showEmail": true,                                      // false keeps the email out of the page and schema
    "whatsapp": "+20 100 000 0000",                         // any format; digits become wa.me/<digits>
    "knowsAbout": ["Product design", "Design systems"],     // schema knowsAbout and meta keywords
    "worksFor": { "name": "Example Pay", "url": "https://..." },
    "alumniOf": [{ "name": "Cairo University", "url": "https://cu.edu.eg" }]
  },

  "socials": [
    { "platform": "linkedin", "handle": "sara-adel" },
    { "platform": "website", "url": "https://sara.design" },
    { "platform": "other", "label": "Contra", "url": "https://contra.com/sara" }
  ],

  "stats": [                                                // at most 4; hidden unless each has a source
    { "value": "12", "label": { "en": "Apps shipped" }, "source": { "en": "Career record" } }
  ],

  "skills": {
    "marquee": { "en": ["Product design", "RTL layouts", "..."] },   // ticker; needs at least 4 items
    "groups": [ { "title": { "en": "Daily tools" }, "items": ["Figma", "Maze"] } ]
  },

  "services": [                                             // 2 to 6 cards
    { "icon": "palette", "title": { "en": "..." }, "body": { "en": "..." } }
  ],

  "work": [
    {
      "name": { "en": "Wallet onboarding" },
      "url": "https://...",                                 // optional; with no url the card has no link
      "image": "img/wallet.jpg",                            // optional; 16:10 crop
      "imageAlt": { "en": "..." },
      "year": 2025,
      "role": { "en": "Lead designer" },
      "client": { "en": "Example Pay" },                    // only when the client is public
      "description": { "en": "..." },                       // required per item
      "outcome": { "en": "Completion went from 41% to 63%, per client analytics." },
      "tags": ["fintech", "RTL"],
      "schemaType": "CreativeWork"                          // overrides the archetype default
    }
  ],
  "workMore": { "url": "https://behance.net/sara", "label": { "en": "All projects on Behance" } },

  "experience": [
    { "role": { "en": "..." }, "org": "Example Pay", "orgUrl": "https://...", "start": "2023", "end": "present", "summary": { "en": "..." } }
  ],

  "process": [ { "title": { "en": "Listen" }, "body": { "en": "..." } } ],   // 2 to 4 steps

  "testimonials": [
    { "quote": { "en": "..." }, "name": "Full Name", "role": { "en": "Head of Product, X" }, "url": "https://linkedin.com/..." }
  ],

  "about": {
    "body": { "en": ["Paragraph one.", "Paragraph two."] },
    "quoteTitle": { "en": "A good week" },
    "quote": { "en": "..." }                                // dark feature card under the about section
  },

  "faq": [ { "q": { "en": "..." }, "a": { "en": "..." } } ],   // when empty, 3 to 4 are generated from the facts

  "featured": { "url": "https://...", "label": { "en": "Full case studies" }, "title": { "en": "Behance" } },  // card under the photo

  "cta": { "primary": { "en": "Book a call" }, "secondary": { "en": "See the work" }, "nav": { "en": "Hire me" } },

  "sections": {                                             // override the kicker, title or lede of any section
    "work": { "kicker": { "en": "Work" }, "title": { "en": "..." }, "lede": { "en": "..." } }
  }
}
```

## Icons

Service icons: `code`, `research`, `docs`, `tests`, `agents`, `chart`, `palette`, `pen`, `video`, `camera`, `layers`, `briefcase`, `book`, `scale`, `users`, `mic`, `heart`, `megaphone`, `target`, `spark`, `globe`, `link`, `mail`, `chat`.

## Palettes

`peach` #df9367 · `lime` #c6e86c · `sky` #8fbef5 · `lilac` #c9a8f2 · `mint` #7fd6b4 · `butter` #f6cf63 · `coral` #f28b82 · `ink` #1f2937 · `navy` #1e3a8a · `forest` #166534 · `wine` #881337, or any hex code. The builder picks black or white text for the brand colour, whichever gives the higher contrast.

## Section order on the page

hero → stats → skills ticker → services → work → experience → skills → process → testimonials → about + facts → FAQ → contact → footer. The navigation lists only the sections that exist.
