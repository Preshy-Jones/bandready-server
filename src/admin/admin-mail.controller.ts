import { Body, Controller, Get, HttpCode, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { MailService } from '../mail/mail.service';

type Audience = 'all' | 'free' | 'premium';

@Controller('admin/mail')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminMailController {
  constructor(private readonly mailService: MailService) {}

  @Get('broadcast/preview')
  async previewAudience(@Query('audience') audience: Audience = 'all') {
    const count = await this.mailService.getBroadcastRecipientCount(audience);
    return { count };
  }

  @Post('user')
  @HttpCode(200)
  async sendToUser(
    @Body()
    body: {
      userId: string;
      subject: string;
      body: string;
      ctaLabel?: string;
      ctaUrl?: string;
    },
  ) {
    const ok = await this.mailService.sendToUser({
      userId: body.userId,
      subject: body.subject,
      body: body.body,
      ctaLabel: body.ctaLabel,
      ctaUrl: body.ctaUrl,
    });
    if (!ok) throw new NotFoundException('User not found or send failed');
    return { success: true };
  }

  @Post('broadcast')
  async sendBroadcast(
    @Body()
    body: {
      subject: string;
      body: string;
      audience?: Audience;
      userIds?: string[];
      ctaLabel?: string;
      ctaUrl?: string;
    },
  ) {
    return this.mailService.sendBroadcast({
      subject: body.subject,
      body: body.body,
      audience: body.audience,
      userIds: body.userIds,
      ctaLabel: body.ctaLabel,
      ctaUrl: body.ctaUrl,
    });
  }
}
