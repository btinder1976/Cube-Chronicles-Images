import retailersData from '../content/retailers.json';

export interface PurchaseLink {
  key: string;
  name: string;
  url: string | null;
  placeholder: boolean;
}

interface RetailerDef { key: string; name: string; }

const defs = (retailersData.retailers as RetailerDef[]) ?? [];
const byBook = (retailersData.byBook as Record<string, Record<string, { url?: string; placeholder?: boolean }>>) ?? {};

/** Purchase links for a book slug. Missing/placeholder entries are marked. */
export function purchaseLinks(bookSlug: string): PurchaseLink[] {
  const overrides = byBook[bookSlug] ?? {};
  return defs.map((r) => {
    const o = overrides[r.key];
    if (o && o.url && o.placeholder !== true) {
      return { key: r.key, name: r.name, url: o.url, placeholder: false };
    }
    return { key: r.key, name: r.name, url: null, placeholder: true };
  });
}

/** Real (non-placeholder) offers only — used for Book structured-data offers. */
export function realOffers(bookSlug: string): PurchaseLink[] {
  return purchaseLinks(bookSlug).filter((l) => !l.placeholder && l.url);
}
