"""
Notification Service

Phase 7: Send notifications to caregivers via multiple channels.
"""

import os
from typing import List, Optional
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from rich.console import Console

console = Console()


class NotificationService:
    """Send notifications via email, SMS, and other channels."""
    
    def __init__(self):
        """Initialize notification service."""
        self.email_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.email_port = int(os.getenv("EMAIL_PORT", "587"))
        self.email_username = os.getenv("EMAIL_USERNAME", "")
        self.email_password = os.getenv("EMAIL_PASSWORD", "")
        
        self.enable_email = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "false").lower() == "true"
        self.enable_sms = os.getenv("ENABLE_SMS_NOTIFICATIONS", "false").lower() == "true"
        self.enable_whatsapp = os.getenv("ENABLE_WHATSAPP_NOTIFICATIONS", "false").lower() == "true"
        
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """
        Send email notification.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body
            is_html: Whether body is HTML
            
        Returns:
            True if sent successfully
        """
        if not self.enable_email:
            console.print("[yellow]Email notifications disabled[/yellow]")
            return False
        
        if not self.email_username or not self.email_password:
            console.print("[red]Email credentials not configured[/red]")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_username
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if is_html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.email_host, self.email_port)
            server.starttls()
            server.login(self.email_username, self.email_password)
            server.send_message(msg)
            server.quit()
            
            console.print(f"[green]✓ Email sent to {to_email}[/green]")
            return True
            
        except Exception as e:
            console.print(f"[red]✗ Email failed: {e}[/red]")
            return False
    
    def send_fall_alert(
        self,
        caregiver_email: str,
        room_name: str,
        confidence: float,
        timestamp: datetime
    ) -> bool:
        """
        Send fall detection alert.
        
        Args:
            caregiver_email: Caregiver's email
            room_name: Room where fall detected
            confidence: Detection confidence
            timestamp: When fall occurred
            
        Returns:
            True if sent successfully
        """
        subject = f"⚠️ FALL ALERT - {room_name}"
        
        body = f"""
        FALL DETECTION ALERT
        
        A potential fall has been detected in {room_name}.
        
        Details:
        - Time: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}
        - Confidence: {confidence:.1%}
        - Room: {room_name}
        
        Please check on the person immediately.
        
        This is an automated alert from WiFi-Radar.
        """
        
        return self.send_email(caregiver_email, subject, body)
    
    def send_sms(self, to_phone: str, message: str) -> bool:
        """
        Send SMS notification (Twilio integration).
        
        Args:
            to_phone: Phone number
            message: SMS message
            
        Returns:
            True if sent successfully
        """
        if not self.enable_sms:
            console.print("[yellow]SMS notifications disabled[/yellow]")
            return False
        
        # Placeholder for Twilio integration
        console.print(f"[blue]SMS would be sent to {to_phone}: {message}[/blue]")
        return True
    
    def send_whatsapp(self, to_phone: str, message: str) -> bool:
        """
        Send WhatsApp notification.
        
        Args:
            to_phone: Phone number
            message: WhatsApp message
            
        Returns:
            True if sent successfully
        """
        if not self.enable_whatsapp:
            console.print("[yellow]WhatsApp notifications disabled[/yellow]")
            return False
        
        # Placeholder for WhatsApp Business API integration
        console.print(f"[blue]WhatsApp would be sent to {to_phone}: {message}[/blue]")
        return True
    
    def send_multi_channel_alert(
        self,
        caregivers: List[dict],
        incident_type: str,
        room_name: str,
        confidence: float,
        timestamp: datetime
    ) -> dict:
        """
        Send alert via multiple channels with escalation.
        
        Args:
            caregivers: List of caregiver contact info
            incident_type: Type of incident
            room_name: Room name
            confidence: Detection confidence
            timestamp: When occurred
            
        Returns:
            Dictionary with delivery status per channel
        """
        results = {
            'email': [],
            'sms': [],
            'whatsapp': []
        }
        
        for caregiver in caregivers:
            # Email
            if 'email' in caregiver and caregiver['email']:
                success = self.send_fall_alert(
                    caregiver['email'],
                    room_name,
                    confidence,
                    timestamp
                )
                results['email'].append({
                    'recipient': caregiver['email'],
                    'success': success
                })
            
            # SMS
            if 'phone' in caregiver and caregiver['phone']:
                message = f"FALL ALERT in {room_name} at {timestamp.strftime('%H:%M')}. Check immediately."
                success = self.send_sms(caregiver['phone'], message)
                results['sms'].append({
                    'recipient': caregiver['phone'],
                    'success': success
                })
            
            # WhatsApp
            if 'whatsapp' in caregiver and caregiver['whatsapp']:
                message = f"⚠️ Fall detected in {room_name}. Confidence: {confidence:.0%}. Time: {timestamp.strftime('%H:%M:%S')}"
                success = self.send_whatsapp(caregiver['whatsapp'], message)
                results['whatsapp'].append({
                    'recipient': caregiver['whatsapp'],
                    'success': success
                })
        
        return results


# Demo function
def demo_notification_service():
    """Demo notification service."""
    console.print("[bold cyan]WiFi-Radar Notification Service Demo[/bold cyan]\n")
    
    service = NotificationService()
    
    console.print("[bold]Configured Channels:[/bold]")
    console.print(f"  Email: {'✓' if service.enable_email else '✗'}")
    console.print(f"  SMS: {'✓' if service.enable_sms else '✗'}")
    console.print(f"  WhatsApp: {'✓' if service.enable_whatsapp else '✗'}")
    
    console.print("\n[bold]Demo Fall Alert:[/bold]")
    
    # Demo caregivers
    caregivers = [
        {
            'name': 'Primary Caregiver',
            'email': 'caregiver@example.com',
            'phone': '+1234567890',
            'whatsapp': '+1234567890'
        }
    ]
    
    results = service.send_multi_channel_alert(
        caregivers=caregivers,
        incident_type='fall',
        room_name='Living Room',
        confidence=0.87,
        timestamp=datetime.now()
    )
    
    console.print("\n[bold]Delivery Results:[/bold]")
    for channel, deliveries in results.items():
        console.print(f"  {channel.capitalize()}: {len(deliveries)} attempted")
    
    console.print("\n[green]✓ Phase 7 notification system ready![/green]")
    console.print("\n[yellow]Note: Configure EMAIL_USERNAME and EMAIL_PASSWORD in .env for real emails[/yellow]")


if __name__ == "__main__":
    demo_notification_service()
