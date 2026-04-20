import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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

  @Post('broadcast')
  async sendBroadcast(
    @Body()
    body: {
      subject: string;
      body: string;
      audience: Audience;
      ctaLabel?: string;
      ctaUrl?: string;
    },
  ) {
    return this.mailService.sendBroadcast({
      subject: body.subject,
      body: body.body,
      audience: body.audience,
      ctaLabel: body.ctaLabel,
      ctaUrl: body.ctaUrl,
    });
  }
}
