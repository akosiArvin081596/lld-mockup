import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/*
 * United States, one <path> per state (plus DC), keyed by two-letter code.
 * Source: "Blank US Map (states only).svg", Wikimedia Commons, CC0 1.0 (see CREDITS.md).
 * Simplified for the site: coordinates converted to absolute and rounded to whole units
 * in the original 959 x 593 space, then re-encoded as relative path commands.
 * Alaska and Hawaii are shown as insets, as in the source.
 *
 * States are listed west to east. Each path gets --i (0 to 1) from that order, which
 * motion-sections.css uses to draw the outlines across the country as the map scrolls in.
 */
const STATE_PATHS: ReadonlyArray<readonly [code: string, d: string]> = [
  ["CA", "M69 366l4 5h-2l-1-2zM71 356l2 4l3 1v-1l-1-2l-2-3zM51 337v2l2 1h5l1-1h-3zM46 337h3l1 3h-4zM93 382l-1-3l1-3l-1-7l-2-5l-1-2v-1l-7-9h-4l-2-2l1-1l-1-4l-2-1l-4-1l-2-1l-2-2l-4-7l-3-2h-4l-3-3l-5-1h-3l-2-3v-3l1-5l2-5l-2-1l-4-10l-2-3l-1-3l-1-3v-2l-2-5l-3-3l1-7l2-1l2-3l-1-3l-1-1h-2l-3-3l-1-4v-7l1-4v-3l3 1v1l-1 1v2l4 4v-5l-2-4l1-1l-1-1l2-2l-1-3l-2 1l-1 4v1l-1 1h-1l-5-6l1-6l-1-4l-7-13l1-10l2-4v-6l-5-11v-6l7-7l2-3v-1l4-9v-9l1-2l66 19l-17 63l2 3l70 105l-1 2l1 4l2 1l1 6l2 3l1 2l-2 1l-4 2l-3 3l-1 7l-3 3l-1 1l-2 7l2 1h1l1 2v2l-3 3h-3z"],
  ["OR", "M94 167l47 11l8-38l3-5l1-3h1l-1-2l-3-2v-4l4-6h2l2-3v-1l2-2l3-5l4-5v-3l-4-3l-1-4l-31-7l-3 1l-5-1l-2-1l-1 1h-4h-4l-1 1l-4-1l-1-1h-1l-5 1l-1-1l-2 1l-1-2l-2-1l-1-1l-1-1l-3 1l-2-1h-1l-1 1h-6l-6-4l1-5v-4l-4-4h-3l-1-1l1-1l-1-1h-1l-1 1h-2v-1h-1h-1l-2-1v4l-1 1l-1 4v2l-5 12l-13 32l-3 4h-2v2l-5 7v4l1 1v2l-1 1l-2 3l1 6l1 3z"],
  ["WA", "M162 84l1 4l-1 4l-31-7l-3 1l-5-1l-2-1l-1 1h-4h-4l-1 1l-4-1l-1-1h-1l-5 1l-1-1l-2 1l-1-2l-2-1l-1-1l-1-1l-3 1l-2-1h-1l-1 1h-6l-6-4l1-5v-4l-4-4h-3l-1-1l1-1l-1-1h-1l-2-2l-1 1h-2l-1-2h-2l3-8l-1 6l1 1v-2l2 2l-1-2l1-4h2l-1-2h-1h-2l1-4v1l1 1v-2h4l-3-1l-1-2l-2 2l1-4v-4v-4l1-6l-1-2l-1-2v-4v-3l2-2v-1v-1h1l8 8l4 2l5 2h4v3l1-2h1v3l1-2l1-1l1 1l-2 1l1 1v-1h1v2h-1v1v1l-1 1l-2 3l1-3h-2v2l-4 3v1l-2 2v1h2h2l1-1l-4 1v-1l2-3l2-1h2l1-1l3-3v-1h1v4h-1l-1 1l-1-1v1v2l-1-1v1l-1 1h2l1 2l-1 2l-1 1v1h-1l-1-1l1-1l-1-1v1l-1 2l-1 1v-2l1-1v-1l-2 1l1 2l-1 1l-2-1l-1 1h2v2l1-2v2v-1l1 1h1h1v-1l2-1v-2l1 1v1h1v-2h2v-3v-2h1l-1-2l1-1v-2l3-2h1v-2l-1-1v-4l-1 1l1 3h-1v-2h-1v-2l2-1v1l1-1l-2-2l-1-2v2l1 1l-1 1l-1-1l-1 1l1 1v2v2l1-1l1 2v2h-2v-1l-1-2v-3l-1-2l2-3l1-4h1l1 3v-3l1 1v-4h-1l-1 2l-1-3h2l-2-5l2-1l25 8l32 8l24 5zM83 44h1v1h-1v1l-1-1h1zM88 40l-1 2v1l1-1h1zM88 18v1h2v-1l1-2l-1-1l-1 2v-2l-1 1l-1 1zM91 13l1 1h-1l-1 1v-3zM88 11h-1l1 1zM87 14h1v1h1v-3h-1zM85 13v3l1 1l1-2l-1-2zM87 12l-2-1l1 2zM90 5h-1v1l1 1zM89 38v-3h-1v2z"],
  ["NV", "M168 297l-4 17l-2 3h-2l-1-2l-4-2l-4 1l-1 13l1 5l-1 3l-1 3l-70-105l-1-3l16-63l47 11l24 5l24 5z"],
  ["AK", "M16 572h2l1 1l-1 1h-2l-3 1h-3l2-1v-1h3zM24 570l1 1h1l1 1v-1l1 1l1 1v1l-4 2l-2-1h-1l-2 1h-2l-1-2h5zM30 570h1v1v1h-1l-1-1zM32 570h1v1l-1 1zM32 573h4v1h-1l-1-1v1l-1-1zM199 580h2l-1 2h-1l-1-1l1-1M198 577v-1v-2l2-1l5 5l1 3l2 2v5h-1l-1-3l-3-2h-1l1 3h2v2h-1l-4-4v-1l2-1v-1l-1-1l-1-1l-2-1h1h1l-1-1zM194 568h1l3 3v1l-1-1v2v1v1h-1v2l-1-1v-2l1-1l-2-3v-1zM196 567h1h3l3 3v1h-1h-1v-1l-1-1h-1l1 2v1h-1h-1v-2l-3-2zM183 558l1-1h1h1l4 2v2h-1l-1-1l1 2h1l1 2h-1l-2-2h-1v1v1l1-1l2 2h1l2 5v3v2l-2-2v-1l-2-2v-2l-1-2v1v1l-1 1v-4l-2-1l-1-3l-1-1zM190 555l1 2h3l1 2l-1 1l2 3v1l-1 1v1l-2 2l-1-2v-1l1-1v-1l-2-2v-3l-1-2zM133 537l-4 4v2l2-1l1-2l2-2zM102 554l2 2v-2v1h4h1v-2l-1-1h-1v-1v-1h-1zM94 560l1 6h2l3-3v1l6-4l1-1l-1-1v-2l-2 1v-1l-3-1l-3 1v3l-1-2h-1l-1 1zM91 568l1-1l2-1l2 1l1 1h-2l-1-1l-1 1zM86 571l-1 1l2 2v-1v-1zM80 564h1h1zM66 575v1h1v-1zM66 572l-1 1v1v1l1-1zM64 571l-1 1l-1 1v1l-1 1h1v-1h1l1-1v-1zM59 569v2l1 1l2-1v-1h1l-1-1v1l-1-1zM54 569l1 1v1l-1-1zM50 571h2l-1 1zM47 574l1 1h-1zM21 542l1 1v1zM21 536v1l1-1zM45 517h1h1h1h2h1l1 2v1l-1 2h-3l-2-2h-1l-1-2zM24 502v2l2 2v1h-1l-2-1v-1v-2zM42 479v1l2 2h2l1 1v2l2 2l2 1v1l-1 1l-1-1h-3v-1l-1-2l-2-2l-2-1h-1l1-2zM59 475h1v1h-1zM75 494h1v2l-2-1zM203 572h-1v2h1zM45 568l-1-1l-4 1l-3 1v2l2 1l1-1h2l5 1v-1l-2-1zM47 570v-2l1 1v1h2v-2l1 2h2l3-3h1v1l1 1h4l3-2h1v2l1-1v-1h6l2-1l-1-2l1-1h2v-1h2l1-1l1 1l5-2v-2l6-2l2-2l1-1l1 1l2-1l2-2v-1l2-1l1-1l1-1l-1-2h-3v-1l1-2h1l2-2h2l3-3v-1l2-3l4-4l2-1l2-1l2 1l2 3h-2l-1-2l-3 2h-2v3l-3 5v2h3l-1 1h-1l-3 2v1l2 1h3l2-2h1l3-2l1-2h1l7 1l1-2l1-4l-2 1l1-2l-2-2l1-1v1h3l1-1h2l-1 2h2l-2 1l4 2h-3l-1 1l1 2l4-2l2 2l1-1l1 1l4 2h3h4l4 1l2 2h4l2-1l1 2l-2 1l1 1l8 4l1 2l6 4l3-2l-1-2l-3-2l3 1l1 1v3l2-1l2 2l-2-10l1 1l2 6l2 3h2l2 3h1v6h4l1 2l2 1l1 3l-2 3l3 1l1-2v3l-1 1l1 2l1-3v-1h1v3l-1 1l1 3l1-2v1v2h1v1h2v-1h-1v-2h-1l1-1h1v-2v1v2l1 4h2l2-4v-2l-1-4v-1v-1v-1h-2l-3-2h-1l-2-1h-2v-2h-2v-2h-1v-2l-5-7l-2-2v-1l-4-4l-1-1l-1-2h-2v-2l-1-2h-2l-2 1l-2 2v2h-2l-2 3h-1v-3l-2-2l-3-2v-2l-3-1v-2h-2l-1 1h-1l-1-1l-1 1l-2-1v-86l-7-4l-2-1l-2 1h-2l-2-1l-5-1l-5-3l-6-1l-2 1v-2l-2-1l1-1v-1l-3-1h-3v1l-1-1v-3l-1-1l-2 3h-1v-1h2v-1l-2-3h-1l-5 3h-4h1l-2-1l-5 4h-2l-1-1l-3 2l-3 3l-3 3l-1 1h-3h-2l-3-1l-2 3v3l2 2l2 5v5l3 2h4v1l-1 3l1 2l-2-2v-3h-2l1 1v2l3 4h-1l-2 1l-7-2v-2l2-2v-1l-2-1l-3 1h-4l1 2l-2-2l-8 1l-1 2l5 5l-1 1v2l-1 1v2l4 3l4 1l5 1h2h1h4v-1l1 1v2h-3l1 3v4l-3 2h-2l-2-1l-1 1l-3 2h-2l-1-3h-3l-2 2l-1 2l-3 2l-5 4l-1 3l1 2l1 1h1l1 1l-1 1l-1 1l1 1l-3 1l1 2l2 3v4l4 1l3-1l2-1v2l1 5l-2 1v5l-1 1h-2l2 1h2l1-1l4-1l2 3l1-1l2 5l1 1l1-1v-3l1-1v2l1 1l1 1l5-2v2l-2 1l-1 1l-3 7l-5 2l-1 2v1h-1l-10 3l-1 4h-2l1-1l-2-2h-3l-5 3l-3 1h-2v3z"],
  ["HI", "M317 554v3l2 2v1l-5 5v1l2 3l1 4v3v1v3l4 2l1 2l1-2l2-3l5-3l3-1l3-1l1-1l4-3l-3-1l-2-2l1-1l-1-1h-2v-3v-1l-3-2l-5-2h-2l-4-3h-1zM302 537l-1 1l-1 2l3 2l2 1l1 1v3h4l5-3v-2l-2-1l-3-2h-2l-3 1l-1-3zM300 548l1-1h3v1zM293 540l2 4l3-1v-2l-1-2zM289 533l-1 2h5l5 2l2-2v-1h-4zM273 522l-2 2l-3 1l1 2l2 3v1h3h2l2 1l3-1v-1h-1v-2l-1-1l-1 1l-1-1v-1l-2-4h-1zM241 510l-4 3v2l3 1l2 1l2 1l3-2v-2v-2v-1l-1-1zM230 515v1l-2 1v1l1 1l1-1l2-1v-2z"],
  ["ID", "M165 183l-24-5l8-38l3-5l1-3h1l-1-2l-3-2v-4l4-6h2l2-3v-1l2-2l3-5l4-5v-3l-4-3l-1-4l1-4l-1-4l13-56l14 3l-5 22l4 7l-2 5l4 5h2l3 9v2l3 3h1l1 2h3v1l-7 17v4l1 1l2 2l3-1l3-2l2 2l1 2l-1 3l3 10l2 3l2 2l1 3v4l2 2l2-2l7 2l2-2l9 2l3-3l1-1l2 2l1 4h1l-8 55l-48-8z"],
  ["AZ", "M140 388l3-3v-2l-1-2h-1l-1-1l1-7l1-1l3-3l1-7l3-3l4-2l2-1l-1-2l-2-3l-1-6l-2-1l-1-4l1-2l1-3l1-3l-1-5l1-13l4-1l4 2l1 2h2l2-3l4-17l46 8l40 6l-18 124l-37-5l-64-38v-3l2-1z"],
  ["UT", "M233 218l4-22l-48-8l-21 109l46 8l40 6l11-88z"],
  ["MT", "M247 131l57 7l51 6l2-21l6-67l-54-5l-54-8l-66-12l-5 22l4 7l-2 5l4 5h2l3 9v2l3 3h1l1 2h3v1l-7 17v4l1 1l2 2l3-1l3-2l2 2l1 2l-1 3l3 10l2 3l2 2l1 3v4l2 2l2-2l7 2l2-2l9 2l3-3l1-1l2 2l1 4h1z"],
  ["WY", "M355 144l-51-6l-57-8l-2 11l-8 55l-4 22l32 5l45 5l38 4l3-44z"],
  ["NM", "M358 333h-1l-8 99l-32-2l-34-4l-1 3l2 2l-30-4l-2 10l-16-2l18-124l52 6l52 5z"],
  ["CO", "M375 323l-17-1l-52-4l-52-7l11-88l45 5l38 4l33 2l-2 22z"],
  ["TX", "M282 429l1-3l34 4l32 2l8-99h1l52 3l-1 43l2 1l3 3h1l2-1l1 1l1 1l1-2l3 2v3l1 1l3-1l3 2h2h1l3 2l2-2l3 1l2 3h2v2l2 1l3-3l3 2h1v1l2 1l2-2h1v2l1 2l1-1l3-4l1 2l2 1l3-1l2 2h1l1 1l4-1v-2h4l2 1l5-3v2l5-1l1-1l2 1l5 4l6 1l3 3l2-2l4 1v12v20l1 3l3 3v6l4 4l1 5h1v7l-4 6l2 3l-2 1l1 3v4l-2 4v1l-2 1l1 2l1 1h-3l-9 4l-3 1l-2 2h-1l2-3h2l1-1h-3l-1-1l1-2l-1-2h-1l-2 1l-2 3v2l4 3h1v1l-2 2l-5 4l-4 4l-3 1l-5 3l-4 2l-5 2l-4 2l4-3v-1v-2h-2l-1 1l-2 1l-2-1v-1h-2l1 2h1l2 1l1 2v1l-4 1l-2 1l-1-2l-1 2l1 2l-3 2h-1h-1l-1 2l-1 3l-2 1h-2l-1 1v1l1 1l1 1l-2 3v3l-1 2l-1 1h-3l2 1l2-1l-1 3h-1v1l1 2l-2 1v3l2 1v3v2l-1 1v1l2 1v1v3l1 2l3 3h-3l-1 2v1h-1h-1l-4-4l-2-1h-7l-3-1l-4-3l-1-1l-2 1l-4-3l-5-2v-1l-1-2l-1-4l-1-2l-2-2v-1l-1-1v-2v-3l-1-1v-3l-1-3l-1-2h-1l-4-3v-2l-1-2h-1l-1-2l-2-2l-3-2v-2l-1-1v-2h1l-2-2l1-1l-2-2v-2l-3-5v-2l-2-3l-5-4v-2l-3-1v-2h-2v-1l-3-3l-1-1l-1 1h-3l-2-1h-5l-4-2l-1 2l-2-1l-4 2l-1 2l-2 4l-2 4l-1 1h-1l-1 2l-1 1v1h-3l-2-1h-1l-2-3h-4l-1-3h-2l-2-1l-3-3v-1l-2-1h-1l-3-3v-2l-2-4v-2l-1-1l1-2v-2l-3-4v-4l-2-2v-1h-1l-1-1l-2-2h-1l-2-2v-1l-3-2l-1-2l-2-2l-3-4l-3-2l-2-2v-1l-2-1l-1-4l-3-1zM457 567h1l-1-4l-3-13v-8l5-10l6-8l7-6h-1l-2 1l-4 2l-1 1l-8 12l-3 8v9l4 12z"],
  ["SD", "M397 126l46 2h29v3l-1 2l-3 2v1l1 2l1 2l2 1l2 2v39h-3v2l2 1l-1 1l-1 1l1 1l1 1l1 2l-2 5l-1 4l1 1l1 2v1h-1h-2l-1-3l-1-1l-6-2l-1-1l-2-1l-1 1l-1-1h-1h-1h-1l-1 1l-2-1l-1 2h-2l-2-2h-2l-3-3l-38-2l-52-3l4-44l2-21z"],
  ["ND", "M465 69l-1 2v2v5v1l2 9l2 3v14l1 2v6l3 7v6v2h-30l-46-2l-39-3l5-67l45 4l55 1z"],
  ["NE", "M403 191l38 2l3 3h2l2 2h2l1-2l2 1l1-1h1h1h1h1h1h2l1 2l6 2l1 1l1 3h2h1l1 1v2l1 2v1l1 4l2 4v4l3 5v6l2 1v3v3v2l2 5l1 1v1l2 4l4 6h-33l-44-1l-36-2l2-22l-33-2l3-44z"],
  ["OK", "M502 399l-5-4l-2-1l-1 2h-5l-1-2l-5 3l-1-1h-4v2l-4 1l-1-1h-2l-2-2l-2 1l-2-1l-1-2l-3 5h-1l-1-1v-2l-1-1l-2 2l-2-1v-1h-1l-3-2l-3 3l-2-1v-2h-2l-2-3l-3-1l-2 2l-3-2h-1h-2l-4-1h-2l-1-1l-1-3l-2-2l-1 2l-1-1l-2-1l-1 1h-1l-3-3l-2-1l1-43l-53-3l1-11l17 1l67 3h62v11l5 25l-1 39z"],
  ["KS", "M459 260l-44-2l-36-2l-4 67l67 3h62v-48h-3l-3-5l-2-3v-2l3-3v-1l-2-2l-1 1l-2-1l-2-3z"],
  ["MN", "M465 69l-1 2v2v5v1l2 9l2 3v14l1 2v6l3 7v6v2v3l-1 2l-3 1v2l1 2l1 2l2 1l2 1v40h28l36-1l19-1l-1-4l-1-3l-2-3l-3-1l-5-3v-4l-7-3v-1h-3l-2-3l-2-1v-5l-1-2l1-5l1-2v-3l-2-1h-1v-2l2-6l6-4v-13l1 1v-1v-1h1l2 1l-1-3l5-3l3-3l1-1l5-6l6-6l4-2l6-3l8-4l-1-1l-3 1h-3l-1-1l-1-1l-10 1l-1-3h-2l-2 1l-3 3h-4l-2-1l-1-2l-4-1v-1l-1-1h-1l-3 1l-9-6h-3l-1-1l-3 2l-1 1l-3 1h-2v-2v-1h-6l-1-1h-2h-1l-3-2l1-1l-1-3l-1-1v-3l-1-3l-2-1h-3v8l-31-1z"],
  ["IA", "M557 183l2 2l1 1l-2 3v3l2 5l3 2h3l1 3v1l2 1l2 2v1l1 1h1l3 4v2l-2 4l-1 1v2l-2 2l-4 2h-2l-3 1l-1 4l1 2h1l1 1v4h-1l-1 3v2l-1 1l-1 1h-2l-1 2l1 1l-1 2v1l-2-1l-1-1v-2l-2-1l-14 1l-28 1h-26l-1-5v-2v-3v-3l-2-1v-6l-3-5v-3l-2-5l-1-3v-2l-1-2v-2l-1-1v-1l-1-2l-1-1l1-4l2-5l-1-2l-1-1l-1-1l1-1l1-1l-2-1v-2h3h28l36-1l19-1z"],
  ["MO", "M555 249l-1-1v-2l-2-1l-14 1l-28 1h-26l2 1l-1 2l3 3l3 7l3 3h2l1-1l2 2v1l-3 3l-1 2l3 3l3 5h3v48v11l40-1l39-2l2 3v2l-2 2l-3 5l12-1l1-2l1-1l-1-1l-1-1h2l1-1l-2-1l2-1v-1l-1-1v-1l-1-1l1-1h1v1v1l1 1l1-1l1-3l1 1l1-1l1-4l-1-1l1-2v-1h-1h-3l-1-2l-2-4v-2h1v-2l-2-1l-1-3l-2-4l-5-1l-8-7v-3l3-7l-1-2l2-1v-2l-3-1l-3-1l-4 1l-1-2l1-2l-1-2l-9-9l-2-1l-2-6l-2-6l2-3z"],
  ["AR", "M584 367l1-2h1l1-1h-1l1-2l-2-1l1-1v-1h-1l1-1l1 1v-2v-1v-1l2 1v-1l1-2v-1h-1h-1l1-1l1-1h1l1-1l-1-1v-1h2l-1-1v-1l-12 1l3-5l2-2v-2l-2-3l-39 2l-40 1l5 25l-1 39l2 2l3-1h4v12l52-1l1-2l1-3l-2-2v-2l1-1v-1l-2-1l1-1l-1-1l2-7l3-2v-1l-1-1l3-6h2l1-1v-5l3-5h2v-3z"],
  ["LA", "M603 473l-2-2l1-1l-5-7l1-5l1-1v-1l-36 2l2-12l2-5l6-9l-2-2h2v-3l-2-3v-2l-1-1l-2-7l1-1l-52 1v20l1 4l3 2v6l4 4l1 5h1v7l-4 6l2 3l-2 1l1 3v4l-2 4v1l-2 1l1 2l1 1l2-1l5-1h6l10 3l8 1l1-1h2l5 2h2l1-2l-5-2l-2 1h-1l-1-2l3-2h2v1h1h3l1 2l1 1l1 2l4 1l2 1v1h-1l-2 2l2 1l5 1l3 3l5-1h-4v-1h3v-2l1-1v-1h1v2h3v-2h1v3h2l-2 2l3-1l2-1l2-3l-2 1v-1v-1v-3h2h1l1-1l1 2l-1 2h3l5 1v2l2 1h3l1 1l2-1l1-2v-2h-2l-1-1l-1-1l-3-1h-3l-4-2v-2l1-1h3l-4-1l1-1h3l3-4l-3-2l1-1l-1-1h-1l-2 2v2l-1 1h-1l-1-1h-2v-2l1-1l1 1l2-2v-1zM592 470l2 1l1 1h2l2 1v2l-1-1l-2 1v1l-3 1h-2l-4-1l1-2l2-2l1-2zM588 471v1l-2 2h-1v-2l1-1z"],
  ["WI", "M611 144l-3 1v2l-2 4v3h1l1-2l2-1l1-4l4-1l1-4v-1l1-2l1-1v-1l1-1h2v2h-1v1v2l-1 1l-1 4l-1 1l-3 7v4l1 2v1l-3 2l1 2l-1 3v2v3l-1 4l-1 5l1 2h-1l1 2v1l1 1v3l1 1v3v4l-46 3l-1-3l-3-1l-3-1l-2-6v-2l2-3l-1-1l-2-2v-3l-1-4l-1-3l-2-3l-3-1l-5-3v-4l-7-3v-1h-3l-2-3l-2-1v-5l-1-2l1-5l1-2v-3l-2-1h-1v-2l2-6l6-4v-13l1 1v-1v-1h1l2 1h3l7-3v-1h1l1-1v1l2-1l2-2v1l1-1l3 1l-1 2l-1 1v2l-1 1v1l2-1v-1l4 2h2l1 1l3 4l17 4l2 1h4l1 1h2h5l2 2l-1 1v1h4l1 2l1 4l-2 3h2l1-1l1 1l-1 3l1 2h1zM562 107h-1l-1 1v1l1-1zM563 106h-1v1h1zM562 104v1h1h1v-1zM565 101l-1 2l2-1v-1zM623 133h-2v2l1 1z"],
  ["IL", "M624 266l-1 5v2l2 4v1l1 2l-1 2l-1 2l-2 4l-3 6l-1 7h-1l1 2v1l-2 2v1l2 3l-4 1l-1 1h-1h-1v3l1 2v3h-1l-7-3l-4 4v1h-3l-1-1l-2-4v-2h1v-2l-2-2l-1-2l-2-4l-5-1l-8-8v-2l3-8l-1-1l2-2v-1l-3-1l-3-1l-4 1l-1-2l1-2l-1-2l-9-9l-2-1l-2-6l-2-6l2-3l1-1v-2l-1-1l1-2h2l1-1l1-1v-2l1-3h1v-4l-1-1h-1l-1-2l1-4l3-1h2l5-2l1-2v-2l1-1l2-4v-2l-3-4h-1l-1-1v-1l-2-2l-2-1v-1l46-3v5l4 4l1 4l1 4z"],
  ["MS", "M624 469h-5l-3-2l-7 3l-1-1h-1v2h-1l-2 3h-1l-1-1l-1-2l1-1l-5-7l1-5l1-1v-1l-36 2l1-12l3-5l6-9l-2-2h2v-3l-2-3v-2l-1-1l-2-7l1-1l1-2l1-3l-2-2v-2l1-1v-1l-2-1l1-1l-1-1l2-7l3-2v-1l-1-1l3-6h2l1-1v-5l3-5h2v-3l38-3l1 2l-1 67l4 33z"],
  ["MI", "M663 210v1l22-3v-1l4-6v-5l1-2l2-1l2-7l1-1l1 1l-1 1v1h1l2-1v-10l-1-2l-2-4v-2l-2-5v-2l-1-3l-2-3l-3-1l-5 3l-3 5v1l-3 3h-1l-3-3v-3l1-2h2l1-2l1-4v-1h2v-2v-9v-2l-1-1l-2-1v-2h1l1 1v-2l-2-3v-1l-2-1h-2l-8-3l-1-2h-3h-2l-4-2h-1v1h-3h1v1l-2 2v2l1 2h2v1h-2h-2l-3 3v2l1 6l-2 3v-4v-1l-1 6l-1-3v-2v-1v-1v-1l1-1v-2l-2 1l-1 3l-1 1l-1 2h-2v1h-1v2v2l-3 1v1l1 2v5l-1 4l-2 3l1 1l1 4l-1 2v2l2 4l2 5l1 2l2 7v8l-1 4l-2 4l-1 3l-2 3l-1 1zM568 113l3 4l17 4l1 1h4l1 1h2l5 1l2 1l-1 1v1l4 1l1 1l1 4l-2 3h2l1-1l1 1l-1 3l1 2h1l1-2l3-4l2-6l2-2l-1-2l1-1l1 2v2l2-2l1-3l2 1l1-2v1v1l-1 1l-1 2l1 2l1-1l1-2l1-2h1v-2l2-2l8-1l2-3h4l4 1l4 3h1v-4l5 1h1l3-1l2 1h2v-1l-1-1h-2l-1-1l1-2h-1h-3v-1l1-1l1 1l1-2h-1l1-1l-2-1v-1l1-2h-2l-1 1h-2l-1 2h-2v-1h-2l-1 1h-1v-1l-3 1v-5l1-2l-2 1h-2l-4 3h-6l-4 1l-2 1l-2 1l-2 2l-1 1v-2h-1v1v1h-1h-1v1l-2-2h-1l-2 1h-3v-1l-2-2l-2-2l-1-2l-2-1h-4l-1-1h-1h-1l-2 3l-1 1l-1-1v-1l1-2l3-5h1l2-2l1-2h3v-1v-1v-1l-5 1h-2l-2 1l-2 2l-1 2l-2 1l-3 3l-1 2l-7 4l-4 1h-2l-2 3l-2 1l-4 2zM668 117h4l1-1l-1-2l-1-1h-2l1 1h-2v1h-1v1zM593 75h-2l-3 2l-7 5l1 1l2 1l2-2l-1-1l3-1h1l3-2l-1-1zM634 138v1l2 1v-2zM634 141h1v1h-1zM655 119v1h1v-1zM660 122v-1h-2h-1h-1h1l1 1zM642 124v1h-1v3h1h1v-1v-2v-1z"],
  ["IN", "M629 215l-5 2l-5-1l5 50l-1 5v2l2 4v1l1 2l-1 2l-1 2l-2 4l-3 6l-1 7h-1l1 2h1l1-1l-1-1l5-1v1l1 1l1-1l-1-2h2h1l2 1l3 2l2-3l4-2l3 3l1-2l1-3l3-2l1 1l2 2l3-1h1v-4l2-3l5-5v-2l1-3l2 1l7-5v-2l-2-2l1-2l-7-57v-1l-32 3z"],
  ["AL", "M643 467v-7v-1l-2-1l-3-3l1-2l49-6l-1-2l-2-1v-2v-6l-2-6l1-2v-4l2-4v-1l-2-1v-3l-2-2l-3-6l-12-46l-46 4l1 2l-1 67l4 33h1h1h1h1l2-4v-2l1-1h1l4 7v1l-4 2h4l5-2z"],
  ["TN", "M621 365l46-4l23-3v-5l1-1h2l1-1l1-4l4-3h4l3-3l1-1l4-3l1-3l4-3h1v1l1 1l1-1l1-2l3-3l3 2l2-6l2-1h1v-5v-1l-4 1v1l-29 3l-6 2l-20 1l-6 1l-17 1l-3 1l-22 2l-1-1h-4l2 3l-1 1l-23 2l-1 1l-1-1h-1v1l1 1v1l-2 1l2 1l-1 1h-2l1 1l1 1l-1 1l-1 2v1l1 1h-2v1l1 1l-1 1h-1l-1 1l-1 1h1h1v1l-1 2v1l-2-1v1v1v2l-1-1l-1 1h1v1l-1 1l2 1l-1 2h1l-1 1h-1l-1 2l-1 1z"],
  ["KY", "M692 323l-20 1l-6 1l-17 1l-3 1l-22 2l-1-1h-4l2 3l-1 1l-23 1l1-2l1 1l1-1l1-4l-1-1l1-2v-1l-1-1v-1l4-4l7 3h1v-3l-1-2v-3h1h1l1-1l4-1l-2-3v-1l2-2v-1l1 1l1-1l-1-2l5-1v2h1l1-1l-1-1v-1l2 1l1-1l2 1l3 2l2-3l4-2l3 3l1-2l1-3l3-2l1 1l2 2l3-1h1v-4l2-3l5-5v-2l1-3l2 1l7-5v-2l-2-2l1-2l1 1h3l1-1l3 1l3 4v1l4 1l2-1l2 2l2 1v-1l2-1l3 1h1h1h1l1-2l3-2l1 1l1 3l3 1l1 2v2l1 1l-1 3l2 2l1 1h1v1l4 6h2l1 2h1h2l-5 7l-3 1l-3 3v2l-3 1v2l-1 1l-2 1v2h-1l-7 4zM594 334l-1-1l1-1h1v1v1z"],
  ["OH", "M686 209l2-1l3 2h2v1h1l1-1l2 1h1v1h-3l-2 1l2 1l2-2h2l2 2l2-1l2-1l4-2l5-1l5-6l4-3l9-5l5 30l-2 1l1 2v3v2l-1 3v5l-1 4l1 1l-1 2l-1 1l-2 3l-2 2l-2 2l-1-1l-2 1v2h-1l-2 2l1 2h-1l1 2v1l-1 1h-1l-1 1v-2l-2-1l-1 3v2l-1 1l1 4l-2 1v3h-1l-4 1l-1-2l-3-1l-1-3l-1-1l-3 2l-1 2h-1h-1h-1l-3-1l-2 1v1l-2-1l-2-2l-2 1l-4-1v-1l-3-4l-3-1l-1 1h-3l-1-1l-7-57l22-3z"],
  ["GA", "M762 414v2l-4 6h-2h2v2l-1 2l-1 6l-2 6l1 2v5h-3l-4-1h-2l-2 1v2l1 3v4h-2l-1-1l-1-3l-50 3l-3-6l-1-2l-2-1v-2v-6l-2-6l1-2v-4l2-4v-1l-2-1v-3l-2-2l-3-6l-12-46l22-3l22-3v2l-2 1l-2 3l1 2l6 3h2l3 4l1 2l4 5l3 2h1l2 1l1 3l2 1l2 1l3 2v2l3 3l5 2l3 7l1 2l3 2l3 5l1 3l4 1z"],
  ["FL", "M752 445l-4-1h-2l-2 1v2l1 3v4h-2l-1-1l-1-3l-50 3l-3-6l-49 6l-1 2l3 3l2 1v1v7l-1 1h1l1-1l11-2l9-1l8 2l8 5l3 1l2 2v3h2l2-1h3l2-1l3-2l3-3h1h2v-1v-1l-1-1l2-1l5-1l1 1h1l3 1l3 2l1 2l1 1l3 1v3l2 2h1l2 1l1 2h1l1 2v1l1-1h3l1 1l1 1v1l3 2v10l-2 6l1 1v3l-1 2l1 1l2 2v2l1 1v-2l1-1l1-3l-3-2l3-1v3l2 1v-2h1v1v1l-3 4v1l-2 2v1l4 4l5 8l2 2v1l3 5l2 1l1-2l-2 1l-3-5v-1l2-1v-1l-1-2l1-1v1l1 1v4l-1-1l-1 1l1 2l1 2h2l2 1l2 2l2 5l3 5v-1l3-1l3 1l1 2l3 4v1l2 3v3l2 1h2l3-1h1h1l2-1l1-1h1l2-2l2-2l-1-3v-1l1-4v-1l1 2l1-2l-1-7v-10l-1-7l-1-2l-7-11l-5-9l-2-4l-1-3l-1-4h1v-1l-1-2l-4-4l-7-10l-6-10l-4-11l-1-3l-1-1l-1-4zM761 580h2l-1-1zM768 579v-1h2l4-4h1l2-1l1 1l1 1l-2 1h-3l-3 3zM785 571l-3 1l-1 2h2zM789 568h-1l-1 2h1zM798 552l-2 6l-1 1l-1 3l-1 1l-1 2l-2 2v1l3-3l2-3l1-2l2-5z"],
  ["WV", "M723 298v1h1v2l5 2h2l2-2l1-1l3 1l5-2l1-1h-1v-2l2 1l4-3l1 1l2-2v-1l2-2l-2-1l1-4l4-6l-1-2l3-2l-1-1l2-2v-5l2 1l1 2h3l1-1l3-9l2 1l1-2l1-1l1-2l1-1l1-2l1-1v-2l1-3l-1-1v-1l10 5v-2l1-2v-1h-1v-2h-1v-1l-1-1v-1h-3l-2-1h-1l-1 1h-1l-2 3l-3 1l-2-1l-3 4l-2-1l-3 4l-1 2l-2 1l-2-11l-17 3l-3-20l-2 1l1 2v3v2l-1 3v5l-1 4l1 1l-1 2l-1 1l-2 3l-2 2l-2 2l-1-1l-2 1v2h-1l-2 2v2h-1l2 2v1l-1 1h-1l-1 1v-2l-2-1l-1 3v2l-1 1l1 4l-2 1v3h-2l-3 1v2l1 1l-1 3l2 2l1 1h1v1l4 6h2l1 2h1h2z"],
  ["SC", "M772 350l-19 3l-1-3l-3-3l-1 2h-1v-2l-23 2l-7 4h-2l-4 2v2l-2 1l-1 3v2l6 3h2l4 4v2l4 5l3 2h1l2 1l1 3l2 1l2 1l3 2v2l3 3l5 2l3 7l1 2l3 2l3 5l1 3l4 1l1-2l2-1l1-2l3-2v-3l-1-1h1h1h1l2-2l3-2l2-3l5-5l-1-1l1-2h1v1l1-1h1l1-1l2-2v-6l1-2l3-6l3-3l2-1z"],
  ["VA", "M835 265l-1 3v1l1-1zM800 258l-1-1h1l1-1l1-1v-1l-1-1v-1h-1l-1-1h-1h-1v-1h-1h-1h-1l-1-1h-1v-1h1v-1l-1-1h-1h-1l-2-1v1l-1 2v2l-10-5v1l1 1l-1 3v2l-1 1l-1 2l-1 1l-1 2l-1 1l-1 2l-2-1l-3 9l-1 1h-3l-1-2l-2-1v5l-2 2l1 1l-3 2l1 2l-4 6l-1 4l2 1l-2 2v1l-2 2l-1-1l-4 3l-2-1v2h1l-1 1l-5 2l-3-1l-1 1l-2 2h-2l-5-2v-2h-1v-2l-5 6l-3 1l-3 3v3l-3 1v2l-1 1l-2 1v1l-1 1l-7 4l29-3v-1l4-1v1l30-4l39-7l29-6l-1-1h1l1 1v-2l-1-2l2 2l1 2v-2l-4-5v-1v-1l-2 1l1 1h-1v-1l-1 1l-1-1h-2l1 2h-1v-1l-1 1h-1l-1 1v-1v-2h-1l-2-1v-2l-1-1l-1 1l-1-1l-2 1v-1l1-1l1 1l2-1l1 1v1l2 1l1 1h1v1l2-1v-3l-1 1h-1l2-1l-1-1l-1 1l-1-2l-1 1l-3-2l-1-2l3 2l1 1l2-1l-2-1l1-1h-1h1l-1-1l1 1l1-1v1l1 1h1v-1l-1-3h-1h-1l1-2h-2h-1h-1h-2v-2l-2-1l-2-2l-3-1l3 1l1 1l2 1l3 2v-1l1 1h2v-4l-1-1l1 1v-2l-3-1l-1-1h-2l1-1h-2v-1h-2v1l-1-1h-2h-1l-1-1l-1-1v-2h-1l-1 1l-1 1h-2l-1-1l1-3v-3l1 1zM822 270h1v-1h-1zM830 284l-1 3l1-1zM828 269v2l-2 1h1l-1 4v8l2 4v-2l1-3l-1-2l1-1v-1l1-1h-1l1-1l1 1l-1 1v4l1-2l1-3v-3l-1-2l1-2l1-2v-2v-1l-4 1l-1 1z"],
  ["NC", "M829 300l-29 6l-39 8l-30 3v5h-1l-2 1l-2 6l-3-2l-3 3l-1 2l-1 1l-1-1v-1h-1l-4 3l-1 3l-4 3l-1 1l-3 3h-4l-4 3l-1 4l-1 1h-2l-1 1v5l21-3l4-2h2l7-4l23-2v2h1l1-2l3 3l1 3l19-3l25 17l4-2l3-1h2l1 2v-2l1-5l2-4l5-6l4-4l6-2l2-1l1 1l1 1l3-7l4-5h-1l-4 6h-1l2-3v-1l-2-1l1 2h-2l-1-2l-1 2h-2l1-2l1-2v-3h-2l1-1h1h2h1h3l2-2v-3l1-2h1l2-1l-1-4l-2-3l-3-1l-1 2v-1h-3l-1 1l-2 1v-1h-1l-2 2h-3v-1l1-1l1 1h1l2-3l4-1l2-2h2l1 1l1 1v-2v-1l-3-4v-1l-1 1l-1-1zM836 331l3-2l4-4v-3v-3l-2-5l2 2l1 3v8h-2l-3 2l-3 3zM838 312h-1v1l3 2l-1-2zM841 314l-2-3l-2-3l-2-3l-2-5h-1l2 4v1l4 6l1 2z"],
  ["PA", "M826 189l-2 1l-3-2l-3-6h-2v-2l-2-1l-70 14l-1-6l-4 3l-1 1l-3 3l-3 1l5 30l3 20l17-3l61-12l1-2l2-1h1h2l1-1l2-1l2-3l1-2l4-3l-5-3l-2-1l-1-3l-3-1v-4l1-1l1-2l-2-1l3-6v-2l2-2z"],
  ["MD", "M823 269v-1h-1v1zM835 265l1-2v-2l-1-1v1l-1 2v2l-1 1l-4 1l-1 1h-1l-1 1l-1 1v-3l-1-1l1-1l-2 1v-2l1-1h-2v-1v-1l-1-1v2v1h-1l-1 1l-2-1v-2l-1-1l-1-1l1-1l-1-1v-1l1-1h1l-1-1h-1l-1 1v-3l1-1h1v-1l-1-1l-1 1l-1 1l-1-1v-2l1-1l1 1l1-1v-2l-1 1l-1-2v-1l1-3l1-1h1v-1v-1v-3l-1 1l-1 1l1 1l-3 4v-1l-1 1l-1 3h-2l2 1l1 1v1l1 1l-1 1v1v3l-1 1l1 1l1 3l1 2l2 1v3l2 2v1v1h-1l-1-1h-1h-1l-1-1l-2-1l-1 1h-1l-2-1l-1-1l-1-1h-1h-1l-1 2l-1-1l-1-3l1-2v-1l-1-1h1l1-1l1-1l1-3l-2-2l-1 2l-1-1h-1h-1v-1h-1h-1h-1l-1-1h-1v-1h1v-1l-1-1h-1h-1l-2-1h-1v-2h-1v-1l-1-1v-1h-3l-2-1h-1l-1 1h-1l-2 3l-3 1l-2-1l-3 4l-2-1l-3 4l-1 2l-2 1l-2-11l61-12l7 27l11-2v5v3zM821 264l-1 1l1 1l2 1l-1-1z"],
  ["DC", "M804 252l-3-2l-1 2h1v1l1 1v1z"],
  ["NY", "M873 182h-1l-1 1zM842 204l1 1h1h1l1-1h2l3-1l5-2l-1-1l-2 1l-2 1l1-1l2-1l1-1h1l4-2l-4 3l5-2l1-3h2l4-3l3-3l3-2l1-1l-1-1l-1 2l-1 1l-1-1l-2 1v1h-1l1-1l-2-1v1h1v1l-2 3h-2l1-2l1-1v-1l2-2l1-1h1h-1h-1l-2 1v1l-2 2v1l-2 1l-7 2v1l-1 1h-2l-1-1v1h-1v1h-2h-1v2h-1v1v1h-2l-2 2zM842 204h-2v1l-1 2l1 1l2-3zM831 109v2h1v2v3l3 2l-1 3l1 2l-1 1v3l3 7l-1 2l1 2l1-1l2 1l3 14v2l1 1l-1 15l1 1l3 17l1 1l-3 4l2 2l-2 3l-1 2l-2 2v-1l1-6l-15-4l-2-2l-2 1l-3-2l-3-6h-2v-2l-2-1l-70 14l-1-6l4-4l1-2l4-2v-2l3-2l1-2l-2-3h-2l-2-3v-4l8-3l8-2h4l4 2v-1l2-1l4-1h3l2-1l3-3l2-3h2l1-1v-3l-1-3h-1l2-2v-1h-2l-2-2v-3l6-6l1-2l4-7l5-6l3-2h2l21-5z"],
  ["DE", "M822 227h-1l-2 1l-1 2l8 27l10-2l-2-8l-1 1l-3-3l-1-1l-1-1l-1-4l-2-2l-1-1l-1-1l-1-3l1-3l1-2z"],
  ["NJ", "M843 195l-15-4l-2 2v2l-3 6l2 1l-1 2l-1 1l1 4l2 1l1 3l2 1l5 3l-4 3l-1 2l-2 3l-2 1l-1 1l-1 2v2v1l1 3h1l2 2l2 1h2v2h1l1-2l1 1h2l-1 3l1 2h1l2-4l2-5l2-3l1-3l-1-1l2-3v-2l-1-1l2-2l-1-4v-8l-1-2v2h-1h-1h-1h-1l-1-1l1-2v-1l1-1l1-2z"],
  ["VT", "M859 102l-1 4l2 3v1v2l-1 2h-2v2l-2 1l-1 1l1 3v3v1l-1 2l1 2l-2 2l1 2l-1 1l1 5v1v3l1 2v2l-1 2v1l2 3l-12 2l-1-1v-2l-3-14l-2-1l-1 1l-1-2l1-2l-3-6v-4l1-1l-1-2v-2l-2-3v-3v-1l-1-1v-2v-2l27-7z"],
  ["CT", "M874 179v-1l-3-12v-1l-15 4l-1 1l-1-1l-10 2l3 17l1 1l-3 4l2 2l5-5l2-1l3-3h1l3-1h2l6-3l2-1l1-1l2 1z"],
  ["NH", "M863 94h-2l-1-1l-2 1v6l1 2l-1 4l2 3v1v2l-1 2h-2v1l-2 1l-1 2l1 3v3v1l-1 2l1 2l-2 2l1 2l-1 1l1 5v1v3l1 2v2l-1 2v1l2 3l18-4l1-2l1-1l2-1v-1l2-1h1l1-5l-2-1l-1-2l-3-2l-1-4l-12-37z"],
  ["MA", "M900 174h3h1v-2l-2-2l1 1l-2 2h-2v1zM891 176l-1-1h1v-2l2-1v-1l1 1h1h1v2h-1l-3 1zM856 153l18-4l1-2l1-1l2-1v-1l2-1h1l2 3l1 1l1-1l1 1v1l-3 2v1l-1 1v1h-1l1 1l-1 1l1 1h1v-1l1 1h2l2 2l1 3h1l1 1l1 2l1 1h2h2v-1l2-1l1-1l-1-2v1l-2-3h-1l-1-1l1-1l2 1l2 2l1 3l2 3l-1 3v-2l-1-1l-4 2h-1l-1 1v1l-2 1l-2 2l-2 2h-2l4-3v-2v-1l-1-1h-1v1l-1 2h-1v1v1l-1 1h-1v1l-2-3l-1-1l-3-2v-2h-1l-1-2l-6 2v-1l-15 4l-1 1l-1-1l-10 2l-1-1l1-15z"],
  ["RI", "M883 171l-1-1l-3-2v-2h-1l-1-2l-6 2l3 12v1v2l6-4v-3l-1-1v-2h-1l1-1v-1h1l1 2v1l-1-1l1 2v1l-1-1v2h1l1-1v-3l2 4l1-1zM879 183l1-1l-1-1l-1 1z"],
  ["ME", "M875 129l1 4l3 2l1 2l2 1h1l1-3v-3l1-1l1-3l-1-1l3-2l-2-2l1-3l1-2l1 3l1-2l2 1h1v-2l3-1v-3l3-1l3-3v-1h-1v-4v-1l1 2l1-1l-1-3h-1v2l-1-2l1-1h1l1-1v3h2l3 1v-1l-1-2l1 1v-3l1 1v2l2 1l1-1v-1h1v-2h-2l-2 1l2-2v-1h2v1l2 2v-2l2-1v-2v-1h1l2-1l1-2h2v-1v-1l1 1l1-1l2-4v-2l-1-2l-3-4h-2l-1 3l-3-3l1-1v-2l-2-4h-1h-5l-1-4l-8-26l-7-3h-3l-7 6l-2-1l-1-4h-3l-7 20l1 6l-2 2v5l1 4h1v2l-2 4l-1 1l-2 3v7l-2-1l-2 1zM910 104l-1 1v1v-1l1 1h1h1l-1-1v-1zM908 107l-1 1v1h1zM905 105l1 1l1 1v-1v-2l-1-1l-1 1zM904 110l-2-2l2-2h1v1l1 1v1l-1 1z"],
];

/** Inset frame lines around Alaska and Hawaii. */
const INSET_LINES = "M215 493v55l36 45M0 425h147l68 68h85l54 54v46";

interface UsMapProps {
  /** Two-letter codes to fill in gold. */
  highlighted?: readonly string[];
  /** Accessible name for the map (role="img"). */
  label: string;
  className?: string;
}

export function UsMap({ highlighted = [], label, className }: UsMapProps) {
  const active = new Set(highlighted.map((code) => code.toUpperCase()));
  const last = STATE_PATHS.length - 1;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 959 593"
      className={cn("map-draw h-auto w-full overflow-visible", className)}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/*
        A darker, wider underlay of the same outlines keeps the gold legible over the photograph.
        Plain strokes, no filters: it draws with the same dash animation and costs no extra repaint.
      */}
      <g aria-hidden="true" className="stroke-obsidian/75 [stroke-width:4.4] sm:[stroke-width:3.8] lg:[stroke-width:3.4]">
        {STATE_PATHS.map(([code, d], index) => (
          <path
            key={code}
            d={d}
            pathLength={1}
            style={{ "--i": (index / last).toFixed(3) } as CSSProperties}
            className="map-state"
          />
        ))}
      </g>
      <g className="[stroke-width:2.2] sm:[stroke-width:1.8] lg:[stroke-width:1.5]">
        {STATE_PATHS.map(([code, d], index) => (
          <path
            key={code}
            d={d}
            data-state={code}
            pathLength={1}
            style={{ "--i": (index / last).toFixed(3) } as CSSProperties}
            className={cn(
              "map-state transition-[fill] duration-300",
              active.has(code) ? "fill-gold/85 stroke-obsidian/80" : "fill-obsidian/[0.18] stroke-gold/[0.85]",
            )}
          />
        ))}
      </g>
      <path
        d={INSET_LINES}
        strokeDasharray="2 6"
        className="map-insets stroke-bronze/70 [stroke-width:1.6] lg:[stroke-width:1]"
      />
    </svg>
  );
}
