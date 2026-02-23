import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(resendApiKey || 're_mock_key');
    
    // In production, use your verified domain
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || 'BandReady <onboarding@resend.dev>';
  }

  async sendVerificationOtp(email: string, fullName: string, otp: string): Promise<boolean> {
    const firstName = fullName?.split(' ')[0] || 'there';
    
    this.logger.log(`Attempting to send OTP to ${email}`);
    
    // If we're in development and don't have a real API key, just log it
    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send OTP ${otp} to ${email}`);
      return true;
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your BandReady account',
        html: `
          <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2E3192;">Welcome to BandReady!</h2>
            <p>Hi ${firstName},</p>
            <p>Thanks for signing up. Please use the verification code below to complete your registration:</p>
            
            <div style="background-color: #F1F5F9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1E293B;">${otp}</span>
            </div>
            
            <p style="color: #64748B; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
            <p style="color: #64748B; font-size: 12px; text-align: center;">Team BandReady</p>
          </div>
        `,
      });

      this.logger.log(`Successfully sent OTP email to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      return false;
    }
  }
}
