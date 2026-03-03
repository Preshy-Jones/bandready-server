import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WaitlistService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto) {
    const existing = await this.prisma.waitlist.findUnique({
      where: { email: createWaitlistDto.email }
    });

    if (existing) {
      return { message: 'You are already on the waitlist!', entry: existing };
    }

    const entry = await this.prisma.waitlist.create({
      data: {
        email: createWaitlistDto.email,
        firstName: createWaitlistDto.firstName,
        lastName: createWaitlistDto.lastName,
      },
    });

    // Send confirmation email asynchronously
    this.mailService.sendWaitlistConfirmation(entry.email, entry.firstName).catch((err) => {
      console.error('Failed to send waitlist confirmation email', err);
    });

    return { message: 'Successfully joined the waitlist!', entry };
  }
}
