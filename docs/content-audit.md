# Content Audit — Cube Chronicles Website

_Last updated: 2026-07-14. Generated during the mandatory discovery phase before any application code was written._

## 1. Source of truth

All content on this site is derived from the author's project workspace on the device **"tindernational"** at:

```
C:\Projects\Books\Cube Chronicles\
```

The workspace was recursively inventoried. It contains 15 book folders, a `ZIPS/` folder of KDP packages, an `Images/` folder, a master cover-and-image prompt document, a KDP page-count report, and the build brief (`CLAUDE_WEBSITE_BUILD_PROMPT.md`).

For each book, the **ebook EPUB** was staged into the build environment and its text extracted to plain text (front matter, table of contents, chapter sampling, and back matter). Per-book metadata and editorial FAQs were then extracted **strictly from manuscript evidence**. The full manuscripts are **not** reproduced or published anywhere on the site — only spoiler-free metadata, teasers, and editorial FAQs.

## 2. The 15 books (verified)

Titles below match the author's required series order **and** the title pages inside the manuscripts. Author of all 15: **Jeremy Tinder**.

| # | Title | Setting (front-cover subtitle) | Era | Words | Pages |
|---|-------|--------------------------------|-----|------:|------:|
| 1 | The Shed, The Cube, and The Sands of Time | Ancient Egypt (Nile Valley, Great Pyramid) | Old Kingdom, c. 2560 BCE | 127,754 | 591 |
| 2 | The Compass, The Coast, and The Edge of the World | Ancient Greece (Athens, the Parthenon) | Golden Age, 5th c. BCE | 107,912 | 417 |
| 3 | The River, The Seal, and The Language of Silence | Indus Valley (Mohenjo-daro) | Bronze Age, c. 2600–1900 BCE | 88,599 | 358 |
| 4 | The Knot, The Flame, and The Bones That Speak | Ancient China (Yellow River highlands) | Early Bronze Age, c. 1900 BCE | 79,738 | 314 |
| 5 | The Shore, The Flame, and The Shape of Water | Ancient Japan (Jōmon coast) | Jōmon period, c. 2500 BCE | 55,827 | 221 |
| 6 | The River, The Wheel, and The City of the Moon | Ancient Sumer (Ur, Mesopotamia) | Ancient Sumer, era of Abraham | 52,483 | 198 |
| 7 | The Rope, The Ridge, and The Roof of the World | The Andes (high terraced village) | Pre-Columbian Andes (Inca-era) | 49,771 | 175 |
| 8 | The Seed, The Soil, and The Cities Beneath the Green | The Amazon (food-forest civilization) | Pre-Columbian Amazonia | 48,997 | 174 |
| 9 | The Rain, The Cedar, and The Rivers of Silver | Pacific Northwest salmon coast | Ancient, pre-contact | 49,139 | 177 |
| 10 | The Fire, The Threshold, and The Stranger at the Door | Ancient Anatolian highlands | Bronze Age / Hittite-era | 51,638 | 174 |
| 11 | The Break, The Gold, and The Palace That Rose Again | Minoan Crete | Bronze Age Aegean | 48,909 | 172 |
| 12 | The Song, The Stars, and The Country That Remembers | Aboriginal Australia (songlines) | Ancient oral tradition | 49,012 | 176 |
| 13 | The Canoe, The Compass, and The Shore Beyond the Sky | Ancient Pacific (Polynesian wayfinding) | Ancient voyaging era | 49,085 | 174 |
| 14 | The Crossroads, The Weave, and The Road of All Roads | The Silk Road (caravanserai city) | Ancient Silk Road | 48,660 | 170 |
| 15 | The Center, The Maker, and The Road That Was Always Home | The center of the journey (finale) | Series culmination | 48,683 | 164 |

**Series total: 3,861 paperback pages** (per the author's KDP page-count report). Word counts were computed from the extracted EPUB text.

## 3. Recurring facts extracted from the manuscripts

- **The Carver family** of Oakdale, in the rural Carolinas; contemporary frame begins in **1986**.
  - **Daniel Carver** — father, a builder/carpenter; gives a yearly "wisdom."
  - **Elizabeth Carver** — mother, Filipina-American (from Pampanga); keeper of faith and hospitality.
  - **Simeon** — eldest, a builder; apprentices in a craft each crossing.
  - **Beckah** — middle child, the family's record-keeper and decoder of the cube's signs.
  - **Ellie** — youngest, the family's singer and listener.
- A **nine-sided cube** found beneath the shed floor warms and forms a new configuration (~yearly) and carries the children into a real ancient civilization.
- The family is **Christian**; faith is woven throughout. A guiding presence called **"the Maker"** is referenced with reverence but **never depicted as a visible character** — this restraint is honored across the whole site.

## 4. Cover assets

Each book folder contains a **front-only ebook cover** (preferred for book cards) plus paperback wrap assets (not used as thumbnails). Front-only covers were identified by the pattern `*eBook_KDP_1600x2560.jpg`:

- Books 1–3: subfolder `Book_0N Images`, file `Book_0N_..._eBook_KDP_1600x2560.jpg`
- Books 4–15: subfolder `Book N Images`, file `Book_N_..._eBook_KDP_1600x2560.jpg` (note: single-digit `Book_4`…`Book_9` prefix for those files)

Paperback full-wrap JPGs (`*_Paperback_Full_Wrap_300DPI.jpg`) and print-ready wrap PDFs exist for every book but are **deliberately not used** as card thumbnails, per the build brief. Original cover files are preserved untouched; the build pipeline generates optimized WebP/AVIF/JPEG derivatives as versioned static assets.

The exact source path for each book's front cover is stored per book in `src/content/books.json` under `coverSource`.

## 5. Machine-readable content produced

- `src/content/books.json` — the 15 verified books with full metadata, cross-links (prev/next), cover mapping, and **245 manuscript-grounded editorial FAQs** (15–18 per book, each with a stable ID and anchor; spoiler answers flagged `spoiler: true` and excluded from FAQ structured data).
- `src/content/series.json` — series-level facts, family, and ordered settings.
- `src/content/series-faqs.json` — **24 series-wide editorial FAQs**.

## 6. Ambiguities & documented decisions

- **Book 1 subtitle:** the manuscript title page did not carry a one-line "A Time-Travel Adventure in…" descriptor like later books. Decision: a consistent descriptor, "A Time-Travel Adventure in Ancient Egypt," was added for uniformity across book cards and metadata. This is an editorial label, not a plot claim.
- **Era precision:** several ancient settings (e.g., the Andean and Amazonian civilizations) are evoked rather than pinned to a single dated period in the text. Eras are described approximately and labelled as such; no invented dates are presented as fact.
- **Retailer links / ISBNs / publication dates:** not present as structured data in the workspace. Decision: purchase buttons render from editable per-book data with clearly-marked placeholder URLs; ISBN, price, and publication date are **omitted** from `Book` structured data until confirmed, rather than invented.
- **"Book 14 parts":** only "Part One: The Crossroads" was confidently extracted; remaining part titles were left out rather than guessed.
- No fake reviews, ratings, awards, sales figures, or community members are seeded anywhere.

## 7. Constraints honored

Full manuscripts are never exposed. No plot facts were invented that contradict the manuscripts. The Maker is never depicted. Title spelling matches the approved covers and manuscripts. No secrets or personal user data are committed to the repository.
