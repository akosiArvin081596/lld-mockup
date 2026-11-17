import Image from "next/image";

import { buttonVariants } from "@/components/ui/button";
import { ageGate, footer, legacy } from "@/content/site";
import { cn } from "@/lib/utils";

import { AgeGateRoute } from "./age-gate-route";

/*
 * 21+ age gate, per CONTRACT section 6.
 *
 * Everything here is server-rendered. Two small inline scripts do the work, so the gate is
 * correct from the first paint and its buttons respond before React hydrates:
 * - AgeGateBootstrap (first in <body>) adds `js` to <html>, plus `age-ok` for visitors who
 *   confirmed within `rememberDays`.
 * - AgeGate's own script wires the buttons, the focus trap and Esc (which does not dismiss).
 * The CSS shows the gate only for `html.js:not(.age-ok):not(.gate-exempt)`, so without JS
 * there is no gate, and the legal pages it links to stay readable.
 * AgeGateRoute keeps `gate-exempt` in step with client-side navigation.
 */

const MAX_AGE_MS = ageGate.rememberDays * 24 * 60 * 60 * 1000;
const KEY = JSON.stringify(ageGate.storageKey);

/** Legal pages stay readable without the gate (the gate links to them). */
export const GATE_EXEMPT_PATTERN = "^/(privacy|terms|accessibility)/?$";

/*
 * Pre-paint bootstrap:
 * - `js` on <html>; `age-ok` for a confirmation younger than rememberDays and not dated more
 *   than a minute in the future (clock skew);
 * - `gate-exempt` on the legal routes;
 * - `reveal-off` (every section simply shows) if the reveal system cannot run: at once when a
 *   /_next/static script fails to load, or 3s after the page's `load` event if RevealController
 *   still has not mounted. Timing from `load` (not first paint) keeps a slow but healthy first
 *   load (cold cache, slow device, dev compile) from switching the reveals off.
 */
const bootstrapScript = `(function(){var h=document.documentElement;h.classList.add("js");try{if(new RegExp(${JSON.stringify(GATE_EXEMPT_PATTERN)}).test(location.pathname))h.classList.add("gate-exempt");}catch(e){}try{var r=window.localStorage.getItem(${KEY});if(r){var v=JSON.parse(r),t=v&&v.confirmedAt,n=Date.now();if(typeof t==="number"&&t>0&&t<=n+60000&&n-t<${MAX_AGE_MS})h.classList.add("age-ok");}}catch(e){}function off(){if(!h.classList.contains("reveal-ready"))h.classList.add("reveal-off");}window.addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="SCRIPT"&&(t.src||"").indexOf("/_next/static/")>=0)off();},true);window.addEventListener("load",function(){setTimeout(off,3000);});})();`;

const gateScript = `(function(){
var d=document,h=d.documentElement,g=d.getElementById("age-gate");
if(!g)return;
var yes=d.getElementById("age-gate-confirm");
function isOpen(){return h.classList.contains("js")&&!h.classList.contains("age-ok")&&!h.classList.contains("gate-exempt");}
function focusables(){return Array.prototype.slice.call(g.querySelectorAll("a[href],button:not([disabled])"));}
yes.addEventListener("click",function(){
try{window.localStorage.setItem(${KEY},JSON.stringify({confirmedAt:Date.now()}));}catch(e){}
h.classList.add("age-ok");
var m=d.getElementById("main");if(m)m.focus({preventScroll:true});
});
d.addEventListener("keydown",function(e){
if(!isOpen())return;
if(e.key==="Escape"){e.preventDefault();e.stopPropagation();return;}
if(e.key!=="Tab")return;
var f=focusables();if(!f.length)return;
var first=f[0],last=f[f.length-1],a=d.activeElement;
if(a===g){e.preventDefault();(e.shiftKey?last:first).focus();return;}
if(e.shiftKey&&(a===first||!g.contains(a))){e.preventDefault();last.focus();}
else if(!e.shiftKey&&(a===last||!g.contains(a))){e.preventDefault();first.focus();}
},true);
d.addEventListener("focusin",function(e){if(isOpen()&&!g.contains(e.target))g.focus({preventScroll:true});});
if(isOpen())g.focus({preventScroll:true});
})();`;

/** Shows the gate only while it is open, and locks page scroll underneath it. */
const CREST = "/brand/crest-full.png";
// The gate and hero crests use the same `sizes` (matching their rendered widths: about 200px on
// phones, 240px small, 336px desktop), so the browser fetches one file for both.

const gateCss = `#age-gate{display:none}html.js:not(.age-ok):not(.gate-exempt){overflow:hidden}html.js:not(.age-ok):not(.gate-exempt) #age-gate{display:flex}`;

/** Inline pre-paint script (rendered first in <body>): adds `js` and, for confirmed visitors, `age-ok` to <html>. */
export function AgeGateBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />;
}

/** Wraps the named legal documents in the gate's fine print with links to them. */
function LegalLine() {
  const lower = ageGate.legal.toLowerCase();
  // Case-insensitive, so the sentence and the footer link labels can differ in capitalization.
  const links = footer.legalLinks.filter((l) => lower.includes(l.label.toLowerCase()));
  if (!links.length) return <>{ageGate.legal}</>;
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(${links.map((l) => escape(l.label)).join("|")})`, "i");
  return (
    <>
      {ageGate.legal.split(pattern).map((part, i) => {
        const link = links.find((l) => l.label.toLowerCase() === part.toLowerCase());
        return link ? (
          <a
            key={i}
            href={link.href}
            className="underline decoration-stone/50 underline-offset-4 transition-colors duration-300 hover:text-parchment hover:decoration-parchment"
          >
            {part}
          </a>
        ) : (
          part
        );
      })}
    </>
  );
}

export function AgeGate() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gateCss }} />
      <div
        id="age-gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-body"
        tabIndex={-1}
        className="fixed inset-0 z-[200] overflow-y-auto bg-obsidian px-6 py-12 outline-none [@media(max-height:760px)]:py-8"
      >
        {/*
          Atmosphere: a dim barrel room with one lamp, left visible as a real room behind the gate.
          A 55% overlay keeps it present; a soft radial pool of shade behind the crest and the
          question holds the text at AA. No blur.
        */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0">
          <Image src="/media/gate-backdrop.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-obsidian/[0.55]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 36% 58% at 50% 52%, rgb(18 17 15 / 0.82) 0%, rgb(18 17 15 / 0.6) 45%, rgb(18 17 15 / 0) 100%)",
            }}
          />
        </div>

        {/* Inset hairline frame, like the border of a bottle label. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-bronze/40 sm:inset-5" />

        <div className="relative m-auto flex w-full max-w-md flex-col items-center text-center">
          <div className="lld-crest relative w-[12.5rem] sm:w-[14.5rem] [@media(max-height:760px)]:w-[11.5rem]">
            <Image
              src={CREST}
              alt={legacy.crestAlt}
              width={1440}
              height={1631}
              sizes="(min-width: 1024px) 336px, (min-width: 640px) 240px, 200px"
              priority
              className="h-auto w-full"
            />
            <span aria-hidden="true" className="lld-glint">
              <Image src={CREST} alt="" width={1440} height={1631} sizes="(min-width: 1024px) 336px, (min-width: 640px) 240px, 200px" priority className="h-auto w-full" />
            </span>
          </div>

          <h2 id="age-gate-title" className="mt-8 [@media(max-height:760px)]:mt-6 text-[2.125rem] leading-[1.1] sm:text-[2.75rem]">
            {ageGate.title}
          </h2>
          <p id="age-gate-body" className="mt-4 text-base text-stone">
            {ageGate.body}
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              id="age-gate-confirm"
              type="button"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "sm:min-w-[12.5rem]")}
            >
              {ageGate.confirm}
            </button>
            <a
              href={ageGate.declineUrl}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "sm:min-w-[12.5rem]")}
            >
              {ageGate.decline}
            </a>
          </div>

          <p className="mt-9 [@media(max-height:760px)]:mt-7 max-w-xs text-[0.8125rem] leading-relaxed text-stone">
            <LegalLine />
          </p>
          <p className="mt-2 text-[0.8125rem] text-stone">
            {footer.responsibility}
          </p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: gateScript }} />
      <AgeGateRoute pattern={GATE_EXEMPT_PATTERN} />
    </>
  );
}
