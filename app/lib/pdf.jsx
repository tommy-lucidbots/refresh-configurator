import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import {
  TIERS, ITEMS, fmt, computeTotal, cashTotal, financeTotal, configName,
  taxRateFor, STATE_NAMES, TERM,
} from './data';

const NAVY = '#142933';
const CYAN = '#1aa3b8';
const GREEN = '#1f9d57';
const GREY = '#606060';
const LINE = '#e3e8ea';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, color: NAVY, fontFamily: 'Helvetica' },
  band: { backgroundColor: NAVY, borderRadius: 10, padding: '16 20', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brand: { color: '#fff', fontSize: 16, fontFamily: 'Helvetica-Bold' },
  brandBots: { color: '#23c0d8' },
  bandTag: { color: '#9fc4cf', fontSize: 8, letterSpacing: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  eyebrow: { color: CYAN, fontSize: 8, letterSpacing: 1, marginBottom: 4 },
  cfgName: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  sub: { fontSize: 10, color: GREY, marginTop: 4 },
  bigPrice: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: NAVY },
  tableHead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: NAVY, paddingBottom: 6, marginBottom: 2 },
  th: { fontSize: 8, color: GREY, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 7 },
  itemName: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  itemSub: { fontSize: 8, color: '#8a8a8a', marginTop: 1 },
  itemPrice: { fontSize: 11 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 2, borderTopColor: NAVY, paddingTop: 12, marginTop: 14 },
  totalLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  totalVal: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  taxLabel: { fontSize: 11, color: GREY },
  taxVal: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  savings: { flexDirection: 'row', gap: 12, marginTop: 18 },
  savePill: { flex: 1, backgroundColor: '#e8f7ee', borderWidth: 1, borderColor: '#bfe6cf', borderRadius: 8, padding: 14, alignItems: 'center' },
  savePct: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: GREEN },
  saveLbl: { fontSize: 9, color: '#2a6b45', marginTop: 4, textAlign: 'center' },
  contact: { marginTop: 20, backgroundColor: '#f4f6f7', borderRadius: 8, padding: 14 },
  contactLine: { fontSize: 10, color: NAVY, marginBottom: 3 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12, fontSize: 8, color: GREY, lineHeight: 1.5 },
});

function RefreshDoc({ data }) {
  const { tier, selected, taxState, contact } = data;
  const total = computeTotal(tier, selected);
  const rate = taxRateFor(taxState);
  const withTax = Math.round(total * (1 + rate));
  const refresh24 = total * TERM;
  const cash = cashTotal(selected);
  const fin = financeTotal(selected);
  const pctFin = fin > refresh24 ? Math.round(((fin - refresh24) / fin) * 100) : 0;
  const pctCash = cash > refresh24 ? Math.round(((cash - refresh24) / cash) * 100) : 0;
  const sel = ITEMS.filter((it) => selected.includes(it.id));
  const pctLabel = (rate * 100).toFixed(3).replace(/\.?0+$/, '');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.band}>
          <Text style={styles.brand}>LUCID<Text style={styles.brandBots}>BOTS</Text></Text>
          <Text style={styles.bandTag}>REFRESH · CONFIGURATION SUMMARY</Text>
        </View>

        <View style={styles.headRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR CONFIGURATION</Text>
            <Text style={styles.cfgName}>{configName(tier, selected)}</Text>
            <Text style={styles.sub}>24-month subscription · $0 down</Text>
          </View>
          <Text style={styles.bigPrice}>${fmt(total)}/mo</Text>
        </View>

        {contact && (
          <View style={styles.contact}>
            <Text style={[styles.contactLine, { fontFamily: 'Helvetica-Bold' }]}>Prepared for</Text>
            <Text style={styles.contactLine}>{contact.name}</Text>
            <Text style={styles.contactLine}>{contact.email}</Text>
            <Text style={styles.contactLine}>{contact.phone}</Text>
          </View>
        )}

        <View style={{ marginTop: 18 }}>
          <View style={styles.tableHead}>
            <Text style={styles.th}>INCLUDED IN THIS CONFIGURATION</Text>
            <Text style={styles.th}>MONTHLY</Text>
          </View>
          {sel.map((it) => (
            <View style={styles.row} key={it.id}>
              <View>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSub}>{it.included ? 'Included free on Refresh' : `vs ${it.cash} cash`}</Text>
              </View>
              <Text style={styles.itemPrice}>{it.included ? 'Included' : `$${fmt(it.mo)}/mo`}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total monthly subscription</Text>
          <Text style={styles.totalVal}>${fmt(total)}/mo</Text>
        </View>

        {taxState && rate > 0 && (
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Estimated with {pctLabel}% {taxState} state tax</Text>
            <Text style={styles.taxVal}>${fmt(withTax)}/mo</Text>
          </View>
        )}

        <View style={styles.savings}>
          <View style={styles.savePill}>
            <Text style={styles.savePct}>{pctFin}%</Text>
            <Text style={styles.saveLbl}>lower than financing the same equipment over 24 months</Text>
          </View>
          <View style={styles.savePill}>
            <Text style={styles.savePct}>{pctCash}%</Text>
            <Text style={styles.saveLbl}>lower than buying the same equipment with cash</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Monthly price shown is pre-tax. Any sales tax estimate is based on the state rate only and excludes local taxes; final tax is confirmed on your order. A one-time shipping cost is added at finalization based on delivery location. 24-month subscription. $0 down. Lucid Bots retains ownership of all hardware. At term end, Refresh or Return. This is a configuration summary, not a quote or contract.
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePdf(data) {
  return renderToBuffer(<RefreshDoc data={data} />);
}
