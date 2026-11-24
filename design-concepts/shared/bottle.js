/* Shared parametric bottle art — stands in for merchant photography.
   Shape keyed by collection, liquid color keyed by product hue.
   mode: "dark" (rim-lit on black) | "paper" (illustration on cream) | "flat" (bold modern) */
window.bottleSVG = function (p, opts) {
  const { mode = "dark", glow = true, scale = 1 } = opts || {};
  const h = p.hue;
  const liq1 = `hsl(${h} ${mode === "paper" ? 42 : 55}% ${mode === "dark" ? 52 : mode === "flat" ? 55 : 46}%)`;
  const liq2 = `hsl(${(h + 18) % 360} ${mode === "paper" ? 48 : 62}% ${mode === "dark" ? 30 : 38}%)`;
  const glass = mode === "dark" ? "rgba(240,228,205,.10)" : "rgba(255,255,255,.35)";
  const edge = mode === "flat" ? "#141310" : mode === "paper" ? "#221d15" : "rgba(242,234,217,.55)";
  const capC = mode === "flat" ? "#141310" : `hsl(38 ${mode === "dark" ? 42 : 30}% ${mode === "dark" ? 58 : 40}%)`;
  const uid = `g${p.hue}${mode[0]}${p.id.replace(/-/g, "")}`;

  // body silhouettes per collection — viewBox 0 0 200 260
  const shapes = {
    oud:   { neck: [88, 42, 24, 18], cap: [78, 14, 44, 30, 3],
             body: "M52 96 Q52 84 64 82 L136 82 Q148 84 148 96 L152 206 Q152 226 132 228 L68 228 Q48 226 48 206 Z" },
    rose:  { neck: [90, 40, 20, 20], cap: [82, 12, 36, 30, 14],
             body: "M58 108 Q58 84 100 84 Q142 84 142 108 L146 196 Q146 226 122 228 L78 228 Q54 226 54 196 Z" },
    musk:  { neck: [92, 36, 16, 24], cap: [86, 4, 28, 34, 2],
             body: "M72 92 L128 92 L130 212 Q130 228 114 228 L86 228 Q70 228 70 212 Z" },
    amber: { neck: [88, 44, 24, 16], cap: [80, 20, 40, 26, 8],
             body: "M100 90 C148 90 158 132 158 170 C158 214 132 232 100 232 C68 232 42 214 42 170 C42 132 52 90 100 90 Z" },
    rare:  { neck: [90, 40, 20, 20], cap: [84, 8, 32, 34, 2],
             body: "M64 98 L100 82 L136 98 L146 140 L138 226 L62 226 L54 140 Z" },
  };
  const s = shapes[p.col] || shapes.oud;

  const defs = `<defs>
    <linearGradient id="${uid}l" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${liq1}"/><stop offset="1" stop-color="${liq2}"/>
    </linearGradient>
    <linearGradient id="${uid}e" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(255,255,255,.5)" stop-opacity=".0"/>
      <stop offset=".08" stop-color="rgba(255,255,255,.55)"/>
      <stop offset=".14" stop-color="rgba(255,255,255,.05)"/>
      <stop offset=".9" stop-color="rgba(255,255,255,.08)"/>
      <stop offset="1" stop-color="rgba(255,255,255,.35)"/>
    </linearGradient>
    <radialGradient id="${uid}g" cx=".5" cy=".55" r=".5">
      <stop offset="0" stop-color="hsl(${h} 60% 45%)" stop-opacity=".45"/>
      <stop offset="1" stop-color="hsl(${h} 60% 45%)" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="${uid}c"><path d="${s.body}"/></clipPath>
  </defs>`;

  const glowEl = glow
    ? `<ellipse cx="100" cy="150" rx="95" ry="105" fill="url(#${uid}g)" ${mode === "paper" ? 'opacity=".35"' : ""}/>`
    : "";
  const shadow = `<ellipse cx="100" cy="238" rx="${mode === "dark" ? 62 : 55}" ry="9" fill="rgba(0,0,0,${mode === "dark" ? .5 : .16})"/>`;
  const liquid = `<g clip-path="url(#${uid}c)">
      <rect x="40" y="118" width="120" height="120" fill="url(#${uid}l)" ${mode === "flat" ? 'opacity=".92"' : ""}/>
      ${mode !== "flat" ? `<ellipse cx="100" cy="118" rx="60" ry="7" fill="hsl(${h} 60% 62%)" opacity=".5"/>` : ""}
    </g>`;
  const body = `<path d="${s.body}" fill="${glass}" stroke="${edge}" stroke-width="${mode === "flat" ? 2.5 : 1.2}"/>`;
  const sheen = mode === "flat" ? "" : `<path d="${s.body}" fill="url(#${uid}e)" opacity=".8"/>`;
  const neck = `<rect x="${s.neck[0]}" y="${s.neck[1]}" width="${s.neck[2]}" height="${s.neck[3]}" fill="${glass}" stroke="${edge}" stroke-width="1"/>`;
  const cap = `<rect x="${s.cap[0]}" y="${s.cap[1]}" width="${s.cap[2]}" height="${s.cap[3]}" rx="${s.cap[4]}" fill="${capC}" ${mode === "flat" ? "" : `stroke="${edge}" stroke-width="1"`}/>`;
  const label = mode === "dark"
    ? `<rect x="72" y="150" width="56" height="34" fill="rgba(13,11,9,.55)" stroke="rgba(242,234,217,.4)" stroke-width=".6"/>
       <text x="100" y="166" text-anchor="middle" font-size="9" fill="#f2ead9" font-family="inherit" letter-spacing="1">دار سَحَر</text>
       <text x="100" y="177" text-anchor="middle" font-size="5.5" fill="rgba(242,234,217,.6)" font-family="inherit">${p.en.toUpperCase()}</text>`
    : mode === "paper"
    ? `<rect x="70" y="150" width="60" height="36" fill="rgba(244,239,230,.85)" stroke="#221d15" stroke-width=".8"/>
       <text x="100" y="166" text-anchor="middle" font-size="9" fill="#221d15" font-family="inherit">دار سَحَر</text>
       <text x="100" y="177" text-anchor="middle" font-size="5" fill="#221d15" font-family="inherit" letter-spacing=".5">${p.en.toUpperCase()}</text>`
    : `<rect x="70" y="148" width="60" height="38" fill="#faf9f6" stroke="#141310" stroke-width="1.5"/>
       <text x="100" y="164" text-anchor="middle" font-size="9" fill="#141310" font-family="inherit" font-weight="700">دار سَحَر</text>
       <text x="100" y="176" text-anchor="middle" font-size="5.5" fill="#141310" font-family="inherit" letter-spacing=".8">${p.en.toUpperCase()}</text>`;

  return `<svg viewBox="0 0 200 260" width="${200 * scale}" height="${260 * scale}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.ar}">
    ${defs}${glowEl}${shadow}${liquid}${body}${sheen}${neck}${cap}${label}
  </svg>`;
};

/* Abstract ambient art — layered gradient composition for heroes/editorial. */
window.ambientSVG = function (hue, mode = "dark", seed = 1) {
  const dark = mode === "dark";
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
    <defs>
      <radialGradient id="a${hue}${mode}${seed}" cx="${30 + seed * 20}%" cy="${35 + seed * 10}%" r="70%">
        <stop offset="0" stop-color="hsl(${hue} ${dark ? 45 : 55}% ${dark ? 26 : 78}%)" stop-opacity="${dark ? .9 : .8}"/>
        <stop offset=".6" stop-color="hsl(${(hue + 25) % 360} ${dark ? 35 : 40}% ${dark ? 14 : 88}%)" stop-opacity="${dark ? .7 : .5}"/>
        <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 30% ${dark ? 8 : 92}%)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#a${hue}${mode}${seed})"/>
    <circle cx="${500 - seed * 80}" cy="${140 + seed * 60}" r="${120 + seed * 30}" fill="hsl(${hue} 70% ${dark ? 50 : 60}%)" opacity="${dark ? .14 : .22}"/>
    <ellipse cx="${200 + seed * 60}" cy="${440 - seed * 40}" rx="220" ry="60" fill="hsl(${(hue + 30) % 360} 55% ${dark ? 35 : 65}%)" opacity=".18" transform="rotate(${-12 + seed * 8} ${200 + seed * 60} ${440 - seed * 40})"/>
  </svg>`;
};
