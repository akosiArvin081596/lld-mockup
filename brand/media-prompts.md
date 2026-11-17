# Media sources (Higgsfield)

All generated imagery on the site, with the prompt and model used, so any shot can be regenerated.
Raw downloads live in `media-src/` (not committed). `brand/scripts/process-media.mjs` turns the chosen
takes into the files in `public/media/` and `public/brand/`.

Every photo prompt ends with the same realism suffix:

> Documentary photograph taken on a full-frame camera with a 35mm lens. Natural available light, true-to-life
> color, soft contrast, subtle film grain, realistic textures with everyday wear and imperfections. No people,
> no text, no readable labels, no logos, no signage, no watermark.

| Slot | File | Model | Chosen take | Prompt (before the suffix) |
|---|---|---|---|---|
| Hero poster + video start/end frame | `hero-poster.jpg` | Soul Location 16:9 | hero-a (of a, b, c, d) | Interior of a dim, high-ceilinged bonded warehouse at first light. On the left, oak spirits barrels rest three high on steel racks; on the right, stacked wooden wine cases and shrink-wrapped pallets of plain brown cartons. A long polished concrete aisle runs down the center toward a tall open loading door glowing with cool morning daylight. Warm tungsten work lamps hang from the steel trusses, faint dust hangs in the air. Deep shadows, warm amber and charcoal tones, calm and orderly. |
| Process 01 Select | `process-select.jpg` | Soul Location 4:3 | select-b | A private tasting room. A dark walnut table holds a neat row of stemmed wine glasses and short crystal tumblers with red wine and amber spirits, a closed leather notebook and a fountain pen. Soft window light from the side, the background falls off into shadow, quiet and orderly, warm muted tones. |
| Process 02 Store | `process-store.jpg` | Soul Location 4:3 | store-a | A tall warehouse racking aisle stacked with wooden wine crates and plain brown cardboard cases on pallets, polished concrete floor, cool daylight from skylights mixing with warm work lamps, strong one-point perspective, clean and orderly, slightly moody. |
| Process 03 Sell | `process-sell.jpg` | Soul Location 4:3 | sell-b | The back bar of an upscale cocktail bar before opening. Rows of glass bottles on softly lit wooden shelves, deliberately out of focus so no label is readable. In the sharp foreground, a marble bar top with a single cut-crystal rocks glass. Warm low light, dark wood, brass rail, moody and quiet. |
| Process 04 Deliver | `process-deliver.jpg` | Soul Location 4:3 | deliver-d (retake) | An unmarked plain white box truck backed up to the open loading dock of an old red brick warehouse at dawn. Warm light spills from the dock onto stacked plain cardboard cases on wooden pallets. Overcast blue hour sky, wet concrete, a quiet industrial street. The truck has no lettering, no logos and no visible license plate; the building has no signs. |
| Our Legacy | `legacy-barrel.jpg` | Soul Location 3:4 | barrel-a | Close-up of the head of an old oak barrel in a dark cellar, iron hoops with patina, tight wood grain, slightly charred stave edges, a fine layer of dust, warm raking side light, shallow depth of field. No markings or stencils. |
| Partners: producers | `partners-cellar.jpg` | Soul Location 3:4 | cellar-a | A stone-vaulted aging cellar with long rows of oak barrels on wooden cradles, arched brick ceiling, warm wall lamps, receding perspective, cool shadows, quiet and old. |
| Partners: trade | `partners-shop.jpg` | Soul Location 3:4 | shop-e (retake) | Interior of a small independent wine shop at dusk, photographed from the aisle. Floor-to-ceiling dark oak shelving with wine bottles lying on their sides in diamond racks, only the dark glass bottle bottoms face the camera so no labels are visible. Warm brass pendant lamps, worn wooden floorboards, a quiet empty room. No price tags, no screens, no chalkboards, no posters, no signs. |
| Crest showcase ground | `texture-slate.jpg` | Soul Location 16:9 | slate-a (warmed in sharp) | Top-down photograph of a flat dark charcoal slate stone surface, fine natural cleft texture with faint scattered mineral flecks, evenly lit with soft light, no objects, fills the entire frame edge to edge. |
| Crest cutout | `public/brand/crest-full.png`, `crest-mark.png` | Image Background Remover | crest-nobg | The supplied logo (`brand/source/lld-logo-original.png`) with its stone background removed. The artwork itself is not altered. A first attempt with Bytedance Upscale + remove_bg failed on Higgsfield's side. |

Rejected takes and why: hero-b (purple cast), hero-c (teal cast, flat), hero-d (stenciled "WINE" text, too clean),
shop-a (card reader with garbled text on the counter), deliver-b (glowing sign with fake lettering), deliver-a
(license plate text).

## Hero video

| File | Model | Source | Prompt |
|---|---|---|---|
| `public/media/hero-1080.mp4`, `hero-720.mp4` | Kling 4.0, image-to-video, 10 s, 1080p, 16:9 | hero-a as both start and end frame (seamless loop) | Locked-off camera on a tripod inside a dim bonded warehouse at first light. The camera barely drifts forward a few centimeters and gently settles back to where it started. Fine dust drifts slowly through the soft daylight from the open loading door, the hanging work lamps glow steadily, a faint haze moves gently through the air. Realistic documentary footage with natural motion, constant soft light, locked exposure and white balance, no flicker, no cuts, no camera shake, no people, no text. |

### Hero video, revision 2 (in use)

| File | Model | Source | Prompt |
|---|---|---|---|
| `public/media/hero-1080.mp4` (4.1 MB), `hero-720.mp4` (1.3 MB), `hero-poster.jpg` | Kling 4.0, image-to-video, 10 s, 1080p | hero-a as start frame; seamless loop built in ffmpeg by crossfading the last 1.5 s into the opening (loop length 8.6 s) | Slow, steady forward dolly down the central aisle of a dim bonded warehouse at first light. The camera glides at chest height toward the open loading door; oak barrels on steel racks pass on the left, stacked wooden wine cases and wrapped pallets pass on the right. Warm tungsten work lamps overhead, fine dust drifting through soft daylight, a faint haze. Realistic documentary footage, smooth constant speed, locked exposure and white balance, no flicker, no cuts, no camera shake, no people, no text. |

The first ambient clip (`media-src/hero-loop.mp4`) is kept as an alternative; Arvin asked for visible motion.

### Official crest re-cut (revision 2)
The background remover left a faint smoky haze around the lettering. `crest-full.png`, `crest-mark.png`,
`official-monogram.png` and `official-wordmark.png` are now cut with a gold matte on top of it:
alpha = remover alpha × smoothstep(saturation 0.12 to 0.24, or luminance above 0.55) × smoothstep(luminance 0.035 to 0.085).
Grey stone and smoke drop out; the gold, including its highlights, stays. The artwork itself is unchanged.
For dark backgrounds only. `official-monogram-88.png` and `official-wordmark-64.png` are pre-sharpened 2x renders for the header.

## Revision 3: stills to enrich text-only sections (Arvin: "use Higgsfield to beautify the elements")

Same realism suffix as above (plus "no letters anywhere" on the retakes). Soul Location unless noted.

| File | Chosen take | Prompt (before the suffix) |
|---|---|---|
| `service-sales.jpg` | svc1-c (retake) | A worn brown leather bottle carrier holding four dark glass wine bottles with plain black capsules and no labels, resting on a dark walnut bar top next to a waiter's corkscrew and a folded linen cloth, warm window light from the side, plain dark wall behind. |
| `service-route.jpg` | svc2-a | An upscale restaurant dining room just before evening service, tables set with white linen, polished wine glasses and folded napkins, warm low pendant light, empty and calm, soft focus toward the back. |
| `service-warehousing.jpg` | svc3-d (retake) | Rows of wine bottles stored on their sides in tall metal bin racks inside a cool, dim bonded warehouse, only the dark glass bottle bottoms facing the camera, soft light catching the glass, deep perspective, calm and orderly. |
| `service-logistics.jpg` | svc4-a | The inside of a delivery truck trailer seen from its open rear doors at blue hour: plain cardboard wine cases stacked and strapped on pallets, warm interior light, cool dusk outside. No lettering anywhere. |
| `service-compliance.jpg` | svc5-a | A tidy desk in a dim office at night: a closed dark leather ledger, a fountain pen, a stack of plain unmarked folders, a brass desk lamp casting warm light, a dark window behind. No readable paper or text. |
| `service-brand.jpg` | svc6-a | A tasting table set for a staff training session in an empty bar: a long neat row of clean wine glasses with small tasting pours of red, white and amber, small water carafes, soft window light, dark wood. |
| `gate-backdrop.jpg` | gate-a | A dim private tasting room at night: oak barrels along a stone wall, a heavy wooden table, a single warm lamp, deep shadows, empty and calm. |
| `reach-highway.jpg` | reach-b | Aerial photograph at dusk of an interstate highway curving through dark open country, faint streaks of headlights, distant town lights on the horizon, deep blue and amber tones, wide and quiet. |
| `contact-still.jpg` | contact-b (Nano Banana Pro, 2k) | Editorial still life on a dark walnut desk: a cream envelope sealed with a plain dark red wax seal with no imprint, a black fountain pen, and a cut-crystal tumbler of amber spirit, warm low lamp light from the left, shallow depth of field. |
| `texture-paper.jpg` | paper-b | Macro photograph of heavy cream cotton rag paper filling the whole frame: visible fibers, soft natural texture, evenly lit, warm off-white. No text or marks. |

Rejected: svc1-a/b (sign lettering, dark), svc1-d (a person's arm), svc2-b, gate-b, svc5-b (people), svc3-a/b (flat plywood), paper-c (too busy). A Nano Banana Pro paper attempt failed on Higgsfield's side.
| `standards-case.jpg` | case-c (Soul Location 3:4) | An open wooden wine case lined with straw holding six dark glass bottles with plain capsules and no labels, the lid resting beside it on a worn oak table, soft window light from the side, warm muted tones, calm and careful. |
| `legacy-seal.jpg` | seal-b (Nano Banana Pro 4:5, 2k) | Editorial macro still life: the neck of a dark glass wine bottle sealed with deep red wax that drips slightly down the glass, a natural cork just visible, the bottle lying on the worn head of an oak barrel, warm low side light, deep shadows, shallow depth of field. No label, no text, no logos, no people. |
