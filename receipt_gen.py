from fpdf import FPDF
import datetime

def generate_pdf_receipt(receipt_id: str, merchant: str, client: str, amount: float):
    pdf = FPDF(format=(100, 150))
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "W E L U", ln=True, align="C")
    pdf.set_font("Helvetica", size=8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 4, f"Certificat #{receipt_id}", ln=True, align="C")
    pdf.cell(0, 4, datetime.datetime.now().strftime("%d/%m/%Y %H:%M"), ln=True, align="C")
    pdf.ln(4)
    pdf.line(10, 24, 90, 24)
    pdf.ln(6)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 8, f"{amount:,.0f} FCFA".replace(",", " "), ln=True, align="C")
    pdf.ln(2)
    pdf.set_font("Helvetica", size=9)
    pdf.cell(0, 5, f"Commercant: {merchant}", ln=True)
    pdf.cell(0, 5, f"Client: {client}", ln=True)
    pdf.cell(0, 5, "Statut: Double QR Valide", ln=True)
    pdf.ln(4)
    pdf.set_text_color(16, 185, 129)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "+1 Brique Maison ajoutee au Score", ln=True, align="C")
    
    filename = f"recu_{receipt_id}.pdf"
    pdf.output(filename)
    return filename
