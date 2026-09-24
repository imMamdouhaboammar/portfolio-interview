# Field playbook

The field decides what a visitor needs to see before they reach for the contact button. A recruiter hiring a developer looks for code they can open. A client hiring a lawyer looks for practice areas and credentials. The same template serves both by changing four things:

1. the archetype (section labels, schema type of work items, default style and colour)
2. which sections are filled and in what depth
3. which social platforms to ask about
4. the tone of the copy

| R1/R2 answer | archetype | style | colour | work item schema |
|---|---|---|---|---|
| Software, data, AI, DevOps | `developer` | bold | peach | SoftwareSourceCode |
| Product management, product ownership | `product` | bold | mint | CreativeWork |
| UI/UX, brand, illustration, motion | `designer` | bold | lilac | CreativeWork |
| Photography | `photographer` | calm | sky | Photograph |
| Video, content creation, influencer | `creator` | bold | coral | CreativeWork |
| Performance, brand, growth, sales | `marketer` | bold | butter | CreativeWork |
| Copywriting, journalism, authors | `writer` | calm | peach | Article |
| Management or strategy consulting | `consultant` | calm | mint | CreativeWork |
| Research, university faculty | `academic` | calm | sky | ScholarlyArticle |
| Teaching, training, coaching | `educator` | bold | lime | Course |
| Law, medicine, finance, accounting, engineering | `professional` | calm | navy | CreativeWork |
| Anything else | `other` | bold | peach | CreativeWork |

When the person spans two fields, choose the archetype their target reader hires for (R1 goal), then borrow vocabulary from the second. A developer who writes goes in `developer`, with a Writing entry in `workMore` or a service card.

## Per archetype

### developer
- **Proof:** repositories, live demos, packages, merged PRs to known projects. Link every card. Tags are the stack.
- **Sections:** services (what you build), work 3 to 6, experience, skills in groups (languages, frameworks, infrastructure), FAQ.
- **Socials:** GitHub first, then LinkedIn, X, and a blog (Medium, Substack or a personal site).
- **Tone:** plain and specific. Name the stack and the constraint ("Postgres, 40k writes a minute").
- **Fill from:** the GitHub username. Rank repositories by stars, recent pushes and README quality, and suggest the top 6.

### product
- **Proof:** products shipped and the decisions behind them. Outcome lines matter most.
- **Sections:** services (what I own), work, process (how decisions get made), experience, FAQ.
- **Socials:** LinkedIn, X, Substack or Medium, GitHub when present.

### designer
- **Proof:** images. Every work card should carry an `image`. Ask for 3 to 6 covers at 1600x1000 or larger.
- **Sections:** work first after services, process, testimonials when they exist, skills (tools).
- **Socials:** Behance, Dribbble, LinkedIn, Instagram.
- **Tone:** describe the problem and the decision, and leave visual adjectives out.

### photographer
- **Proof:** images, plus a `workMore` link to the full gallery. Calm style keeps the frame on the pictures.
- **Sections:** work with images (6 is a good count), services (weddings, product, editorial), process (booking to delivery), FAQ (pricing basis, travel, delivery time).
- **Socials:** Instagram first, then Behance and Facebook.

### creator
- **Proof:** channels and series, with audience numbers only when they come with a source ("YouTube Studio, Sept 2026").
- **Sections:** stats (followers, views) with a source, work (series and campaigns), services (sponsorships, UGC), testimonials from brands.
- **Socials:** every platform they post on. They all go into `sameAs`.

### marketer
- **Proof:** case studies with an outcome and its source (client analytics, platform dashboard, a published case). Drop any number the person can't point to.
- **Sections:** services, work as case studies (brief, what changed, result), stats with a source, experience, testimonials, FAQ.
- **Socials:** LinkedIn first, then X and Instagram.
- **Tone:** channel names, budgets, markets. "Meta and Google for a Riyadh clinic group" reads stronger than any adjective.

### writer
- **Proof:** published pieces with the outlet name. `client` holds the publication.
- **Sections:** work (writing), services, about with a real voice, testimonials from editors.
- **Socials:** Substack, Medium, LinkedIn, X.

### consultant
- **Proof:** engagement types and outcomes. Client names only when public.
- **Sections:** services first, process, work (engagements), testimonials, experience, FAQ (how engagements start and what they cost to scope).

### academic
- **Proof:** publications with DOI or journal links, talks, grants.
- **Sections:** work = publications (`schemaType: "ScholarlyArticle"`), experience = positions, services = research areas, `alumniOf`.
- **Socials:** Google Scholar, ORCID, ResearchGate (as `other`), LinkedIn.

### educator
- **Proof:** courses (with the platform), cohorts, student outcomes that have a source.
- **Sections:** work = courses (`Course`), services = what you teach, testimonials from students (named), FAQ (format, language, price basis).

### professional (law, medicine, finance, engineering)
- **Proof:** licences and credentials, practice areas, years in practice, memberships. No client names, no case outcomes that could identify anyone.
- **Sections:** services = practice areas, experience, about with credentials, FAQ (first consultation, fees basis, languages). Usually no work section, or a few anonymised matters.
- **Style:** calm. **Arabic:** formal (`site.dialect: "msa"`).
- **Regulation:** medical, legal and financial advertising rules vary by country (in Saudi Arabia and the UAE, health and legal promotion is regulated). Avoid promises of results and before/after claims, and ask the person to confirm the page meets their licensing body's rules.

## Seniority adjustments

- **Early career (0 to 2 years):** projects, courses and volunteering carry the page. Drop stats. Use "learning" plainly and make it concrete ("learning Rust by rebuilding my CLI tool").
- **Senior (7+ years):** lead with outcomes and scope (team size, budgets, markets). Keep experience to the last 3 or 4 roles.
- **Founder or studio owner:** lead with the business in `featured`, services first, and a CTA to book a call.
