# Interview rounds

Eight rounds, one popup call each. Write the questions in the language the person is using in chat. Payloads below are in English with Arabic equivalents where the wording matters. Options marked *(suggest)* are filled from context: `git config user.name`, an attached CV, a GitHub or LinkedIn profile they shared, or earlier answers.

Rules that apply to every round:

- Each question needs 2 to 4 options, and every header must be 12 characters or less. "Other" is added automatically.
- Put the option you would recommend first and add "(Recommended)" to its label.
- Never offer an option that only says "type it yourself". Always offer at least two real suggestions and let "Other" carry custom text.
- After each answer, write one line in chat saying what you understood, then send the next round.
- Skip any question that context already answers. Say so in that one line ("Took your name and title from the CV.").

---

## R1 · Setup

```json
{
  "questions": [
    {
      "header": "Language",
      "question": "Which language should the site be in?",
      "multiSelect": false,
      "options": [
        { "label": "English + Arabic", "description": "Two pages with an RTL Arabic version, linked through hreflang. The best reach across MENA." },
        { "label": "English only", "description": "One LTR page." },
        { "label": "Arabic only", "description": "One RTL page." }
      ]
    },
    {
      "header": "Field",
      "question": "What field do you work in?",
      "multiSelect": false,
      "options": [
        { "label": "Tech / product", "description": "Software, data, AI, product management" },
        { "label": "Design / creative", "description": "UI/UX, brand, illustration, photography, video, content creation" },
        { "label": "Marketing / business", "description": "Performance, brand, growth, sales, consulting" },
        { "label": "Specialist profession", "description": "Law, medicine, finance, engineering, academia, education" }
      ]
    },
    {
      "header": "Goal",
      "question": "What should the site get you first?",
      "multiSelect": false,
      "options": [
        { "label": "Freelance clients", "description": "Services up front, proof of results, a short route to contact" },
        { "label": "A job", "description": "Experience, skills and projects arranged for a recruiter" },
        { "label": "Personal brand", "description": "Content, voice and followers, with links to your channels" },
        { "label": "Speaking / academic", "description": "Research, talks, publications" }
      ]
    },
    {
      "header": "Look",
      "question": "What should the site feel like?",
      "multiSelect": false,
      "options": [
        { "label": "Match my field (Recommended)", "description": "I choose from your field: bold for creative and tech, calm for law, medicine and finance" },
        { "label": "Bold and playful", "description": "Thick borders, hard shadows, stickers and a moving ticker, like the original repo" },
        { "label": "Calm and formal", "description": "Thin lines, soft shadows, no decorative motion" }
      ]
    }
  ]
}
```

When Arabic is included, add a dialect question to the same call if a slot is free. Otherwise send it on its own:

```json
{ "header": "Arabic", "question": "Which kind of Arabic should the site use?", "multiSelect": false, "options": [
  { "label": "Egyptian", "description": "Close and conversational; suits an Egyptian audience and creative fields" },
  { "label": "Formal Arabic", "description": "Suits the Gulf, law, medicine, finance and government" },
  { "label": "Light Gulf", "description": "Formal structure with Gulf vocabulary" }
] }
```

Store it as `site.dialect`: `"egyptian"`, `"msa"` or `"gulf"`. The builder's fixed interface strings (nav, contact, FAQ) switch to formal Arabic for `msa` and `gulf`. You still write the rest of the copy in that register yourself.

## R2 · Field depth

Build the options from the R1 field using `field-playbook.md`. Example for "Design / creative":

```json
{
  "questions": [
    { "header": "Specialty", "question": "What is your exact specialty?", "multiSelect": false, "options": [
      { "label": "Product / UI-UX", "description": "Apps and websites" },
      { "label": "Brand identity", "description": "Logos, visual systems, packaging" },
      { "label": "Photo / video", "description": "Shoots, editing, motion" },
      { "label": "Content creation", "description": "Social channels and series" }
    ] },
    { "header": "Experience", "question": "How many years of experience do you have?", "multiSelect": false, "options": [
      { "label": "0-2 years", "description": "Early career; the page leans on projects and learning" },
      { "label": "3-6 years", "description": "Mid-level" },
      { "label": "7+ years", "description": "Senior or lead" },
      { "label": "Founder / studio owner", "description": "You run your own business" }
    ] },
    { "header": "Clients", "question": "Who hires you, or who do you want to reach?", "multiSelect": true, "options": [
      { "label": "Startups", "description": "" },
      { "label": "Agencies", "description": "" },
      { "label": "Large companies", "description": "" },
      { "label": "Individuals / small shops", "description": "" }
    ] },
    { "header": "Markets", "question": "Which markets do you serve?", "multiSelect": true, "options": [
      { "label": "Egypt", "description": "" },
      { "label": "Saudi Arabia", "description": "" },
      { "label": "UAE / Gulf", "description": "" },
      { "label": "Remote worldwide", "description": "" }
    ] }
  ]
}
```

Map the answers to `field.archetype`, `field.specialty`, `field.seniority`, `person.audience` and `person.availability.markets`.

## R3 · Identity

Draft the options yourself from what you know by now:

```json
{
  "questions": [
    { "header": "Name", "question": "Which name should appear on the site?", "multiSelect": false, "options": [
      { "label": "<name from git/CV> (suggest)", "description": "As it appears in your files" },
      { "label": "<Arabic spelling of the name> (suggest)", "description": "For the Arabic version" }
    ] },
    { "header": "Title", "question": "Which job title fits you?", "multiSelect": false, "options": [
      { "label": "<title 1> (suggest)", "description": "The one recruiters search for" },
      { "label": "<title 2> (suggest)", "description": "More specific to your niche" },
      { "label": "<title 3> (suggest)", "description": "Positioned as a service" }
    ] },
    { "header": "Location", "question": "Where are you based?", "multiSelect": false, "options": [
      { "label": "Cairo, Egypt", "description": "" },
      { "label": "Riyadh, Saudi Arabia", "description": "" },
      { "label": "Dubai, UAE", "description": "" },
      { "label": "Don't show a city", "description": "Show the country only, or leave it out" }
    ] },
    { "header": "Available", "question": "What work are you open to right now?", "multiSelect": true, "options": [
      { "label": "Freelance", "description": "" },
      { "label": "Full-time", "description": "" },
      { "label": "Part-time", "description": "" },
      { "label": "Not available now", "description": "Hides the \"open to work\" badge" }
    ] }
  ]
}
```

For a bilingual site, ask for the Arabic spelling of the name separately. Never transliterate a name yourself without confirming it.

Then ask **one question in chat** (a popup can't do this well): "In two or three sentences, what do you do, and for whom? Write it any way you like." Their raw answer becomes the base for the headline and summary.

## R4 · Proof of work

```json
{
  "questions": [
    { "header": "Work source", "question": "Where should I pull your work from?", "multiSelect": true, "options": [
      { "label": "Links I'll send", "description": "Behance, GitHub, articles, videos, case studies" },
      { "label": "My CV / LinkedIn", "description": "Attach the file or paste the text" },
      { "label": "I'll describe it in chat", "description": "3 to 6 projects, a few lines each" },
      { "label": "My GitHub account", "description": "I'll read the public repositories and suggest the strongest ones" }
    ] },
    { "header": "Numbers", "question": "Do you have numbers you can back up (results, users, years)?", "multiSelect": false, "options": [
      { "label": "Yes, with a source", "description": "Such as client analytics, a published report or the store page" },
      { "label": "Some, no source", "description": "I'll keep them in the description without a numbers bar" },
      { "label": "No", "description": "The page leans on work and descriptions" }
    ] },
    { "header": "Testimonials", "question": "Do you have real client or manager quotes you may publish?", "multiSelect": false, "options": [
      { "label": "Yes", "description": "Name, role and the exact quote" },
      { "label": "No", "description": "The section is hidden" }
    ] }
  ]
}
```

Then collect the details in chat. For each project you need: name, link, year, their role, what the problem was, what they did, the outcome (with its source), and an image if one exists. For each testimonial: the exact quote, the full name, the role, and confirmation that they have permission.

When a GitHub username is given, read the public repositories, rank them by recent activity, stars and whether they have a README, and offer the top 6 as a multiSelect popup (4 per question, split across two questions if needed).

## R5 · Avatar

```json
{
  "questions": [
    { "header": "Photo", "question": "How do you want to add your photo?", "multiSelect": false, "options": [
      { "label": "File path on this machine", "description": "Such as ~/Pictures/me.jpg" },
      { "label": "Attach it in chat", "description": "Drag the image into the conversation" },
      { "label": "Image URL", "description": "From LinkedIn, GitHub or any page" },
      { "label": "No photo", "description": "Initials in the brand colour" }
    ] }
  ]
}
```

After the answer:

- **Path:** confirm it exists, then copy it next to `profile.json` as `avatar.<ext>`.
- **Attachment:** save the image to that same location. When the host gives no file path for an attachment, ask for a path or URL.
- **URL:** download it with `curl -L -o`. When the site blocks it, ask for the file instead. GitHub avatars work reliably at `https://github.com/<user>.png?size=600`.
- **Checks:** read the dimensions (`file`, `sips -g pixelWidth` or `identify`). Warn when the image is under 400 px or far from square (the page crops it to a square from the centre), or when it is over 300 KB. Offer to compress it with whatever tool is installed (`cwebp`, `sips`, `magick`). Never resize without asking.
- **Alt text:** "Portrait of <name>" / "صورة <name>" by default, or a description the person approves.

## R6 · Social accounts

Split across two questions because each takes at most 4 options. Choose the lists from the field in `field-playbook.md`. Example for a designer:

```json
{
  "questions": [
    { "header": "Pro links", "question": "Which professional accounts do you have?", "multiSelect": true, "options": [
      { "label": "LinkedIn", "description": "" },
      { "label": "Behance", "description": "" },
      { "label": "Dribbble", "description": "" },
      { "label": "GitHub", "description": "" }
    ] },
    { "header": "Social", "question": "And the social ones?", "multiSelect": true, "options": [
      { "label": "Instagram", "description": "" },
      { "label": "X", "description": "" },
      { "label": "TikTok / YouTube", "description": "" },
      { "label": "Facebook", "description": "" }
    ] }
  ]
}
```

Then ask in chat for the handle or full link of each account they chose, in one message. Store them as `{ "platform": "...", "handle": "..." }` or `{ "platform": "...", "url": "..." }`. Supported platforms: linkedin, github, x, instagram, facebook, tiktok, youtube, behance, dribbble, medium, substack, threads, snapchat, telegram, scholar, orcid, website. Anything else takes `url` plus `label`.

All of them go into `sameAs`. That is how search engines and answer engines tie the accounts to one person, so collect every real account, including quiet ones.

## R7 · Contact and address

```json
{
  "questions": [
    { "header": "Contact", "question": "How should people contact you?", "multiSelect": true, "options": [
      { "label": "Email (shown)", "description": "Appears on the page with a copy button" },
      { "label": "WhatsApp", "description": "A direct wa.me link to your number" },
      { "label": "LinkedIn only", "description": "No email or number on the page" }
    ] },
    { "header": "Hosting", "question": "Where will the site live?", "multiSelect": false, "options": [
      { "label": "GitHub Pages (Recommended)", "description": "Free, at username.github.io" },
      { "label": "My own domain", "description": "Send me the domain" },
      { "label": "Netlify / Vercel", "description": "Drag and drop the folder" },
      { "label": "Not decided yet", "description": "I'll build it now; add the address later and rebuild" }
    ] },
    { "header": "Colour", "question": "What main colour do you want?", "multiSelect": false, "options": [
      { "label": "The field's colour (Recommended)", "description": "I pick one that fits your field" },
      { "label": "My brand colour", "description": "Send the hex code" },
      { "label": "Soft warm", "description": "peach, butter, coral" },
      { "label": "Deep formal", "description": "navy, forest, wine" }
    ] }
  ]
}
```

Collect the email address, WhatsApp number in international format, and domain or GitHub username in chat. Work out `site.url` from the hosting answer. For GitHub Pages it is `https://<user>.github.io/` for a `<user>.github.io` repository, or `https://<user>.github.io/<repo>/` for any other repository.

## R8 · Review

Show the draft in chat: headline (three parts), summary, meta description (count its characters), job title, the list of sections that will appear, the colour, and the style. Then:

```json
{
  "questions": [
    { "header": "Review", "question": "Should I build the site with this?", "multiSelect": false, "options": [
      { "label": "Build it", "description": "Generate the site and run the checks" },
      { "label": "Change the headline", "description": "Suggest 3 other wordings" },
      { "label": "Change something else", "description": "Tell me what" }
    ] }
  ]
}
```

Loop until they choose "Build it".
