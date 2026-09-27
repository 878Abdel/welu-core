import type { ApiProfile, CashQrResult } from '../services/api';
import type { Op } from '../state/useMerchant';
import { number } from './format';

const violet: [number, number, number] = [108, 92, 231];
const ink: [number, number, number] = [27, 21, 48];
const muted: [number, number, number] = [111, 106, 133];
const n = (v: number) => number(v).replace(/\s/g, ' ');

async function doc(title: string) {
  const { jsPDF } = await import('jspdf');
  const d = new jsPDF({ unit: 'mm', format: 'a4' });
  d.setFillColor(...violet);
  d.rect(0, 0, 210, 28, 'F');
  d.setTextColor(255, 255, 255);
  d.setFont('helvetica', 'bold');
  d.setFontSize(18);
  d.text('Wëlu', 16, 17);
  d.setFont('helvetica', 'normal');
  d.setFontSize(10);
  d.text(title, 194, 17, { align: 'right' });
  return d;
}

/** Reçu de vente certifié, à partir de la réponse réelle de /api/validate-cash-qr. */
export async function exportReceipt(p: ApiProfile, r: CashQrResult, phone: string, at: Date) {
  const d = await doc('Reçu de vente certifié');
  const rows: [string, string][] = [
    ['Reçu n°', r.receipt_id],
    ['Commerçant', `${p.name} · ${p.activity}`],
    ['Client', phone],
    ['Date', at.toLocaleString('fr-FR')],
    ['Montant', `${n(r.amount_fcfa)} FCFA`],
    ['Statut', r.status],
    ['Empreinte', r.qr_hash],
    ['Impact', r.impact_score],
  ];
  let y = 46;
  d.setFontSize(11);
  for (const [k, v] of rows) {
    d.setTextColor(...muted);
    d.text(k, 16, y);
    d.setTextColor(...ink);
    d.text(d.splitTextToSize(v, 130), 60, y);
    y += 11;
  }
  d.setFontSize(8);
  d.setTextColor(...muted);
  d.text(`Vérifiable sur https://welu.sn/verify/${r.receipt_id}`, 16, 287);
  d.save(`recu_${r.receipt_id}.pdf`);
}

/** Relevé des opérations certifiées par le backend pendant la session. */
export async function exportHistory(p: ApiProfile, ops: Op[], score: number | null) {
  const d = await doc('Relevé des opérations');
  d.setTextColor(...ink);
  d.setFont('helvetica', 'bold');
  d.setFontSize(13);
  d.text(p.name, 16, 42);
  d.setFont('helvetica', 'normal');
  d.setFontSize(10);
  d.setTextColor(...muted);
  d.text(`${p.activity} · édité le ${new Date().toLocaleString('fr-FR')}${score != null ? ` · score Wëlu ${score}/100` : ''}`, 16, 48);

  let y = 62;
  d.setFontSize(9);
  d.text('HEURE', 16, y);
  d.text('OPÉRATION', 36, y);
  d.text('RÉFÉRENCE', 130, y);
  d.text('MONTANT (FCFA)', 194, y, { align: 'right' });
  d.setDrawColor(236, 233, 245);
  d.line(16, y + 2.5, 194, y + 2.5);
  y += 9;
  d.setFontSize(10);
  for (const o of ops) {
    if (y > 275) {
      d.addPage();
      y = 20;
    }
    const [label, amount] =
      o.kind === 'cash'
        ? ['Vente cash certifiée QR', o.res.amount_fcfa]
        : o.kind === 'voice'
          ? [`Note vocale : ${o.res.structured_data.type ?? ''} ${o.res.structured_data.produit ?? ''}`, o.res.structured_data.montant ?? 0]
          : [`Facture grossiste : ${o.res.extracted_receipt.fournisseur ?? ''}`, o.res.extracted_receipt.montant_total ?? 0];
    d.setTextColor(...ink);
    d.text(o.at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 16, y);
    d.text(d.splitTextToSize(label, 90)[0], 36, y);
    d.setTextColor(...muted);
    d.text(o.id, 130, y);
    d.setTextColor(...ink);
    d.text(n(amount), 194, y, { align: 'right' });
    d.line(16, y + 3, 194, y + 3);
    y += 9;
  }
  if (!ops.length) {
    d.setTextColor(...muted);
    d.text('Aucune opération certifiée pendant cette session.', 16, y);
  }
  d.save(`welu-releve-${p.id}.pdf`);
}
