#!/usr/bin/env python3
"""
Parse a U.S. Fish & Wildlife Service refuge bird checklist into structured
per-season abundance.

    pdftotext -bbox-layout refuge.pdf refuge.xml
    python3 scripts/parse-refuge-checklist.py refuge.xml bombay-hook

WHY COORDINATES AND NOT TEXT

These brochures are two- or three-column layouts with four season sub-columns
each. In the text layer a row reads:

    __ Canvasback _______________            r   o

Two codes, four possible seasons, and the blanks have collapsed. There is no
way to know from that string whether the bird is a spring/summer visitor or a
fall/winter one — and for a duck those are opposite claims. The x-position of
each code says it exactly, so the parse reads word bounding boxes.

TWO THINGS THAT BIT, BOTH FOUND BY CHECKING ROWS AGAINST THE PAGE BY EYE

Codes merge with trailing tabs into tokens like 'r\\t\\t'. An equality test on
'r' misses those, and the token then falls through into the species name — which
silently ate the spring column on every long-named bird in the first run.

Column geometry differs between pages, and detecting it per page is worse than
useless. Keeping only well-populated clusters drops a sparse column, and then
chunking what remains into fours MIS-ASSIGNS the rest: one Prime Hook page
yielded [197, 218, 239, 485, 527, 546], which pairs the first block's
spring/summer/fall with the second block's spring, relabelled winter. Every bird
on that page then carried a season from a different column. The grid is pooled
across the whole document instead, and split on pitch rather than by counting.

KNOWN LIMIT — PRIME HOOK DOES NOT PARSE WELL ENOUGH TO PUBLISH.

Bombay Hook validates 9/10 against rows read off the page by hand, plus a
random sample. Prime Hook manages 3/14 and finds only 139 of its ~308 species:
its rows carry stray glyphs inside the name ("American Black Ducka"), the leader
rules run into the code zone, and rows split across line groups. Those failures
are visible, which is the only reason this is safe — a parser that quietly got
half of them wrong would be far more dangerous.

So Prime Hook's seasonality is NOT generated. Its checklist needs either a
different approach or a hand pass. Half a refuge's seasons, silently wrong, is
worse than none.

WHAT IT REFUSES TO DO

If anything unexpected sits in the code zone of a row — a photo credit bleeding
across the line, a stray glyph — the row is DROPPED and its name recorded. A
guessed season here is a wrong claim about a bird on a page that promises
checked facts, and the whole point of this site is not doing that. Fourteen of
Bombay Hook's rows go this way; they can be read off the PDF by hand later.
"""
import json
import re
import statistics
import sys

ABUND = {"a": "abundant", "c": "common", "u": "uncommon", "o": "occasional", "r": "rare"}
SEASONS = ("spring", "summer", "fall", "winter")
WORD = re.compile(
    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>'
)


def columns(xml):
    """
    The season grid, derived from the WHOLE document rather than per page.

    THIS IS THE BUG THAT MATTERED. Detecting columns per page and keeping only
    clusters with enough members silently drops a sparse column — and then
    chunking what's left into fours does not merely lose data, it MIS-ASSIGNS
    it. On one Prime Hook page the surviving centres were
    [197, 218, 239, 485, 527, 546]: the first block's winter column had too few
    codes to survive, so the grid paired that block's spring/summer/fall with
    the NEXT block's spring, relabelled winter. Every bird on the page then
    carried one season belonging to a different column.

    The grid is fixed across the document — same x positions on every page — so
    it is pooled once, and groups are formed by consistent spacing rather than
    by cutting a list into fours and hoping.
    """
    xs = sorted(float(a) for a, b, c, d, e in WORD.findall(xml) if e.strip() in ABUND)
    clusters = [[xs[0]]]
    for v in xs[1:]:
        if v - clusters[-1][-1] > 6:
            clusters.append([])
        clusters[-1].append(v)
    # A column needs some mass, but the bar is low because it is pooled.
    centres = [round(statistics.mean(c), 1) for c in clusters if len(c) >= 8]

    # Season columns sit on an even pitch; a jump between text blocks is much
    # wider. Split on that gap rather than counting to four.
    if len(centres) < 4:
        return []
    gaps = sorted(centres[i + 1] - centres[i] for i in range(len(centres) - 1))
    pitch = statistics.median(gaps)
    groups, run = [], [centres[0]]
    for a, b in zip(centres, centres[1:]):
        if b - a > pitch * 1.8:
            groups.append(run)
            run = [b]
        else:
            run.append(b)
    groups.append(run)
    return [tuple(g) for g in groups if len(g) == 4]


def parse(xml_path):
    xml = open(xml_path).read()
    groups = columns(xml)
    if not groups:
        raise SystemExit("could not find a 4-column season grid — check the layout by hand")
    species, dropped = {}, []

    for page in xml.split("<page ")[1:]:
        words = [
            (float(a), float(b), float(c), e.strip())
            for a, b, c, d, e in WORD.findall(page)
        ]
        if not any(w[3] in ABUND for w in words):
            continue

        lines = {}
        for w in words:
            lines.setdefault(round(w[1] / 4), []).append(w)

        for row in lines.values():
            row.sort(key=lambda w: w[0])
            # Both formats mark an entry with a checkbox rule: ___ or __
            starts = [i for i, w in enumerate(row) if re.match(r"^_{2,}$|^_{2,}\S", w[3])]
            for si, i in enumerate(starts):
                chunk = row[i : (starts[si + 1] if si + 1 < len(starts) else len(row))]
                group = next(
                    (g for g in groups if g[0] - 200 < chunk[0][0] < g[0]), None
                )
                if not group:
                    continue

                name_parts, seasons, stray = [], {}, False
                for w in chunk:
                    if w[0] >= group[0] - 6:
                        if w[3] in ABUND:
                            k = min(range(4), key=lambda j: abs(w[0] - group[j]))
                            if abs(w[0] - group[k]) < 7:
                                seasons[SEASONS[k]] = ABUND[w[3]]
                            else:
                                stray = True
                        elif w[3]:
                            stray = True
                    else:
                        name_parts.append(w[3])

                name = " ".join(name_parts)
                name = re.sub(r"_+", " ", name)          # leader rules
                name = re.sub(r"\s+", " ", name).strip(" •·—-")
                if len(name) < 3 or not seasons:
                    continue
                if stray:
                    dropped.append(name)
                    continue
                species.setdefault(name, {}).update(seasons)

    return species, sorted(set(dropped))


if __name__ == "__main__":
    xml, label = sys.argv[1], sys.argv[2]
    sp, dropped = parse(xml)
    print(json.dumps({"label": label, "species": sp, "dropped": dropped}, indent=1))
