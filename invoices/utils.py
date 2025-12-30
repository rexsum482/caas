from .pdf import generate_invoice_pdf
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from email.mime.image import MIMEImage
from pathlib import Path

def send_invoice_email(invoice, to_email):
    try:
        pdf_file = generate_invoice_pdf(invoice)

        subject = f"Invoice #{invoice.invoice_number}"

        text_body = (
            f"Dear {invoice.customer},\n"
            f"Please find attached invoice #{invoice.invoice_number}.\n\n"
            f"Thank you for your business!"
        )

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <img src="cid:banner_logo" style="max-width:600px;" />
            <p>Dear {invoice.customer},<br/>
            Please find attached invoice <strong>#{invoice.invoice_number}</strong>.</p>
            <p>Thank you for your business!</p>
          </body>
        </html>
        """

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )

        email.attach_alternative(html_body, "text/html")

        # Attach PDF
        email.attach(
            f"invoice_{invoice.invoice_number}.pdf",
            pdf_file,
            "application/pdf",
        )

        # Attach logo inline
        logo_path = Path(settings.BASE_DIR) / "staticfiles" / "media" / "rrr_banner_white.png"

        with open(logo_path, "rb") as f:
            logo = MIMEImage(f.read())
            logo.add_header("Content-ID", "<banner_logo>")
            logo.add_header("Content-Disposition", "inline", filename="rrr_banner_white.png")
            email.attach(logo)

        email.send(fail_silently=False)

        return f"Email sent to {to_email} successfully."

    except Exception as e:
        return f"Failed to send email to {to_email}. Error: {str(e)}"
