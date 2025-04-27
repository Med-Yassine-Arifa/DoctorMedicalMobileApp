import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(to_email, otp):
    # Email configuration
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "noreply.medicalappp@gmail.com" # Replace with your noreply email
    sender_password = "jynr vxjq wpba egyv"  # Replace with your app-specific password

    subject = "Password Reset OTP"
    body = f"""
    Hello,

    We received a request to reset your password. Use the following OTP to proceed:

    OTP: {otp}

    This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.

    Best regards,
    Your Medical App Team
    """
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to the SMTP server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)

        # Send the email
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False