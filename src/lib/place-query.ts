/**
 * The string a place gets handed to a map with.
 *
 * WHY THIS IS A FUNCTION AND NOT THREE COPIES OF ONE LINE
 *
 * It was three copies of one line — CardDirections, MapEmbed and MapLink each
 * built `[name, address ?? town, region].filter(Boolean).join(", ")`. Fine when
 * a record stored "3511 Barley Mill Road, Hockessin". Not fine once records
 * started carrying full postal addresses, because "…, Hockessin, DE 19707"
 * plus a region of "DE" renders:
 *
 *     Ashland Nature Center, 3511 Barley Mill Road, Hockessin, DE 19707, DE
 *
 * That shipped on 91 pages. It's in the visible "Where it is" line, not just
 * the href, so it reads as sloppiness on exactly the pages asking to be trusted
 * about details. Google tolerates it, which is why nothing ever broke loudly
 * enough to notice.
 *
 * The region is a fallback for when the address doesn't say where it is, not a
 * suffix to staple on regardless.
 */

/** True when the address already names the state, so region would repeat it. */
function namesRegion(address: string, region: string): boolean {
  const r = region.trim();
  if (!r) return true;
  /* Word-boundary match, case-insensitive: catches a trailing ", DE" and an
     embedded ", DE 19707", and does NOT fire on "Delaware Avenue" for "DE"
     (different token) or on the "de" inside a word. */
  return new RegExp(`(^|[\\s,])${r}([\\s,]|$)`, "i").test(address);
}

export function mapQuery(opts: {
  name: string;
  town?: string | null;
  address?: string | null;
  region?: string | null;
}): string {
  const { name, town = null, address = null, region = "DE" } = opts;
  /* A real street address beats name + town, which Google will happily
     resolve to the wrong Brandywine. */
  const where = address ?? town;
  const parts = [name, where];
  if (region && !(where && namesRegion(where, region))) parts.push(region);
  return parts.filter(Boolean).join(", ");
}

/**
 * "Hockessin, New Castle County" — and just "Kent County" when there's no town.
 *
 * The old version joined town and county unconditionally, and records with a
 * null town fell back to the county for BOTH halves, producing "Kesselring
 * County Park — Kent County · Kent County". Same class of bug as the address:
 * a fallback used as though it were a value.
 */
export function locality(town: string | null | undefined, county: string | null | undefined): string {
  const parts = [town, county ? `${county.replace(/\s+County$/i, "")} County` : null]
    .filter((p): p is string => !!p && p.trim().length > 0);
  /* Dedupe rather than print a thing twice — a town genuinely named after its
     county is not worth a second line. */
  return [...new Set(parts)].join(" · ");
}
