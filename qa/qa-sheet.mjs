import { chromium } from "playwright"; import fs from "fs"; import path from "path";
const dir = path.resolve("qa/output/clint"); const [prefix, outName] = process.argv.slice(2);
const num = f => +f.match(/-(\d+)\.jpg$/)?.[1];
const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith(".jpg")).sort((a,b)=>num(a)-num(b));
const html = `<body style="margin:0;background:#444;display:grid;grid-template-columns:repeat(2,720px);gap:4px">${files.map(f => `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir,f)).toString("base64")}" width=720><span style="position:absolute;left:6px;top:6px;background:#000;color:#fff;font:12px monospace;padding:2px 4px">${f}</span></div>`).join("")}</body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1450, height: 900 } });
await p.setContent(html); await p.waitForTimeout(500); await p.screenshot({ path: `${dir}/${outName}.png`, fullPage: true }); await b.close(); console.log(files.length);
