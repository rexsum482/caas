from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Spacer,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from django.conf import settings
import os
from dotenv import load_dotenv

load_dotenv()

company_name = os.getenv("REACT_APP_COMPANY_NAME")
admin_email = os.getenv("REACT_APP_ADMIN_EMAIL")
company_phone = os.getenv("REACT_APP_COMPANY_PHONE")
company_address = os.getenv("REACT_APP_COMPANY_ADDRESS")
company_citystate = os.getenv("REACT_APP_COMPANY_CITYSTATE")

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

    # =========================
    # HEADER (LEFT / RIGHT)
    # =========================
    logo = ""
    logo_path = os.path.join(settings.MEDIA_ROOT, "branding/logo.png")
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=120, height=60)

    left_header = Paragraph(
        f"<b>{company_name}</b><br/>"
        f"{company_address}<br/>"
        f"{company_citystate}<br/>"
        f"{company_phone}<br/>"
        f"{admin_email}",
        styles["Normal"],
    )

    right_header = Paragraph(
        f"""
        <b>Invoice #:</b> {invoice.invoice_number}<br/>
        <br/>
        {invoice.customer}<br/>
        {invoice.customer.email}<br/>    
        """,
        ParagraphStyle(
            "RightHeader",
            parent=styles["Normal"],
            alignment=2,  # RIGHT
        ),
    )

    header_table = Table(
        [[
            Table([[logo], [left_header]], colWidths=[260]),
            right_header
        ]],
        colWidths=[330, 200],
    )

    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))

    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # =========================
    # PARTS
    # =========================
    parts = invoice.line_items.all()
    parts_subtotal = Decimal("0.00")

    if parts.exists():
        elements.append(Paragraph("Parts", styles["Heading2"]))

        part_rows = [["Description", "Qty", "Unit Price", "Line Total"]]

        for part in parts:
            line_total = part.total_price()
            parts_subtotal += line_total

            part_rows.append([
                part.description,
                str(part.quantity),
                f"${part.unit_price:.2f}",
                f"${line_total:.2f}",
            ])

        elements.append(_styled_table(part_rows, doc))
        elements.append(Spacer(1, 6))


    # =========================
    # LABOR
    # =========================
    labor_items = invoice.labor_items.all()
    labor_subtotal = Decimal("0.00")

    if labor_items.exists():
        elements.append(Paragraph("Labor", styles["Heading2"]))

        labor_rows = [["Description", "Hours", "Rate", "Line Total"]]

        for labor in labor_items:
            line_total = labor.total_price()
            labor_subtotal += line_total

            labor_rows.append([
                labor.description,
                f"{labor.hours}",
                f"${labor.hourly_rate:.2f}",
                f"${line_total:.2f}",
            ])

        elements.append(_styled_table(labor_rows, doc))
        elements.append(Spacer(1, 6))
    # =========================
    # BREAKDOWN / TOTALS
    # =========================
    subtotal = parts_subtotal + labor_subtotal
    tax_amount = subtotal * (invoice.tax_rate / Decimal("100"))

    elements.append(Spacer(1, 20))

    breakdown_rows = [
        ["Parts Total", f"${parts_subtotal:.2f}"],
        ["Labor Total", f"${labor_subtotal:.2f}"],
        ["Subtotal", f"${subtotal:.2f}"],
        [f"Tax ({invoice.tax_rate}%)", f"${tax_amount:.2f}"],
    ]

    if invoice.discount > 0:
        breakdown_rows.append(
            ["Discount", f"-${invoice.discount:.2f}"]
        )
    breakdown_rows.append(["", ""])
    breakdown_rows.append(
        ["Grand Total", f"${invoice.amount:.2f}"]
    )

    breakdown_table = Table(
        breakdown_rows,
        colWidths=[200, 120],
        hAlign="RIGHT",
    )

    breakdown_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.2, colors.white),
        ("FONT", (0, 0), (-1, -2), "Helvetica"),
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.transparent),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    elements.append(breakdown_table)

    # =========================
    # PAYMENTS
    # =========================
    payments = invoice.payment_set.all()
    total_paid = Decimal("0.00")

    if payments.exists():
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("Payments", styles["Heading2"]))

        payment_rows = [["Date", "Method", "Amount"]]

        for payment in payments:
            total_paid += payment.amount
            payment_rows.append([
                payment.payment_date.strftime("%Y-%m-%d"),
                payment.method,
                f"${payment.amount:.2f}",
            ])

        usable_width = LETTER[0] - doc.leftMargin - doc.rightMargin

        payment_table = Table(
            payment_rows,
            hAlign="LEFT",
            colWidths=[
                usable_width * 0.25,
                usable_width * 0.50,
                usable_width * 0.25,
            ],
        )

        payment_table.setStyle(TableStyle([
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        elements.append(payment_table)
        elements.append(Spacer(1, 10))

        balance_due = invoice.amount - total_paid

        elements.append(Paragraph(
            f"<b>Total Paid:</b> ${total_paid:.2f}",
            styles["Normal"]
        ))
        elements.append(Paragraph(
            f"<b>Balance Due:</b> ${balance_due:.2f}",
            styles["Heading2"] if balance_due > 0 else styles["Normal"]
        ))

    # --- Footer ---
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        "Thank you for your business!",
        styles["Italic"]
    ))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def _styled_table(data, doc):
    usable_width = LETTER[0] - doc.leftMargin - doc.rightMargin

    table = Table(
        data,
        hAlign="LEFT",
        colWidths=[
            usable_width * 0.55,  # Description
            usable_width * 0.10,  # Qty / Hours
            usable_width * 0.15,  # Unit / Rate
            usable_width * 0.20,  # Line Total
        ],
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
    ]))
    return table

    return table
