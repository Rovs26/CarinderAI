/**
 * Marketplace_Matcher — fuzzy-matches OCR'd palengke list items to seeded
 * Products using Fuse.js. See:
 *   - design.md §Marketplace_Matcher Design
 *   - Requirements 8.1, 8.3
 *
 * Runs in the browser (called from `/scan`'s "Match to Marketplace" handler).
 * To stay safe inside `"use client"` boundaries, this module deliberately does
 * NOT import Prisma's generated `Product` type. Instead it defines a structural
 * `MatcherProduct` interface that mirrors only the fields the matcher and the
 * downstream cart need.
 */

import Fuse from 'fuse.js';
import type { z } from 'zod';
import type { OcrItem } from './schemas';

export interface MatcherProduct {
  id: string;
  name: string;
  unit: 'kg' | 'pc' | 'L' | 'pack';
  pricePhp: number;
  imageUrl: string;
}

export interface MatchedLine {
  product: MatcherProduct;
  quantity: number;
  confidence: number;
}

export interface UnmatchedLine {
  ocrItem: z.infer<typeof OcrItem>;
}

export function buildFuseIndex(products: MatcherProduct[]): Fuse<MatcherProduct> {
  return new Fuse(products, { keys: ['name'], threshold: 0.4, includeScore: true });
}

export function matchOcrItems(
  fuse: Fuse<MatcherProduct>,
  items: z.infer<typeof OcrItem>[],
): { matched: MatchedLine[]; unmatched: UnmatchedLine[] } {
  const matched: MatchedLine[] = [];
  const unmatched: UnmatchedLine[] = [];
  for (const item of items) {
    const query = item.translated ?? item.name;
    const hit = fuse.search(query)[0];
    if (hit) {
      matched.push({
        product: hit.item,
        quantity: Math.max(0.01, item.quantity),
        confidence: 1 - (hit.score ?? 0),
      });
    } else {
      unmatched.push({ ocrItem: item });
    }
  }
  return { matched, unmatched };
}
