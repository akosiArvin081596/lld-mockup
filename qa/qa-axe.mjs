import { launch, ctx, BASE, sleep } from "./clint-lib.mjs"; import AxeBuilder from "@axe-core/playwright";
const b = await launch();
const pages = ["/", "/privacy", "/terms", "/accessibility", "/does-not-exist"];
for (const [mode, confirmed] of [["gate pre-confirmed", true], ["gate open", false]]) for (const vp of [[1440, 900], [390, 844]]) {
  const c = await ctx(b, vp, { confirmed }); const p = await c.newPage();
  for (const path of pages) {
    await p.goto(BASE + path); await sleep(3800);
    const gateVis = await p.evaluate(() => getComputedStyle(document.getElementById("age-gate")).display !== "none");
    const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    const sc = r.violations.filter(v => ["serious", "critical"].includes(v.impact)); const other = r.violations.filter(v => !["serious", "critical"].includes(v.impact));
    console.log(`[${mode} ${vp[0]}] ${path} gateVisible=${gateVis}: serious/critical=${sc.length} other=${other.length} incomplete=${r.incomplete.length}`);
    for (const v of sc) console.log(`   ${v.impact} ${v.id}: ${v.help} -> ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" ; ")}`);
    for (const v of other) console.log(`   (${v.impact}) ${v.id}: ${v.help} x${v.nodes.length} -> ${v.nodes.slice(0, 2).map(n => n.target.join(" ")).join(" ; ")}`);
    if (r.incomplete.length) console.log("   incomplete:", r.incomplete.map(v => v.id + "x" + v.nodes.length).join(", "));
  }
  await c.close();
}
await b.close();
