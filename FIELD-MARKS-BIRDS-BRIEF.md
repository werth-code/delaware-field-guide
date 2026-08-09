# Field Marks · Birds — design brief

Four designs, 101–104. Everything below is what the site already commits to, so the
art and the pages can't drift apart.

**Deck for the series:** *Birds worth looking up.*

---

## Shared system — decide once, apply four times

| | |
|---|---|
| **Size** | 3 in on the longest side, die-cut |
| **Finish** | Gloss laminate, outdoor/waterproof |
| **Colour** | Build in CMYK. Screen RGB will shift — the flamingo pink and the stilt's leg pink are the two that will bite |
| **Bleed** | 3 mm, plus a separate cut-contour path |
| **Safe margin** | Keep type ≥ 4 mm inside the cut line |

**Typography.** One typeface across all four, set as real type in Illustrator — not
generated. The site's display face is the reference; the locality line wants the
mono. Getting these identical across four stickers is what makes them read as a
series rather than four unrelated pieces.

**Layout hierarchy** — the place/bird is the product, the Field Guide is the maker:

```
BIRD NAME                 ← large, display
LOCALITY                  ← small, mono, letterspaced
                          
FIELD MARK 1NN            ← tiny
DELAWARE FIELD GUIDE      ← tiny, smallest thing on the sticker
```

**Legal, before anything is drawn:** original artwork only. No official park or
refuge logos, no state seals, no protected marks, no implied USFWS or Delaware State
Parks affiliation. Photo reference is fine; tracing someone's photograph is not.

**No dates, hours or locations on any sticker.** They change, and a sticker can't be
reprinted. That's what the QR is for.

---

## FIELD MARK 101 — American Flamingo

**SKU** `BFM-101-FLAM` · **Page** [/birding/birds/american-flamingo/](https://delawarefieldguide.com/birding/birds/american-flamingo/)

**Sticker copy**
```
AMERICAN FLAMINGO
DELAWARE
        Recorded in Delaware. Yes, really.
```

**Art direction.** The bird alone, unmistakable, **on no background at all.** The joke
is that it's on the state list — putting it in a plausible Delaware marsh argues with
the joke. Let the die-cut silhouette do the work.

**Reference notes.** Tall, deep pink to vermilion. Neck a long shallow S. The bill is
the identifying feature: heavy, sharply kinked downward at the midpoint, pale pink
with a black tip. Black flight feathers show on the folded wing. Legs pink, knees
apparent, standing on one is the pose everyone knows.

**Why it's first.** It tests novelty and reach beyond birders. **Verified:** DOS
records committee, 2025 additions — *"Added to State List: American Flamingo, Common
Ringed Plover, Townsend's Warbler, Lazuli Bunting."*

---

## FIELD MARK 102 — Red Knot

**SKU** `BFM-102-RKNT` · **Page** [/birding/birds/red-knot/](https://delawarefieldguide.com/birding/birds/red-knot/)

**Sticker copy**
```
RED KNOT
DELAWARE BAY
        Spring migration
```

**Art direction.** Bird with a horseshoe crab, or bird on bare bay sand. Breeding
plumage — this is a spring bird and the rusty version is the one worth drawing.

> ⚠ **No location detail. No recognisable stretch of shoreline, no landmark, no
> place name beyond "Delaware Bay."** This species' feeding beaches carry closures
> because being found is the problem. The sticker must not read as an invitation.
> This is also why its product module is blocked from its own species page in code.

**Reference notes.** A chunky, short-necked sandpiper — dumpier than the peeps around
it. Breeding: brick-red face, throat and breast fading to white under the tail; back
scalloped black, buff and rust. Bill straight, black, about head-length. Legs dark
and short. Non-breeding is plain grey and not the drawing.

**Why it matters.** This is the one that gives the series credibility with birders,
even if the flamingo outsells it.

---

## FIELD MARK 103 — Prothonotary Warbler

**SKU** `BFM-103-PROW` · **Page** [/birding/birds/prothonotary-warbler/](https://delawarefieldguide.com/birding/birds/prothonotary-warbler/)

**Sticker copy**
```
PROTHONOTARY WARBLER
DELAWARE
        Cypress · swamp · summer
```

**Art direction.** **Contrast is the entire design** — saturated yellow against dark
water and cypress. The only one of the four with a background, because the darkness
is what makes the yellow work. Keep the ground abstract: a suggestion of trunk and
still water, not a scene.

**Reference notes.** Head, throat and breast a deep golden-yellow, unmarked. Wings and
tail plain blue-grey with no wingbars. Belly and undertail white. Bill long, straight
and black — heavier than most warblers. Big black eye set in unbroken yellow, which is
the expression people remember.

---

## FIELD MARK 104 — Black-necked Stilt

**SKU** `BFM-104-BNST` · **Page** [/birding/birds/black-necked-stilt/](https://delawarefieldguide.com/birding/birds/black-necked-stilt/)

**Sticker copy**
```
BLACK-NECKED STILT
DELAWARE MARSH
```

**Art direction.** Legs and reflection. Three colours only — black, white, and that
pink. A mirrored reflection in shallow water gives you a strong vertical composition
that suits a die-cut, and lets the legs be as absurd as they actually are.

**Reference notes.** Glossy black above — crown, nape, back, wings — clean white
below and up the front of the neck. White spot above the eye. Bill long, needle-thin,
straight, black. **Legs are the point:** coral to hot pink, disproportionately long,
trailing well past the tail in flight.

**Why it's here.** Bombay Hook identity, and one of the few genuinely good birds there
you can see from the car.

---

## Backing card — same for all four

**Front**
```
FIELD MARK 1NN
[BIRD NAME]
Birds worth looking up.
```

**Back**
```
DELAWARE FIELD GUIDE
Delaware, checked before you drive.

Going back? Rules and seasons change.
Scan for the current guide.

[QR]  delawarefieldguide.com/go/fm1NN
```

**The QR points at `/go/fm1NN/`, never at a page directly.** A printed card can't be
edited; a redirect target can. That indirection is why a park page can move without
orphaning every sticker already in someone's hand.

---

## Print run

50 × 4 = 200 stickers · ~$144 printing · **~$190–225 all in** with backing cards,
envelopes and proofs.

**Verify StickerApp's pricing immediately before ordering** — the figures above were
checked Aug 9 2026 and move.

**Don't order 100 of anything until demand differs by SKU.** The question this run
answers isn't "how cheaply can I buy stickers", it's "which of these four do people
actually want" — and 50 each is enough to see a difference without trapping money in
the wrong three.

---

## When artwork exists

Send me the files and I'll import them through `scripts/import-photo.sh`, add them to
the records, and flip `status` to `available` with a price. Everything else is already
wired: product pages, structured data, the sitemap gate, and the safety blocklist that
keeps the Red Knot sticker off its own species page.
