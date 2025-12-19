from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.platypus import Image
import os
from django.conf import settings

def generate_invoice_pdf(invoice):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    elements = []
    logo_path = os.path.join(settings.MEDIA_ROOT, "branding/logo.png")
    if os.path.exists(logo_path):
        elements.append(Image(logo_path, width=120, height=60))

    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "<b>Your Auto Shop Name</b><br/>"
        "123 Main Street<br/>"
        "Dallas, TX 75201<br/>"
        "(555) 555-5555<br/>"
        "billing@yourshop.com",
        styles["Normal"],
    ))

    # Header
    elements.append(Paragraph("<b>INVOICE</b>", styles["Title"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Customer:</b> {invoice.customer}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Issue Date:</b> {invoice.issue_date}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Due Date:</b> {invoice.due_date}", styles["Normal"]))
    elements.append(Spacer(1, 16))

    # Parts Table
    if invoice.line_items.exists():
        elements.append(Paragraph("<b>Parts</b>", styles["Heading2"]))
        part_data = [["Description", "Qty", "Unit Price", "Total"]]

        for part in invoice.line_items.all():
            part_data.append([
                part.description,
                str(part.quantity),
                f"${part.unit_price}",
                f"${part.total_price()}",
            ])

        elements.append(_styled_table(part_data))
        elements.append(Spacer(1, 12))

    # Labor Table
    if invoice.labor_items.exists():
        elements.append(Paragraph("<b>Labor</b>", styles["Heading2"]))
        labor_data = [["Description", "Hours", "Rate", "Total"]]

        for labor in invoice.labor_items.all():
            labor_data.append([
                labor.description,
                str(labor.hours),
                f"${labor.hourly_rate}",
                f"${labor.total_price()}",
            ])

        elements.append(_styled_table(labor_data))
        elements.append(Spacer(1, 12))

    # Total
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"<b>Invoice Total:</b> ${invoice.amount}",
        styles["Heading1"]
    ))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        "Thank you for your business!",
        styles["Italic"]
    ))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()

    return pdf


def _styled_table(data):
    table = Table(data, hAlign="LEFT", colWidths=[200, 60, 80, 80])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
    ]))
    return table
