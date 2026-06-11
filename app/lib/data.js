// Single source of truth for pricing data and calculations.
// Used by the configurator UI, the PDF generator, and the email body.

export const TERM = 24;
export const FIN_FACTOR = 1.1298; // 12% APR, 24mo total paid per $ financed

export const ITEMS = [
  { id: 'flight', name: 'Sherpa Flight System', benefit: '', desc: 'Drone, 8 batteries, 2 chargers. The base on every tier, sized to keep a crew working between battery swaps.', info: 'The Sherpa Flight System is the foundation of every Refresh subscription: the drone itself, eight batteries, and two chargers. The battery count is deliberate. A crew rotates batteries through the two chargers so the Sherpa keeps flying while spent packs recharge, meaning the team works continuously instead of waiting between swaps. This is the machine, the uptime, and nothing else to pay for.', mo: 1887, cashNum: 45750, cash: '$45,750', base: true },
  { id: 'window', name: 'Window Payload', benefit: '', desc: 'Windows, soft wash, and building exteriors.', info: 'The Window Payload handles the bread-and-butter work that fills most cleaning schedules: windows, soft wash, and building exteriors. It is the payload that turns the Sherpa into a revenue machine on day one, covering the jobs operators already book and bill for.', mo: 475, cashNum: 11500, cash: '$11,500' },
  { id: 'shield', name: 'Shield Payload', benefit: 'Bid the sealing jobs you turn away today.', group: 'bigger', desc: 'Sealing and surface protection, the highest-ticket jobs in the industry.', info: 'The Shield Payload unlocks sealing and surface protection work, the highest-ticket jobs in the cleaning industry. For operators already booked on window work, this is how revenue per crew climbs: the same team now bids on sealing and restoration jobs they used to turn away. Anchor the conversation on the new revenue this opens, not the cost.', mo: 620, cashNum: 15000, cash: '$15,000' },
  { id: 'tether', name: 'Power Tether', benefit: 'Stay in the air all day and finish up to 40% more jobs.', group: 'more', desc: 'Nearly unlimited flight time, no battery swaps, up to 40% more efficiency.', info: 'The Power Tether feeds the Sherpa continuous power from the ground, so there are no battery swaps and effectively unlimited flight time. On the jobsite that translates to up to 40% more efficiency: the crew stays in the air and finishes more jobs per day. It is the upgrade for proven operators whose constraint is revenue per day, not capability.', mo: 815, cashNum: 19800, cash: '$19,800' },
  { id: 'bizbox', name: 'Business in a Box Training', benefit: 'Run the business right from day one, no guesswork.', group: 'customers', desc: 'The playbook for running a cleaning company: operations, pricing, quoting, safety.', info: 'Business in a Box is the operating playbook for someone who has never run a cleaning company. It covers operations, pricing, quoting, and safety. It removes one of the two reasons new operators fail, not knowing how to actually run the business, so a first-time owner can start with a proven system instead of guessing.', mo: 125, cashNum: 3000, cash: '$3,000' },
  { id: 'mktg', name: 'Marketing Content Package', benefit: 'Launch with a brand and leads, not from scratch.', group: 'customers', desc: 'Professional video and content so a new operator has a brand and leads from day one.', info: 'The Marketing Content Package gives a new operator professional video and content from day one. It removes the other reason new operators fail, having no brand and no way to find customers. Instead of building a presence from scratch, they launch with polished marketing material ready to put in front of leads.', mo: 415, cashNum: 10000, cash: '$10,000' },
  { id: 'ojt', name: 'On-the-Job Training / Consultation', benefit: 'We work your first jobs with you so revenue starts now.', group: 'customers', desc: 'We work the first jobs alongside the crew so new revenue starts immediately.', info: 'On-the-Job Training puts the Lucid Bots team on site to work the first jobs alongside the crew. Rather than handing over equipment and walking away, we make sure the new revenue starts immediately and the team is confident on the higher-ticket work before they are on their own.', mo: 205, cashNum: 5000, cash: '$5,000' },
  { id: 'loaner', name: 'Loaner Fleet + Premium Support', benefit: '', desc: 'If it breaks, we swap it. The crew never stops earning.', info: 'Loaner Fleet and Premium Support means downtime never costs a job. If a Sherpa goes down, we swap in a loaner so the crew keeps earning. For a business where every grounded day is lost revenue, this is the difference between a hiccup and a missed payroll.', mo: 495, cashNum: 500, cashMonthly: true, cash: '$500/mo' },
  { id: 'diag', name: 'Remote Diagnostics', benefit: '', desc: 'We see problems before they do, and head off downtime before it costs a job.', info: 'Remote Diagnostics lets Lucid Bots monitor the Sherpa and catch problems before the operator even notices them. Issues get flagged and addressed before they turn into downtime, so the machine stays in the air and on the schedule.', mo: 99, cashNum: 100, cashMonthly: true, cash: '$100/mo' },
  { id: 'app', name: 'Lucid Bots Mobile App', benefit: '', desc: 'Quoting and job management in their pocket. Included free on every Refresh subscription.', info: 'The Lucid Bots Mobile App puts quoting and job management in the operator\u2019s pocket. It is included free on every Refresh subscription, never a paid add-on, so every customer runs their business from their phone from day one.', mo: 0, cashNum: 160, cashMonthly: true, cash: '$160/mo', included: true },
];

export const GROUPS = {
  customers: 'Get more customers',
  more: 'Do more jobs per day',
  bigger: 'Win bigger jobs',
};

export const TIERS = {
  base:   { key: 'base',   num: 'Base Camp', outcome: 'Add a drone to my crew',     name: 'Base Camp', price: '$2,950', priceNum: 2950, blurb: 'Existing cleaners adding a drone to a crew they already run.', choice: 'I already clean',   items: ['flight', 'window', 'loaner', 'diag', 'app'] },
  ascent: { key: 'ascent', num: 'Ascent',    outcome: 'Start a cleaning business',  name: 'Ascent',    price: '$3,500', priceNum: 3500, blurb: 'Entrepreneurs going zero-to-one, no cleaning revenue yet.',     choice: "I'm just starting", items: ['flight', 'window', 'loaner', 'diag', 'app', 'bizbox', 'mktg'] },
  summit: { key: 'summit', num: 'Summit',    outcome: 'Do bigger jobs, faster',     name: 'Summit',    price: '$4,600', priceNum: 4600, blurb: 'Proven operators wanting more airtime and higher-ticket jobs.', choice: "I'm scaling",      items: ['flight', 'window', 'loaner', 'diag', 'app', 'shield', 'tether', 'ojt'] },
};

export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// State base sales-tax rates (state-level only; local city/county not included).
export const STATE_TAX = {
  AL:4.0, AK:0.0, AZ:5.6, AR:6.5, CA:7.25, CO:2.9, CT:6.35, DE:0.0, FL:6.0,
  GA:4.0, HI:4.0, ID:6.0, IL:6.25, IN:7.0, IA:6.0, KS:6.5, KY:6.0, LA:4.45,
  ME:5.5, MD:6.0, MA:6.25, MI:6.0, MN:6.875, MS:7.0, MO:4.225, MT:0.0, NE:5.5,
  NV:6.85, NH:0.0, NJ:6.625, NM:5.0, NY:4.0, NC:4.75, ND:5.0, OH:5.75, OK:4.5,
  OR:0.0, PA:6.0, RI:7.0, SC:6.0, SD:4.5, TN:7.0, TX:6.25, UT:6.1, VT:6.0,
  VA:5.3, WA:6.5, WV:6.0, WI:5.0, WY:4.0, DC:6.0,
};
export const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'Washington, D.C.',
};

export const fmt = (n) => n.toLocaleString('en-US');

// Total anchors to the tier's published price, then adds any items beyond the tier's set.
export function computeTotal(tierKey, selectedIds) {
  let t = TIERS[tierKey].priceNum;
  selectedIds.forEach((id) => {
    if (!TIERS[tierKey].items.includes(id)) t += itemById[id].mo;
  });
  return t;
}

export function cashTotal(selectedIds) {
  let c = 0;
  selectedIds.forEach((id) => {
    const it = itemById[id];
    c += it.cashMonthly ? it.cashNum * TERM : it.cashNum;
  });
  return c;
}

export function financeTotal(selectedIds) {
  let f = 0;
  selectedIds.forEach((id) => {
    const it = itemById[id];
    if (it.cashMonthly) f += it.cashNum * TERM;
    else f += it.cashNum * FIN_FACTOR;
  });
  return Math.round(f);
}

export function configName(tierKey, selectedIds) {
  for (const t of Object.values(TIERS)) {
    if (t.items.length === selectedIds.length && t.items.every((i) => selectedIds.includes(i)))
      return t.name;
  }
  return TIERS[tierKey].name + ' + custom';
}

export function taxRateFor(stateCode) {
  return stateCode && STATE_TAX[stateCode] !== undefined ? STATE_TAX[stateCode] / 100 : 0;
}
