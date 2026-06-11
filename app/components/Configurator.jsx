'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TIERS, ITEMS, GROUPS, itemById, STATE_NAMES, STATE_TAX,
  fmt, computeTotal, cashTotal, financeTotal, configName, taxRateFor, TERM,
} from '../lib/data';

const LOGO_SRC = '/lucidbots-white.png';

export default function Configurator() {
  const [tier, setTier] = useState('base');
  const [selected, setSelected] = useState(() => new Set(TIERS.base.items));
  const [taxState, setTaxState] = useState('');
  const [flash, setFlash] = useState(false);

  const [infoItem, setInfoItem] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [honeypot, setHoneypot] = useState('');
  const [sendOpenedAt, setSendOpenedAt] = useState(0);
  const [formErr, setFormErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load config from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('t') && TIERS[p.get('t')]) {
      const tk = p.get('t');
      const a = (p.get('a') || '').split(',').filter((x) => itemById[x]);
      const next = new Set(a.length ? a : TIERS[tk].items);
      TIERS[tk].items.forEach((id) => next.add(id));
      setTier(tk);
      setSelected(next);
    }
    if (p.get('s') && STATE_TAX[p.get('s')] !== undefined) setTaxState(p.get('s'));
  }, []);

  const selectedIds = [...selected];
  const total = computeTotal(tier, selectedIds);
  const rate = taxRateFor(taxState);
  const isLocked = useCallback((id) => TIERS[tier].items.includes(id), [tier]);

  const doFlash = () => { setFlash(true); setTimeout(() => setFlash(false), 260); };

  const selectTier = (key) => {
    setTier(key);
    setSelected(new Set(TIERS[key].items));
    doFlash();
  };

  const toggleItem = (id) => {
    if (isLocked(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    doFlash();
  };

  const cfgName = configName(tier, selectedIds);
  const refresh24 = total * TERM;
  const cash = cashTotal(selectedIds);
  const fin = financeTotal(selectedIds);
  const pctCash = cash > refresh24 ? Math.round(((cash - refresh24) / cash) * 100) : 0;
  const pctFin = fin > refresh24 ? Math.round(((fin - refresh24) / fin) * 100) : 0;

  const withTax = Math.round(total * (1 + rate));
  const pctLabel = (rate * 100).toFixed(3).replace(/\.?0+$/, '');

  // Big number + label logic
  let bigNumber = total;
  let priceLabel = 'Monthly subscription';
  if (taxState && rate > 0) {
    bigNumber = withTax;
    priceLabel = `Est. monthly with ${pctLabel}% ${taxState} tax`;
  }

  function encodeState() {
    const p = new URLSearchParams();
    p.set('t', tier);
    p.set('a', selectedIds.join(','));
    if (taxState) p.set('s', taxState);
    return window.location.origin + window.location.pathname + '?' + p.toString();
  }

  function copyLink() {
    const url = encodeState();
    navigator.clipboard.writeText(url).then(() => setToast('Link copied')).catch(() => setToast('Link copied'));
    window.history.replaceState(null, '', url);
    setTimeout(() => setToast(''), 2200);
  }

  async function downloadPdf() {
    if (downloading) return;
    setDownloading(true);
    setToast('Building your PDF…');
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, selected: selectedIds, taxState }),
      });
      if (!res.ok) throw new Error('pdf failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Refresh-${cfgName.replace(/[^a-z0-9]+/gi, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToast('PDF downloaded');
    } catch (e) {
      setToast('Could not build PDF, please try again');
    } finally {
      setDownloading(false);
      setTimeout(() => setToast(''), 2200);
    }
  }

  async function submitSend() {
    setFormErr('');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const phoneOk = form.phone.replace(/\D/g, '').length >= 10;
    if (!form.name.trim()) { setFormErr('Please enter your name.'); return; }
    if (!emailOk) { setFormErr('Please enter a valid email.'); return; }
    if (!phoneOk) { setFormErr('Please enter a valid phone number.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          tier,
          selected: selectedIds,
          taxState,
          link: encodeState(),
          company_website: honeypot,
          elapsedMs: sendOpenedAt ? Date.now() - sendOpenedAt : 9999,
        }),
      });
      if (!res.ok) throw new Error('submit failed');
      setShowSend(false);
      setShowSent(true);
    } catch (e) {
      setFormErr('Something went wrong sending your build. Please try again, or email refresh@lucidbots.com.');
    } finally {
      setSubmitting(false);
    }
  }

  // Grouped addable items
  const included = ITEMS.filter((it) => it.included || isLocked(it.id));
  const addable = ITEMS.filter((it) => !(it.included || isLocked(it.id)));

  return (
    <>
      <header>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Lucid Bots" src={LOGO_SRC} />
        <div className="hdr-tag">Refresh · Build your subscription</div>
      </header>

      <div className="wrap">
        <div className="hero">
          <span className="eyebrow">Lucid Bots Refresh · Pricing builder</span>
          <h1>Start earning with a Sherpa. <em>$0 down.</em></h1>
          <p>Build your subscription below. The drone, software, support, and upgrades, all in one monthly price.</p>
        </div>

        <div className="grid">
          <div>
            <div className="section-head">
              <h2>1 · Where are you today?</h2>
              <span className="hint">Pick one. We&apos;ll set your starting point.</span>
            </div>
            <div className="choices">
              {Object.values(TIERS).map((t) => (
                <button key={t.key} className={'choice' + (tier === t.key ? ' active' : '')} aria-pressed={tier === t.key} onClick={() => selectTier(t.key)}>
                  <span className="ch-text">{t.choice}</span><span className="ch-arrow">→</span>
                </button>
              ))}
            </div>

            <div className="section-head" style={{ marginTop: 30 }}>
              <h2>2 · Your plan</h2>
              <span className="hint">Switch anytime.</span>
            </div>
            <div className="tiers">
              {Object.values(TIERS).map((t) => (
                <button key={t.key} className={'tier' + (tier === t.key ? ' active' : '')} aria-pressed={tier === t.key} onClick={() => selectTier(t.key)}>
                  <div className="check"><svg viewBox="0 0 24 24" fill="none" stroke="#142933" strokeWidth="3.5"><path d="M20 6L9 17l-5-5" /></svg></div>
                  <div className="outcome">{t.outcome}</div>
                  <div className="num">{t.num}</div>
                  <div className="price">{t.price}<small> /mo · $0 down</small></div>
                  <div className="blurb">{t.blurb}</div>
                </button>
              ))}
            </div>

            <div className="section-head">
              <h2>3 · What&apos;s included, and what you can add</h2>
              <span className="hint">Base stays on. Add anything below.</span>
            </div>

            <div className="addons">
              {/* Consolidated included box */}
              <div className="inc-box">
                <div className="inc-head">
                  <div>
                    <div className="inc-eyebrow">Included in {TIERS[tier].name}</div>
                    <div className="inc-title">Everything you need to fly, all in one subscription</div>
                  </div>
                  <div className="inc-badge">$0 down · 24 mo</div>
                </div>
                <div className="inc-grid">
                  {included.map((it) => (
                    <div className="inc-item" key={it.id}>
                      <div className="inc-item-top">
                        <span className="inc-item-name">{it.name}</span>
                        <button className="info-btn" aria-label={`Learn more about ${it.name}`} onClick={() => setInfoItem(it)}>?</button>
                      </div>
                      <div className="inc-item-desc">{it.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addable, grouped */}
              {addable.length > 0 && (
                <>
                  <div className="addable-intro">
                    <div className="ai-eyebrow">Add to your package</div>
                    <div className="ai-title">Pick what you need</div>
                    <div className="ai-sub">Build out your subscription with the capabilities below. Add or remove anytime, your monthly updates instantly.</div>
                  </div>
                  {Object.keys(GROUPS).map((gkey) => {
                    const inGroup = addable.filter((it) => it.group === gkey);
                    if (!inGroup.length) return null;
                    return (
                      <div key={gkey}>
                        <div className="addable-label">{GROUPS[gkey]}</div>
                        <div className="addable-grid">
                          {inGroup.map((it) => {
                            const on = selected.has(it.id);
                            return (
                              <div className={'card' + (on ? ' added' : '')} key={it.id}>
                                <div className="top">
                                  <div className="ttl">{it.name}
                                    <button className="info-btn" aria-label={`Learn more about ${it.name}`} onClick={() => setInfoItem(it)}>?</button>
                                  </div>
                                  <div className="mo">${fmt(it.mo)}<small>/mo</small></div>
                                </div>
                                <div className="benefit">{it.benefit}</div>
                                <button className="btn-add" onClick={() => toggleItem(it.id)}>
                                  {on ? (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Added · remove</>
                                  ) : (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>Add</>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Sticky panel */}
          <div className="panel-col">
            <div className="panel">
              <span className="eyebrow">Your configuration</span>
              <div className="config-name">{cfgName}</div>
              <div className="price-label">{priceLabel}</div>
              <div className="priceblock">
                <span className="dollar">$</span>
                <span className={'amt' + (flash ? ' flash' : '')}>{fmt(bigNumber)}</span>
                <span className="per">/mo</span>
              </div>
              <div className="terms"><b>$0 down</b> · 24-month subscription</div>

              <div className="tax-row">
                <select value={taxState} aria-label="Select state for estimated tax" onChange={(e) => { setTaxState(e.target.value); doFlash(); }}>
                  <option value="">Add state for estimated tax</option>
                  {Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b])).map((code) => (
                    <option key={code} value={code}>{STATE_NAMES[code]}</option>
                  ))}
                </select>
              </div>

              <div className="tax-line show">
                {taxState && rate > 0 && (
                  <span className="tl-total">${fmt(total)}/mo before tax · estimate uses the {taxState} state rate only, local taxes not included.</span>
                )}
                {taxState && rate === 0 && (
                  <span className="tl-total">{STATE_NAMES[taxState]} has no state sales tax.</span>
                )}
                <span className="tl-pt">Monthly pricing is shown before applicable taxes. Select your state above for an estimated tax amount.</span>
                <span className="tl-pt">A one-time shipping fee will be added at finalization based on the delivery location.</span>
                <span className="tl-pt">Refresh is a 24-month subscription with $0 down. Lucid Bots retains ownership of all hardware throughout the subscription term. At the end of the term, customers may choose to Refresh or Return their equipment.</span>
                <span className="tl-pt">This configuration summary is for planning purposes only and does not constitute a quote, financing offer, or binding contract.</span>
              </div>

              <div className="lineitems">
                <div className="li base-li"><span className="n">{TIERS[tier].name} essentials</span><span className="v">Included</span></div>
                {ITEMS.filter((it) => selected.has(it.id) && !isLocked(it.id) && !it.included).map((it) => (
                  <div className="li" key={it.id}><span className="n">{it.name}</span><span className="v">${fmt(it.mo)}/mo</span></div>
                ))}
              </div>

              <button className="btn btn-send" onClick={() => { setFormErr(''); setHoneypot(''); setSendOpenedAt(Date.now()); setShowSend(true); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                Lock in this configuration
              </button>
              <div className="actions">
                <button className="btn btn-ghost" onClick={copyLink}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                  Copy link
                </button>
                <button className="btn btn-primary" onClick={downloadPdf} disabled={downloading}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  {downloading ? 'Building…' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* Savings card */}
            <div className="savings-card">
              <div className="sc-eyebrow">Refresh saves you</div>
              <div className="sc-pcts">
                <div className="sc-item">
                  <div className="sc-pct">{pctFin}%</div>
                  <div className="sc-lbl">lower than financing the same equipment</div>
                </div>
              </div>
              <button className="sc-more" onClick={() => setShowCompare(true)}>See the full breakdown</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="mbar">
        <div>
          <div className="ml">Monthly</div>
          <div className="mp"><span className="d">$</span>{fmt(bigNumber)}<small>/mo</small></div>
        </div>
        <button onClick={downloadPdf} disabled={downloading}>{downloading ? 'Building…' : 'Download PDF'}</button>
      </div>

      {/* Compare modal */}
      {showCompare && (
        <div className="modal-bg show" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setShowCompare(false); }}>
          <div className="modal">
            <button className="modal-close" aria-label="Close" onClick={() => setShowCompare(false)}>&times;</button>
            <span className="eyebrow">The smart-money comparison</span>
            <h3>Refresh is the lowest 24-month cost</h3>
            <p className="sub">Same equipment, three ways to pay. Refresh is the lowest total with nothing down, and every repair and upgrade stays on us.</p>
            <div className="savings-row">
              <div className="save-pill"><div className="pct">{pctFin}%</div><div className="lbl"><b>Lower than financing</b>over 24 months, interest included</div></div>
              <div className="save-pill"><div className="pct">{pctCash}%</div><div className="lbl"><b>Lower than buying cash</b>same equipment, $0 down</div></div>
            </div>
            <div className="cmp-cols">
              <div className="cmp-card win"><div className="lbl">Refresh</div><div className="big">${fmt(refresh24)}</div><div className="note">${fmt(total)}/mo · $0 down · all included</div><div className="pill">Lowest total</div></div>
              <div className="cmp-card"><div className="lbl">Buy with cash</div><div className="big">${fmt(cash)}</div><div className="note">Paid up front · service is extra</div></div>
              <div className="cmp-card"><div className="lbl">Buy &amp; finance</div><div className="big">${fmt(fin)}</div><div className="note">12% APR · +${fmt(fin - cash)} interest</div></div>
            </div>
            <div className="boomlift">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" /></svg>
              <div className="txt">A 40-foot boom lift alone rents for <b>over $3,000 a month</b>, and all it does is lift a person to the work. Refresh puts a fully serviced Sherpa that does the work, upgraded every term, in that same monthly range.</div>
            </div>
          </div>
        </div>
      )}

      {/* Info modal */}
      {infoItem && (
        <div className="modal-bg show" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setInfoItem(null); }}>
          <div className="modal modal-sm">
            <button className="modal-close" aria-label="Close" onClick={() => setInfoItem(null)}>&times;</button>
            <span className="eyebrow">What you&apos;re adding</span>
            <h3>{infoItem.name}</h3>
            <p style={{ color: 'var(--grey)', fontSize: '14.5px', lineHeight: 1.6, margin: '10px 0 16px' }}>{infoItem.info}</p>
            <div style={{ background: '#f0fbfd', border: '1px solid #cdeef4', borderRadius: 10, padding: '12px 16px', fontSize: '13.5px', color: 'var(--navy)' }}>
              {infoItem.included ? 'Included free on every Refresh subscription' : <><b>${fmt(infoItem.mo)}/mo</b> on Refresh · vs {infoItem.cash} to buy</>}
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {showSend && (
        <div className="modal-bg show" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setShowSend(false); }}>
          <div className="modal modal-sm">
            <button className="modal-close" aria-label="Close" onClick={() => setShowSend(false)}>&times;</button>
            <span className="eyebrow">Lock in this configuration</span>
            <h3>Send your build to Lucid Bots</h3>
            <p className="sub" style={{ marginBottom: 18 }}>Our team reviews your configuration and reaches out to walk you through next steps. No commitment, no payment today.</p>
            <div className="field"><label htmlFor="cName">Name</label><input id="cName" type="text" autoComplete="name" placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="cEmail">Email</label><input id="cEmail" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label htmlFor="cPhone">Phone</label><input id="cPhone" type="tel" autoComplete="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            {/* Honeypot: hidden from humans, bots tend to fill it. Do not remove. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="company_website">Company website (leave blank)</label>
              <input id="company_website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>
            <div className="field-err">{formErr}</div>
            <button className="btn btn-send" style={{ width: '100%', marginTop: 6, opacity: submitting ? 0.7 : 1 }} disabled={submitting} onClick={submitSend}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              {submitting ? 'Sending…' : 'Send to Lucid Bots'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--grey-lt)', marginTop: 12, textAlign: 'center' }}>We&apos;ll review your build and reach out using the contact details above.</p>
          </div>
        </div>
      )}

      {/* Sent confirmation */}
      {showSent && (
        <div className="modal-bg show" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setShowSent(false); }}>
          <div className="modal modal-sm" style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1f9d57" strokeWidth="2.5" style={{ width: 28, height: 28 }}><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3>Your build is on its way</h3>
            <p className="sub" style={{ margin: '8px auto 20px' }}>Thanks. The Lucid Bots team has your configuration and will reach out soon to walk you through next steps.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSent(false)}>Done</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast show">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
