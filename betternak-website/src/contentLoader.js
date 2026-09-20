// Dynamic Content Loader for Betternak Website
// Fetches from /api/content (Admin API) or fallback to /content.json

export async function initDynamicContent() {
  let content = null;
  const sources = ['/api/content', '/content.json'];

  for (const src of sources) {
    try {
      const res = await fetch(src, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        content = json.data || json;
        if (content && content.general) break;
      }
    } catch (e) {
      // Continue to next source
    }
  }

  if (!content) return; // Keep default hardcoded HTML

  try {
    applyContent(content);
  } catch (err) {
    console.warn('Could not apply dynamic content:', err);
  }
}

function applyContent(c) {
  // 1. General & Meta
  if (c.general) {
    if (c.general.site_title) document.title = c.general.site_title;
    if (c.general.logo_url) {
      const logoEl = document.querySelector('#card-0 img');
      if (logoEl) logoEl.src = c.general.logo_url;
    }
    if (c.general.footer_desc) {
      const fd = document.querySelector('.betternak-footer p');
      if (fd) fd.textContent = c.general.footer_desc;
    }
    if (c.general.copyright) {
      const cr = document.querySelector('.betternak-footer .pt-8 div:first-child');
      if (cr) cr.textContent = c.general.copyright;
    }
  }

  // 2. Hero Section
  if (c.hero) {
    const h1 = document.querySelector('#card-0 h1');
    if (h1 && c.hero.title) h1.textContent = c.hero.title;

    const hp = document.querySelector('#card-0 p');
    if (hp && c.hero.subtitle) hp.textContent = c.hero.subtitle;
  }

  // 3. Story Cards
  if (c.story_cards) {
    const sc = c.story_cards;
    if (sc.card_1) {
      const c1h2 = document.querySelector('#card-1 h2');
      if (c1h2 && sc.card_1.title) c1h2.textContent = sc.card_1.title;
      const c1p = document.querySelector('#card-1 p');
      if (c1p && sc.card_1.subtitle) c1p.textContent = sc.card_1.subtitle;
    }
    if (sc.card_2) {
      const c2h2 = document.querySelector('#card-2 h2');
      if (c2h2 && sc.card_2.title) c2h2.textContent = sc.card_2.title;
      const c2p = document.querySelector('#card-2 p');
      if (c2p && sc.card_2.subtitle) c2p.textContent = sc.card_2.subtitle;
    }
    if (sc.card_anti && Array.isArray(sc.card_anti.words)) {
      const words = sc.card_anti.words;
      if (words[0]) {
        const w0 = document.getElementById('word-berantakan'); if (w0) w0.textContent = words[0].word;
        const d0 = document.getElementById('desc-berantakan'); if (d0) d0.textContent = words[0].desc;
      }
      if (words[1]) {
        const w1 = document.getElementById('word-ribet'); if (w1) w1.textContent = words[1].word;
        const d1 = document.getElementById('desc-ribet'); if (d1) d1.textContent = words[1].desc;
      }
      if (words[2]) {
        const w2 = document.getElementById('word-tumpah'); if (w2) w2.textContent = words[2].word;
        const d2 = document.getElementById('desc-tumpah'); if (d2) d2.textContent = words[2].desc;
      }
    }
  }

  // 4. Gallery Section
  if (c.gallery) {
    const g = c.gallery;
    if (g.subtitle) {
      const gp = document.querySelector('.gallery-intro-card p');
      if (gp) gp.textContent = g.subtitle;
    }
    if (g.quote) {
      const qt = document.querySelector('.quote-text');
      if (qt && g.quote.text) qt.textContent = g.quote.text;
      const qa = document.querySelector('.quote-author');
      if (qa && g.quote.author) qa.textContent = g.quote.author;
    }
    if (g.stat) {
      const sn = document.querySelector('.stat-number');
      if (sn && g.stat.number) sn.textContent = g.stat.number;
      const sl = document.querySelector('.stat-label');
      if (sl && g.stat.label) sl.textContent = g.stat.label;
      const ss = document.querySelector('.stat-sub');
      if (ss && g.stat.sub) ss.textContent = g.stat.sub;
    }
    if (Array.isArray(g.items)) {
      const photoFrames = document.querySelectorAll('.gallery-item');
      g.items.forEach((item, idx) => {
        if (photoFrames[idx]) {
          const img = photoFrames[idx].querySelector('.gallery-img');
          if (img && item.image) img.src = item.image;
          const tag = photoFrames[idx].querySelector('.gallery-tag');
          if (tag && item.tag) tag.textContent = item.tag;
          const title = photoFrames[idx].querySelector('.gallery-title');
          if (title && item.title) title.textContent = item.title;
          const desc = photoFrames[idx].querySelector('.gallery-desc');
          if (desc && item.desc) desc.textContent = item.desc;
        }
      });
    }
  }

  // 5. WhatsApp & Contact CTA
  if (c.contact) {
    const wa = c.contact;
    const phone = (wa.whatsapp_number || '6281234567890').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(wa.whatsapp_message || 'Halo Admin Betternak');
    const waLink = `https://wa.me/${phone}?text=${msg}`;

    const waButtons = document.querySelectorAll('a[href*="wa.me"]');
    waButtons.forEach((btn) => {
      btn.href = waLink;
      if (wa.whatsapp_button_text) {
        btn.textContent = wa.whatsapp_button_text;
      }
    });
  }
}
