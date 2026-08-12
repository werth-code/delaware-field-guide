/**
 * Loads the REAL matching + safety logic out of src/pages/ask.astro.
 *
 * Deliberately does not copy any of it. The script block is extracted from the
 * page source at run time and evaluated, so if you edit `leadIsSafe` or the
 * matcher, this harness tests the edited version. A copied guard would drift
 * from the shipped one and quietly start testing nothing.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildIndex, NEED_LABELS } from "./planner.bundle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASK = join(HERE, "..", "..", "src", "pages", "ask.astro");

function extractScript(src) {
  const open = src.indexOf("<script define:vars=");
  if (open === -1) throw new Error("could not find the define:vars script block in ask.astro");
  const bodyStart = src.indexOf(">", open) + 1;
  const close = src.indexOf("</script>", bodyStart);
  if (close === -1) throw new Error("unterminated script block");
  return src.slice(bodyStart, close);
}

/* Minimal browser surface. The matcher itself touches none of this -- only the
   render and event-binding code does -- but the script binds listeners at the
   top level, so those calls have to land somewhere. */
function makeDom() {
  const el = () => ({
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, scrollIntoView() {}, focus() {}, click() {},
    setAttribute() {}, removeAttribute() {}, closest: () => null,
    querySelector: () => el(), querySelectorAll: () => [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {}, style: {}, value: "", textContent: "", innerHTML: "",
  });
  return {
    document: {
      getElementById: () => el(),
      querySelector: () => el(),
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => el(),
      readyState: "complete",
      body: el(),
    },
    CustomEvent: class { constructor(t, o) { this.type = t; Object.assign(this, o); } },
    window: { addEventListener() {}, location: { search: "", hash: "" }, dispatchEvent() {} },
  };
}

export function loadAsk() {
  const script = extractScript(readFileSync(ASK, "utf8"));
  const INDEX = buildIndex();
  const NEED_COLORS = Object.fromEntries(NEED_LABELS.map(([k]) => [k, "#000"]));
  const dom = makeDom();

  // Hand back the pure functions we want to exercise.
  const capture = `
    ;return { match, parse, leadIsSafe, deterministicLead,
              NEED_SAYS: typeof NEED_SAYS !== "undefined" ? NEED_SAYS : null };`;

  const fn = new Function(
    "INDEX", "ENDPOINT", "NEED_LABELS", "NEED_COLORS",
    "document", "CustomEvent", "window", "location", "history",
    script + capture,
  );

  const location = { search: "", hash: "", href: "https://delawarefieldguide.com/ask/" };
  const history = { replaceState() {}, pushState() {} };
  const api = fn(INDEX, "", NEED_LABELS, NEED_COLORS,
                 dom.document, dom.CustomEvent, dom.window, location, history);
  return { ...api, INDEX, NEED_LABELS };
}
