import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../common/prisma/prisma.service';
import { baseEmail, ctaButton, textToParagraphs, infoBox, otpBlock, emailH2, emailP } from './mail.templates';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(resendApiKey || 're_mock_key');
    
    // In production, use your verified domain
    this.fromEmail = this.configService.get<string>('MAIL_FROM') || 'BandReady <onboarding@resend.dev>';
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string | null | undefined,
    resetToken: string,
  ): Promise<boolean> {
    const firstName = fullName?.split(' ')[0] || 'there';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    this.logger.log(`Attempting to send password reset email to ${email}`);

    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send password reset link ${resetUrl} to ${email}`);
      return true;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your BandReady password',
        html: baseEmail(`
          ${emailH2('Reset your password')}
          ${emailP(`Hi ${firstName},`)}
          ${emailP('We received a request to reset your BandReady password.')}
          ${ctaButton(resetUrl, 'Reset Password')}
          ${emailP('This link will expire in 1 hour.')}
          ${emailP('If you did not request this, you can safely ignore this email.')}
        `),
      });

      if (response.error) {
        this.logger.error(
          `Resend rejected password reset email to ${email}: ${response.error.name} - ${response.error.message}`,
        );
        return false;
      }

      this.logger.log(`Successfully sent password reset email to ${email}. ID: ${response.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      return false;
    }
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
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your BandReady account',
        html: baseEmail(`
          ${emailH2('Welcome to BandReady!')}
          ${emailP(`Hi ${firstName},`)}
          ${emailP('Thanks for signing up. Please use the verification code below to complete your registration:')}
          ${otpBlock(otp)}
          ${emailP('This code will expire in 15 minutes.')}
          ${emailP('If you already left the verification page, just log in again and we will send you a fresh code.')}
          ${emailP("If you didn't request this, you can safely ignore this email.")}
        `),
      });

      if (response.error) {
        this.logger.error(
          `Resend rejected OTP email to ${email}: ${response.error.name} - ${response.error.message}`,
        );
        return false;
      }

      this.logger.log(`Successfully sent OTP email to ${email}. ID: ${response.data?.id}`);
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
        html: baseEmail(`
          ${emailH2(messageHeadline)}
          ${emailP(`Hi ${firstName},`)}
          ${emailP(body)}
          ${infoBox(intensityHighlight)}
          ${emailP('Log in to BandReady today and stay on track with your goals.')}
          ${ctaButton('https://bandready.app/dashboard', 'Go to Dashboard')}
        `),
      });

      this.logger.log(`Successfully sent ${daysLeft}-day reminder email to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send ${daysLeft}-day reminder email to ${email}`, error);
      return false;
    }
  }

  async sendSubscriptionExpiryReminder(email: string, fullName: string | null, daysLeft: number): Promise<boolean> {
    const firstName = fullName?.split(' ')[0] || 'there';

    let subject = '';
    let messageHeadline = '';
    let body = '';
    let ctaText = '';

    if (daysLeft === 3) {
      subject = 'Your BandReady Premium expires in 3 days';
      messageHeadline = 'Your Premium Expires Soon';
      body = 'Your BandReady Premium subscription expires in 3 days. Renew now to keep your unlimited practice sessions and AI-powered feedback without interruption.';
      ctaText = 'Renew Premium Now';
    } else if (daysLeft === 1) {
      subject = 'Last day of your BandReady Premium';
      messageHeadline = 'Last Day of Premium';
      body = 'Today is the last day of your BandReady Premium subscription. Renew immediately to avoid losing access to unlimited sessions and AI feedback.';
      ctaText = 'Renew Before It Expires';
    } else {
      return false;
    }

    this.logger.log(`Attempting to send subscription expiry reminder (${daysLeft} days) to ${email}`);

    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send ${daysLeft}-day expiry reminder to ${email}`);
      return true;
    }

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: baseEmail(`
          ${emailH2(messageHeadline)}
          ${emailP(`Hi ${firstName},`)}
          ${emailP(body)}
          ${infoBox("Don't lose your progress momentum — renew and keep practising every day.")}
          ${ctaButton('https://bandready.app/pricing', ctaText)}
        `),
      });

      this.logger.log(`Successfully sent ${daysLeft}-day expiry reminder to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send ${daysLeft}-day expiry reminder to ${email}`, error);
      return false;
    }
  }

  async sendPremiumWelcome(email: string, fullName: string | null, expiresAt: Date): Promise<void> {
    const firstName = fullName?.split(' ')[0] || 'there';
    const expiryStr = expiresAt.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send premium welcome to ${email}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: "You're now a BandReady Premium member!",
        html: baseEmail(`
          ${emailH2('Welcome to Premium!')}
          ${emailP(`Hi ${firstName},`)}
          ${emailP('Your payment was successful. You now have full access to BandReady Premium — unlimited speaking and writing practice sessions, AI-powered feedback, and everything you need to hit your target band score.')}
          ${infoBox(`Your Premium subscription is active until ${expiryStr}.`)}
          ${emailP('Start practising right away and make the most of your membership.')}
          ${ctaButton('https://bandready.app/practice', 'Start Practising')}
        `),
      });
      this.logger.log(`Sent premium welcome to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send premium welcome to ${email}`, err);
    }
  }

  async sendPackConfirmation(email: string, fullName: string | null, credits = 0): Promise<void> {
    const firstName = fullName?.split(' ')[0] || 'there';
    const packSummary = `${credits} credit${credits !== 1 ? 's' : ''}`;

    if (!this.configService.get<string>('RESEND_API_KEY')) {
      this.logger.warn(`[DEV MODE] Would send pack confirmation to ${email}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your BandReady sessions are ready!',
        html: baseEmail(`
          ${emailH2('Your pack is activated!')}
          ${emailP(`Hi ${firstName},`)}
          ${emailP('Thanks for your purchase! Your credits have been added to your account and are ready to use right now.')}
          ${infoBox(`Added to your account: ${packSummary}`)}
          ${emailP('Jump straight in and put them to use.')}
          ${ctaButton('https://bandready.app/practice', 'Start Practising')}
        `),
      });
      this.logger.log(`Sent pack confirmation to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send pack confirmation to ${email}`, err);
    }
  }

  async sendToUser(opts: {
    userId: string;
    subject: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }): Promise<boolean> {
    const { userId, subject, body, ctaLabel, ctaUrl } = opts;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (!user) {
      this.logger.warn(`sendToUser: user ${userId} not found`);
      return false;
    }

    const firstName = user.fullName?.split(' ')[0] || 'there';
    const html = baseEmail(`
      ${emailH2(subject)}
      ${emailP(`Hi ${firstName},`)}
      ${textToParagraphs(body)}
      ${ctaLabel && ctaUrl ? ctaButton(ctaUrl, ctaLabel) : ''}
    `);

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(`sendToUser failed for ${user.email}: ${result.error.message}`);
        return false;
      }

      this.logger.log(`sendToUser: sent "${subject}" to ${user.email}`);
      return true;
    } catch (err) {
      this.logger.error(`sendToUser: exception for ${user.email}`, err);
      return false;
    }
  }

  async getBroadcastRecipientCount(audience: 'all' | 'free' | 'premium'): Promise<number> {
    const where = this.buildAudienceWhere(audience);
    return this.prisma.user.count({ where });
  }

  async sendBroadcast(opts: {
    subject: string;
    body: string;
    audience?: 'all' | 'free' | 'premium';
    userIds?: string[];
    ctaLabel?: string;
    ctaUrl?: string;
    from?: string;
  }): Promise<{ sent: number; failed: number }> {
    const { subject, body, audience, userIds, ctaLabel, ctaUrl, from } = opts;
    const fromEmail = from || this.fromEmail;

    const where = userIds?.length
      ? { id: { in: userIds }, isEmailVerified: true }
      : this.buildAudienceWhere(audience ?? 'all');

    const users = await this.prisma.user.findMany({
      where,
      select: { email: true, fullName: true },
    });

    if (users.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const messages = users.map((u) => {
      const firstName = u.fullName?.split(' ')[0] || 'there';
      const html = baseEmail(`
        ${emailH2(subject)}
        ${emailP(`Hi ${firstName},`)}
        ${textToParagraphs(body)}
        ${ctaLabel && ctaUrl ? ctaButton(ctaUrl, ctaLabel) : ''}
      `);
      return { from: fromEmail, to: u.email, subject, html };
    });

    // Resend batch accepts max 100 per call — chunk if needed
    const CHUNK = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i += CHUNK) {
      const chunk = messages.slice(i, i + CHUNK);
      try {
        const result = await this.resend.batch.send(chunk);
        if (result.error) {
          this.logger.error(`Broadcast batch error: ${result.error.message}`);
          failed += chunk.length;
        } else {
          sent += chunk.length;
        }
      } catch (err) {
        this.logger.error('Broadcast batch send failed', err);
        failed += chunk.length;
      }
    }

    this.logger.log(`Broadcast "${subject}" → audience=${audience}: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  }

  private buildAudienceWhere(audience: 'all' | 'free' | 'premium') {
    const base = { isEmailVerified: true, role: 'USER' as const };
    if (audience === 'free') {
      return { ...base, subscriptionTier: 'none' };
    }
    if (audience === 'premium') {
      return { ...base, subscriptionTier: { not: 'none' } };
    }
    return base;
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
        subject: 'You are on the Waitlist!',
        html: baseEmail(`
          ${emailH2("You're in line!")}
          ${emailP(`Hi ${nameStr},`)}
          ${emailP("Thanks for joining the waitlist for BandReady. We're currently hard at work building the most advanced AI-powered IELTS platform to help you achieve your target band score with ease.")}
          ${emailP("We'll notify you as soon as early access opens.")}
        `),
      });

      this.logger.log(`Successfully sent Waitlist confirmation email to ${email}. ID: ${data.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Waitlist confirmation email to ${email}`, error);
      return false;
    }
  }
}
