/* نَسيج — second-store adaptation test. 12 of 400 products, "ordinary photos"
   (amateur flat shots) rendered as simple garment silhouettes on uneven
   backgrounds — deliberately less polished than دار سَحَر's art direction. */
window.NASIJ = (() => {
  const collections = [
    { id:"abaya", ar:"العبايات", chAr:"الفصل الأول", desc:"قصّات يومية ورسمية — كريب وندى وحرير." },
    { id:"thobe", ar:"الأثواب", chAr:"الفصل الثاني", desc:"قطن صيفي وصوف شتوي، تفصيل ياباني وكلاسيكي." },
    { id:"dress", ar:"الفساتين", chAr:"الفصل الثالث", desc:"قطع مناسبات بأسعار معقولة." },
    { id:"acc",   ar:"الإكسسوارات", chAr:"الفصل الرابع", desc:"حقائب وطرح وأحذية تُكمل الإطلالة." },
  ];

  const P = (id, ar, en, col, price, cmp, shape, tone, badge, desc) => ({
    id, ar, en, col, price, compareAt: cmp, shape, tone, badge, desc,
    sizes: [{ar:"S",p:price},{ar:"M",p:price},{ar:"L",p:price},{ar:"XL",p:price}],
    conc: "ملابس",
  });

  const products = [
    P("abaya-daily","عباية يومية كريب","Daily Crepe Abaya","abaya",349,420,"abaya","#2b2b2e",null,"كريب خفيف بقصّة مستقيمة — قماش لا يتجعّد ويناسب الدوام والمشاوير."),
    P("abaya-silk","عباية حرير مطرزة","Silk Trim Abaya","abaya",690,null,"abaya","#1c1c20","الأكثر مبيعاً","حرير ندى بتطريز يدوي على الأطراف — للمناسبات الرسمية."),
    P("abaya-color","عباية ملوّنة زيتي","Olive Abaya","abaya",399,null,"abaya","#5c6248","جديد","أول عباية ملوّنة في المتجر — زيتي هادئ بأزرار مخفية."),
    P("thobe-summer","ثوب قطن صيفي","Summer Cotton Thobe","thobe",240,290,"thobe","#f2f0ea",null,"قطن ممشط خفيف — ياقة سعودية وأكمام كبسة."),
    P("thobe-wool","ثوب صوف شتوي","Winter Wool Thobe","thobe",420,null,"thobe","#e8e4da",null,"صوف خفيف الوزن بلون رمادي فاتح — تفصيل شتوي."),
    P("thobe-jp","ثوب تفصيل ياباني","Japanese Cut Thobe","thobe",380,null,"thobe","#f6f3ec","جديد","قصّة يابانية بكتف ساقط — بدون ياقة."),
    P("dress-evening","فستان سهرة طويل","Evening Dress","dress",780,920,"dress","#6e2f3a",null,"فستان سهرة بقماش مطفي — قصّة A بأكمام واسعة."),
    P("dress-day","فستان يومي مربعات","Day Dress","dress",320,null,"dress","#8a7a5c",null,"فستان يومي بنقشة مربعات هادئة."),
    P("bag-leather","حقيبة جلد طبيعي","Leather Bag","acc",520,null,"bag","#7a4a2e",null,"جلد طبيعي مدبوغ نباتياً — حجم يومي وسط."),
    P("heels-basic","حذاء كعب متوسط","Mid Heels","acc",290,340,"shoes","#3a3a3a",null,"كعب ٥ سم مريح للدوام — جلد صناعي."),
    P("scarf-chiffon","طرحة شيفون","Chiffon Scarf","acc",75,null,"scarf","#b8a898",null,"شيفون خفيف بأطراف مبرومة — ألوان أساسية."),
    P("bag-mini","حقيبة صغيرة كتف","Mini Shoulder Bag","acc",240,null,"bag","#2e4a3f","جديد","حجم ميني بسلسلة ذهبية خفيفة."),
  ];

  return { collections, products, col: id => collections.find(c=>c.id===id), prod: id => products.find(p=>p.id===id) };
})();

/* Garment silhouette — "photo on uneven wall" style */
window.garmentSVG = function (p, scale = 1) {
  const walls = ["#e6e1d6","#ddd8cc","#eae5da","#e0dacd","#e8e3d4"];
  const wall = walls[p.id.length % walls.length];
  const uid = "f" + p.id.replace(/-/g,"");
  const shapes = {
    abaya: `<path d="M100 40 C70 46 58 90 56 200 L72 202 C74 150 78 110 84 92 L86 230 L114 230 L116 92 C122 110 126 150 128 202 L144 200 C142 90 130 46 100 40 Z" fill="${p.tone}"/><ellipse cx="100" cy="238" rx="52" ry="6" fill="rgba(0,0,0,.14)"/>`,
    thobe: `<path d="M100 44 C74 48 64 88 62 200 L80 202 C82 140 86 104 90 90 L90 228 L110 228 L110 90 C114 104 118 140 120 202 L138 200 C136 88 126 48 100 44 Z" fill="${p.tone}" stroke="#d8d2c2" stroke-width="1"/><rect x="96" y="44" width="8" height="10" fill="#d8d2c2"/><ellipse cx="100" cy="236" rx="50" ry="6" fill="rgba(0,0,0,.12)"/>`,
    dress: `<path d="M100 42 C82 46 76 70 78 96 C80 120 70 150 62 210 L138 210 C130 150 120 120 122 96 C124 70 118 46 100 42 Z" fill="${p.tone}"/><ellipse cx="100" cy="218" rx="46" ry="6" fill="rgba(0,0,0,.14)"/>`,
    bag: `<rect x="62" y="110" width="76" height="66" rx="8" fill="${p.tone}"/><path d="M78 110 C78 82 122 82 122 110" fill="none" stroke="${p.tone}" stroke-width="7"/><rect x="92" y="132" width="16" height="8" rx="2" fill="rgba(255,255,255,.35)"/><ellipse cx="100" cy="184" rx="48" ry="6" fill="rgba(0,0,0,.14)"/>`,
    shoes: `<path d="M56 168 C60 148 78 140 96 150 C112 158 130 158 146 154 L148 176 C120 182 84 182 56 176 Z" fill="${p.tone}"/><rect x="128" y="176" width="10" height="26" fill="${p.tone}"/><ellipse cx="100" cy="208" rx="48" ry="6" fill="rgba(0,0,0,.14)"/>`,
    scarf: `<path d="M60 90 C90 70 130 80 140 110 C150 140 132 168 100 172 C72 176 52 150 56 120 C57 108 58 98 60 90 Z" fill="${p.tone}" opacity=".9"/><ellipse cx="100" cy="186" rx="44" ry="6" fill="rgba(0,0,0,.12)"/>`,
  };
  return `<svg viewBox="0 0 200 260" width="${200*scale}" height="${260*scale}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.ar}">
    <defs><linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="${wall}" stop-opacity=".85"/></linearGradient></defs>
    <rect width="200" height="260" fill="url(#${uid})"/>
    <rect x="0" y="0" width="200" height="14" fill="rgba(0,0,0,.04)"/>
    ${shapes[p.shape] || shapes.dress}
  </svg>`;
};
