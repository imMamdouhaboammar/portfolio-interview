# SEO and GEO

The page has two readers besides the human visitor: a search engine building a result snippet, and an answer engine (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) deciding whether to quote the person when someone asks "who is a good RTL product designer in Cairo". Both reward the same things: one clearly named entity, facts stated plainly in the HTML, and the same identity confirmed across other sites.

## What build.mjs emits

**In every page head**
- `<title>` as "Name | Job title" (keep it under 60 characters), a meta description of 120 to 160 characters, and meta keywords built from the name, title, specialty, knowsAbout and city
- `robots` with `max-image-preview:large` and `max-snippet:-1`, so engines may show the photo and quote freely
- `canonical`, reciprocal `hreflang` for every locale plus `x-default`, derived from `site.url`
- Open Graph `profile` tags and a Twitter card (large when a 1200x630 image exists), with `twitter:creator` from the X handle
- Icon, manifest, `rel="help"` pointing to `llms.txt`, and a sitemap link

**JSON-LD blocks**
- `Person`: name, alternateName (every locale's spelling plus the handles), url, image, jobTitle, description, address, knowsLanguage, knowsAbout, worksFor, alumniOf, `hasOccupation` with skills, `sameAs` holding every social URL, and `seeks` when the person is open to work
- `ProfilePage`: mainEntity pointing at the Person, dateModified, inLanguage, isPartOf WebSite
- `ItemList` of the work, typed per field (SoftwareSourceCode, CreativeWork, Article, ScholarlyArticle, Photograph, Course)
- `FAQPage`: from `faq`, or generated from the facts ("What does X do?", "Is X available for work?", "Where is X based?", "How can I contact X?")
- Testimonials are rendered without `Review` markup. Google ignores self-serving reviews on a person's own page, and marking them up risks a manual action.

**Discovery files**
- `robots.txt` admits GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, meta-externalagent and Bingbot, and points to the sitemap
- `sitemap.xml` with `xhtml:link` alternates per locale
- `llms.txt`: a plain-text summary for answer engines covering facts, services, work, experience, FAQ and verified profiles
- `site.webmanifest`, `404.html` (noindex), and `.nojekyll` for GitHub Pages

**In the body**
- All content is in the served HTML, and the page renders fully with JavaScript off (checked)
- One h1, ordered headings, a skip link, alt text on every image, width and height on images, and a lazy-loaded work gallery
- A visible **"At a glance"** facts card (role, focus, base, languages, audience, availability). Answer engines lift short labelled facts like these almost verbatim.
- An FAQ in native `<details>` elements, so the answers are in the DOM

## Writing for answer engines

- **Entity consistency.** Use the exact same name spelling and job title on the site, LinkedIn, GitHub and every other profile. Put the other spellings in `alternateNames` (Arabic and Latin, nicknames, handles).
- **First sentence of the summary answers "who is this".** Role, specialty, place, audience. Save the story for the about section.
- **Specific nouns.** "Meta and Google Ads for clinics in Riyadh" gets matched to a query. "Helping brands grow" gets matched to nothing.
- **Numbers with sources.** Answer engines prefer claims they can attribute. Unsourced numbers are left out.
- **FAQ in the reader's words.** Write each question the way a client would type it, then answer in the first sentence.

## After launch: tell the person

1. Add the site URL to every social profile's website field. This closes the `sameAs` loop from the other side, and it matters more than any tag on the page.
2. Verify the site in Google Search Console and Bing Webmaster Tools, then submit `sitemap.xml`. Bing's index feeds several AI assistants.
3. Run the page through the Rich Results Test (https://search.google.com/test/rich-results) and the Schema Markup Validator (https://validator.schema.org).
4. Update `site.updated` and rebuild whenever something real changes. Fresh `dateModified` helps both search engines and answer engines.
5. Optional, for a stronger entity: a Wikidata item (only when the person meets its notability rules), and an ORCID or Google Scholar profile for academics.
