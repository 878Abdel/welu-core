import type { MerchantProfile, SourceKind, Transaction } from '../data/types';
import { number } from './format';

/** Relevé de transactions en PDF, généré dans le navigateur. */
export async function exportStatement(p: MerchantProfile, txs: Transaction[], score: number, source: SourceKind) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const violet: [number, number, number] = [108, 92, 231];
  const ink: [number, number, number] = [27, 21, 48];
  const muted: [number, number, number] = [111, 106, 133];
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFillColor(...violet);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Wëlu', 16, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Relevé de transactions', 194, 17, { align: 'right' });

  doc.setTextColor(...ink);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(p.name, 16, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(`${p.trade} · ${p.location}`, 16, 48);
  doc.text(`Édité le ${date} · score de crédibilité ${score}/100`, 16, 54);

  let y = 68;
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text('HEURE', 16, y);
  doc.text('LIBELLÉ', 36, y);
  doc.text('CANAL', 120, y);
  doc.text('MONTANT (FCFA)', 194, y, { align: 'right' });
  doc.setDrawColor(236, 233, 245);
  doc.line(16, y + 2.5, 194, y + 2.5);
  y += 9;

  doc.setFontSize(10);
  for (const t of txs) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(...ink);
    doc.text(t.time, 16, y);
    doc.text(t.label, 36, y);
    doc.setTextColor(...muted);
    doc.text(t.amount < 0 ? 'Paiement' : t.channel === 'cash' ? (t.certified ? 'Cash certifié' : 'Cash') : 'Mobile money', 120, y);
    doc.setTextColor(...(t.amount < 0 ? muted : ink));
    doc.text(`${t.amount < 0 ? '-' : '+'}${number(Math.abs(t.amount)).replace(/\s/g, ' ')}`, 194, y, { align: 'right' });
    doc.line(16, y + 3, 194, y + 3);
    y += 9;
  }

  const inflow = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = txs.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  y += 4;
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.text(`Entrées : +${number(inflow).replace(/\s/g, ' ')}   ·   Sorties : ${outflow ? '-' : ''}${number(outflow).replace(/\s/g, ' ')}`, 194, y, { align: 'right' });

  if (source === 'mock') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('Document de démonstration : profil et transactions simulés.', 16, 287);
  }
  doc.save(`welu-releve-${p.merchantCode}.pdf`);
}
