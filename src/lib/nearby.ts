/**
 * Just over the line.
 *
 * Places outside Delaware that people here genuinely drive to.
 *
 * WHY THIS IS ITS OWN SECTION AND NOT A ROW IN THE PARKS TABLE
 *
 * This site says it covers Delaware. That claim is worth something precisely
 * because it is narrow, and quietly filing a Maryland zoo among the state
 * parks would spend it for one entry. Visitors don't care about state lines; a
 * reference that says what it covers has to. Both things are true, so the
 * answer is a section that states the line rather than crossing it silently.
 *
 * Delaware makes this sharper than most places. It is forty miles wide. Almost
 * everyone in New Castle County lives closer to somewhere in Maryland or
 * Pennsylvania than to Sussex, and pretending otherwise makes the site less
 * useful, not more honest.
 *
 * These are also a different KIND of record. A private attraction sets its own
 * prices and hours and changes them without notice, where a state park's fee
 * is published by DNREC. So `operator` is the business, verification is
 * explicitly against the operator's own site, and admission is expected to be
 * the first thing that rots.
 */
import type { FieldNote, Photo } from "./state-parks";
import type { FieldReport, Verdict } from "./indoor";

export interface NearbyPlace {
  slug: string;
  name: string;
  /** Where it also gets called something else. Two names, one place. */
  alsoKnownAs: string | null;
  /** Plain-language distance from the lake, and roughly how long. */
  distance: string;
  town: string;
  state: string;
  county: string | null;
  address: string | null;
  blurb: string;
  /** What it actually is: zoo, ski area, nature preserve. */
  kind: string;
  season: string | null;
  admission: { note: string; amount: number | null };
  /**
   * Extra rows for the "Going" table — the questions that are specific to one
   * place and don't deserve a field of their own on every record. Feed prices
   * at a zoo, whether the paths take a stroller, what the parking costs.
   *
   * A list rather than a boolean per fact, because these answers are almost
   * never yes/no. "You can feed them" and "feed is $1 to $5 and they take
   * credit" are the same fact at two useful levels of detail, and only the
   * second one stops someone hunting for an ATM.
   */
  onSite?: { label: string; note: string }[] | null;
  phone: string | null;
  website: { label: string; url: string } | null;
  warnings: string[];
  photos?: Photo[];
  verdict?: Verdict;
  fieldNotes?: FieldNote[];
  sources: { label: string; url: string; note?: string | null; primary?: boolean }[];
  sourcedOn: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  reports?: FieldReport[];
}
