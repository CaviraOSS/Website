# Website source code of cavira.app

## A

This website is not fully finished yet.

## Static Memory Lab

The LongMemory page has one chatbox. Every message updates five local memory
representations. There are no API routes, keys, Workers, databases, or external
inference calls. Conversations remain in page memory and clear on refresh.
The processing module is lazy-loaded; its tokenizer data is bundled locally.

```sh
npm install
npm run check:memory
npm run build
```

Deploy `build/` to Cloudflare Pages. This website builds independently of the
parent LongMemory repository. No comparison server or environment variables are
required. `npm run dev` starts the local site.
The SvelteKit build ID uses `CF_PAGES_COMMIT_SHA` (or `GITHUB_SHA`, with a
stable local fallback), keeping prerendered HTML and client hydration aligned
across the build's separate stages.

### Code And Model Boundaries

These are bounded, English rule-based architecture subsets, NOT executions or
benchmarks of the complete products. All paths get the same conversation and
shared Compromise-based input analysis, replacing unavailable model inference.

| Path | Reused portion | Modelled / excluded portion |
| --- | --- | --- |
| LongMemory | Exact portable body of the current `claim_extractor.ts`, including claims, conflict checks, rendering, and table extraction | Immutable write records and preference retirement are a local model; no full engine, recall index, governance, or database |
| Mem0 | TypeScript ports of `parse_messages` and `normalize_facts` | ADD-style memory objects and links; no LLM extraction, embeddings, or vector search |
| Zep / Graphiti | Public edge fields and distinct-endpoint constraints | Entity/relationship extraction and temporal invalidation are local rules, not Graphiti inference or graph search |
| Cognee | First-node-wins graph-local ID deduplication | Sentence chunk grouping, chunk/entity links, and chunk context; no cognify inference or graph database |
| Supermemory | Publicly documented chunk + current-profile architecture only | Entire processing path is a documentation model; proprietary engine code is not available |

LongMemory source: [CaviraOSS/LongMemory](https://github.com/CaviraOSS/LongMemory),
CaviraOSS (2026), Apache-2.0. Its portable source snapshot is
`views/utils/longmemory-claims.ts`; `check:memory` compares it to the parent
source when that checkout exists. No parent source is required for deployment.
Mem0 helper ports derive from
[memory/utils.py](https://github.com/mem0ai/mem0/blob/main/mem0/memory/utils.py),
Graphiti schema constraints from
[extract_edges.py](https://github.com/getzep/graphiti/blob/main/graphiti_core/prompts/extract_edges.py),
and Cognee deduplication from
[extract_graph_from_data.py](https://github.com/topoteretes/cognee/blob/main/cognee/tasks/graph/extract_graph_from_data.py).
These open-source projects use Apache-2.0; consult their repositories for
license notices. Supermemory's
[self-hosting documentation](https://supermemory.ai/docs/self-hosting/overview)
explicitly states its server engine is not open source.

### Shared Scoring

`evaluate` accepts records, source messages, and context, never a provider ID.
Readiness weights: normalized-value fact coverage 35%, verifiable source/value grounding
15%, latest-key freshness 20%, explicitly typed fact structure 20%, uniqueness
10%. Missing freshness checks are excluded and the remaining weights normalized.
Overall local score is 80% readiness and 20% coverage-adjusted token efficiency.
Greetings without usable facts are unscored. Equal scores stay tied and sort
alphabetically. There is no LongMemory bonus. Known limitations include
paraphrases, negation, compound facts, ambiguity, multilingual text, and inferred
temporal semantics. These numbers measure the local representations, not actual
product quality or comparative model intelligence.

Coverage compares recognized fact values rather than conversational filler, so
`user name priya` and `My name is Priya` receive equal value coverage. Explicit
`instead of` / `rather than` restrictions must survive with the same direction;
mentioning both channels or an unrelated negation does not earn full credit.
The check is deliberately bounded, not a general semantic-entailment model.
LongMemory presents original claim statements, matching the engine's evidence
renderer, rather than lossy subject/predicate/value strings. All score weights
remain provider-independent. Repetition and unresolved updates can still lower
LongMemory's score; tests do not require any particular brand to win.

Context and stored JSON are tokenized with `gpt-tokenizer/model/gpt-4o`.
Projected cost is ONLY context tokens * 1,000 recalls * $1 / 1,000,000 tokens;
it is a common hypothetical agent-input rate, not any provider's pricing or a
claim about extraction, embedding, storage, or billed usage. No model is called.
The conversation is bounded to 20 messages / 12,000 total characters.

## Search And Crawlable Documentation

The plain Search button opens a keyboard-accessible local documentation dialog.
It indexes the same static documentation data used by the page, including code
blocks and nested headings, and navigates to the original section. Search is
read-only and local; it does not send queries to an API or store search history.

`views/utils/docs-search.ts` reuses the token normalizer from LongMemory's
`src/core/recall/recall_text.ts` and ports its BM25 candidate scorer from
`src/core/recall/associative_recall.ts`. The document adapter uses local Unicode
word tokens and weights section headings in the indexed text. This is the
lexical recall component, not a hosted Hydrograph database, semantic embedding
service, or generated-answer system. `npm run check:memory` validates retrieval,
anchors, deterministic read-only searches, and normalizer source fidelity when
the parent checkout is available. Ctrl/Cmd+K opens search; arrows select, Enter
opens a section, and Escape closes the native dialog. Native dialog focus
management keeps keyboard focus inside search and returns it on dismissal.

## Site-Wide SEO And Agent References

The shared layout renders unique titles, descriptions, canonical URLs, Open
Graph/Twitter cards, and factual JSON-LD into the initial HTML. Production URLs
use `https://cavira.app`, the domain already used by the site. Change the shared
origin in `views/utils/site.ts` if the production domain changes.

Documentation is prerendered from the same bundled catalog used by local search.
Each guide has a readable URL, for example
`/projects/longmemory/docs/installation`, and a `.md` version. Sidebar links work
without JavaScript. Legacy `?pid=` links are normalized on hydration while
preserving section anchors; new links and sitemap entries use the canonical paths.

Build-time discovery routes emit ordinary static files:

- `/robots.txt`: allows crawling and links the sitemap.
- `/sitemap.xml`: canonical homepage, product, and documentation URLs.
- `/llms.txt`: concise links and accurate source/limitation notes for agents.
- `/llms-full.txt`: complete published documentation in plain text.
- `/projects/longmemory/docs.md`: Markdown guide index.
- `/projects/longmemory/docs/<guide>.md`: full guide text and code examples.

There is no runtime search or inference API. The adapter emits `404.html` to
prevent Cloudflare Pages' default homepage fallback on missing URLs. `_headers`
declares text/Markdown/XML types for static discovery files. The build output is
still `build/`; no Workers, database, credentials, or server deployment is needed.

Run `npm run check:seo` for metadata, safe JSON-LD, complete sitemap, and Markdown
consistency. `llms.txt` is an optional ecosystem convention, not a ranking signal
guaranteed by every crawler. No hidden recommendation instructions, fabricated
ratings, unverified pricing, or unsupported superiority claims are included.
Search indexing, citations, and recommendations remain third-party decisions.
After deployment, submit the canonical sitemap in search-engine webmaster tools.

## Advisories for developers

1. Follow the code format from .vscode/settings.json, failure to do so might result in a sudden appearance of a certain rod from "Redo of the healer" in your rectum.
2. Do not push unverified code generated by AI.
