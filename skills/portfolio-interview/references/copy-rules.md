# Copy rules

A portfolio speaks in the first person for a real human. When it reads like a template, visitors trust the whole page less, including the work that is genuinely good. `check.mjs` enforces the mechanical rules below and fails the build on any of them. The rest is judgment.

## Hard rules (checked)

- **No denial-then-reveal contrast.** The sentence frames something by first saying what it is not, then revealing what it is. Banned in both languages:
  - English: "not just X", "not only X", "this is not X, this is Y", "it isn't about X, it's Y", "more than just"
  - Arabic: "ده مش X، ده Y"، "مش مجرد"، "ليس فقط"، "ليس X بل Y"، "لا نتحدث عن"
  Say what the thing is, who it serves, and what it changes.
  - Bad: "Not just a designer. A problem solver."
  - Good: "I design sign-up and payment flows for Arabic-first fintech apps."
  - Bad: "مش مجرد محامي، شريك في نجاحك"
  - Good: "بصيغ عقود التوريد واتفاقيات الشركاء للشركات الناشئة في الرياض."
- **No em dash (—).** Use a comma, colon or full stop.
- **Banned words:** unleash, unlock, harness, leverage, optimize-as-buzzword, revolutionize, game-changing, cutting-edge, state-of-the-art, next-generation, elevate, innovative, groundbreaking, seamless, effortless, "the power of", empower, disrupt, synergy, paradigm shift, best-in-class, world-class, industry-leading, unparalleled, unprecedented, "passionate about", delve, tapestry.
- **Every number has a source.** Stats need `source`. Outcomes in work cards name where the number came from ("per client analytics", "App Store, Aug 2026").
- **Testimonials are real and named.** No composites, no paraphrases presented as quotes.

## Judgment rules

- **Headline:** 6 to 12 words across lead, highlight and tail. The highlight is the phrase a reader would repeat to a colleague. Draft three versions for the R8 review.
- **Summary:** 2 or 3 sentences. The first states role, specialty, place and audience. The second gives how they work, or one concrete proof.
- **Service cards:** a title of 2 to 4 words, a body of one sentence that names a deliverable.
- **Work cards:** the problem in one sentence and what they did in one sentence, with the outcome on its own line.
- **Verbs over adjectives.** "Rebuilt the checkout" beats "delivered an exceptional checkout experience".
- **Match the reader's language.** Keep English terms the audience actually uses inside Arabic copy (Design System, Fintech, PRD), and don't force a translation nobody says out loud.
- **Arabic register follows `site.dialect`.** Egyptian for a casual Egyptian audience; formal Arabic for the Gulf and regulated professions. Don't mix registers inside one page.
- **Arabic grammatical gender** follows the person. Ask when the name doesn't settle it. The builder's own generated strings avoid gendered verbs.
- **No filler openers** ("Welcome to my portfolio", "Hi, I'm..."). The h1 carries the value.
- **No stacked exclamation marks, and no emoji in headings.**

## Final pass

Before building, read every string once for these three things:

1. Could any sentence be reduced to "not X, but Y"? Rewrite it as a direct statement.
2. Is there a claim the person didn't give you? Remove it or ask.
3. Would the person say this sentence out loud to a client? If not, simplify it.
