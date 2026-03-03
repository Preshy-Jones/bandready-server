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

  async sendExamReminder(email: string, fullName: string | null, daysLeft: number): Promise<boolean> {
    const firstName = fullName?.split(' ')[0] || 'there';
    
    let subject = '';
    let messageHeadline = '';
    let body = '';
    let intensityHighlight = '';
    
    if (daysLeft === 30) {
      subject = 'Your IELTS exam is 30 days away! 📅';
      messageHeadline = '1 Month Countdown';
      body = 'You have exactly 30 days left until your target IELTS exam date. It’s time to ramp up your preparation and identify your key weaknesses.';
      intensityHighlight = 'Suggested Intensity: Ramping Up. Focus on taking 1-2 full mock tests per week and tracking your weakest areas.';
    } else if (daysLeft === 14) {
      subject = 'Your IELTS exam is 2 weeks away! ⚡';
      messageHeadline = '14 Days to Go';
      body = 'You are in the final 2 weeks of your preparation. Time to start simulating real test conditions and building your stamina.';
      intensityHighlight = 'Suggested Intensity: High Intensity. Practice under strict time conditions and get immediate AI feedback on your writing and speaking.';
    } else if (daysLeft === 3) {
      subject = 'Your IELTS exam is 3 days away! 🚀';
      messageHeadline = 'Final Stretch';
      body = 'The big day is almost here! You’ve put in the work. Now it’s time to avoid learning new things and focus entirely on review and test strategy.';
      intensityHighlight = 'Suggested Intensity: Final Stretch. Review past mistakes, rest properly, and mentally prepare for exam day.';
    } else {
      return false; // Skip if it's not a specified milestone
    }

    this.logger.log(`Attempting to send ${daysLeft}-day Exam Reminder to ${email}`);

    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send ${daysLeft}-day reminder to ${email}`);
      return true;
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2E3192;">${messageHeadline}</h2>
            <p>Hi ${firstName},</p>
            <p>${body}</p>
            
            <div style="background-color: #F1F5F9; border-left: 4px solid #2E3192; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #1E293B; font-weight: 500;">${intensityHighlight}</p>
            </div>
            
            <p>Log in to BandReady today and stay on track with your goals.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bandready.com/dashboard" style="background-color: #2E3192; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
            <p style="color: #64748B; font-size: 12px; text-align: center;">Team BandReady</p>
          </div>
        `,
      });

      this.logger.log(`Successfully sent ${daysLeft}-day reminder email to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send ${daysLeft}-day reminder email to ${email}`, error);
      return false;
    }
  }

  async sendWaitlistConfirmation(email: string, firstName?: string | null): Promise<boolean> {
    const nameStr = firstName ? firstName : 'there';
    
    this.logger.log(`Attempting to send Waitlist confirmation to ${email}`);
    
    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send Waitlist Confirmation to ${email}`);
      return true;
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'You are on the Waitlist! 🚀',
        html: `
          <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2E3192;">You're in line!</h2>
            <p>Hi ${nameStr},</p>
            <p>Thanks for joining the waitlist for BandReady. We're currently hard at work building the most advanced AI-powered IELTS platform to help you achieve your target band score with ease.</p>
            
            <p>We'll notify you as soon as early access opens.</p>
            
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
            <p style="color: #64748B; font-size: 12px; text-align: center;">Team BandReady</p>
          </div>
        `,
      });

      this.logger.log(`Successfully sent Waitlist confirmation email to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Waitlist confirmation email to ${email}`, error);
      return false;
    }
  }
}

