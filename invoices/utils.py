from django.core.mail import EmailMessage
from .pdf import generate_invoice_pdf

def send_invoice_email(invoice, to_email):
    try:
        pdf_file = generate_invoice_pdf(invoice)

        subject = f"Invoice #{invoice.invoice_number} from {invoice.customer}"
        body = (
            f"Dear {invoice.customer},\n\n"
            f"Please find attached invoice #{invoice.invoice_number}.\n\n"
            f"Thank you for your business!"
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email="rexsum420@gmail.com",
            to=[to_email],
        )
        print("EmailMessage created successfully.")
        try:
            email.attach(
                f"invoice_{invoice.invoice_number}.pdf",
                pdf_file,
                "application/pdf",
            )
            print("PDF attached successfully.")
        except Exception as e:
            print(f"Failed to attach PDF. Error: {str(e)}")
            return f"Failed to attach PDF. Error: {str(e)}"

        email.send(fail_silently=False)

        return f"Email sent to {to_email} successfully."

    except Exception as e:
        return f"Failed to send email to {to_email}. Error: {str(e)}"
