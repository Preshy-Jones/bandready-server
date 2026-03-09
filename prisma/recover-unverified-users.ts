import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

type Options = {
  from?: Date;
  to?: Date;
  email?: string;
  limit?: number;
  execute: boolean;
};

type EnvMap = Record<string, string>;

const prisma = new PrismaClient();

class CliError extends Error {}

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    execute: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--':
        break;
      case '--from':
        options.from = parseDateArg(next, '--from');
        i += 1;
        break;
      case '--to':
        options.to = parseDateArg(next, '--to');
        i += 1;
        break;
      case '--email':
        if (!next) {
          throw new CliError('Missing value for --email');
        }
        options.email = next.toLowerCase();
        i += 1;
        break;
      case '--limit':
        if (!next) {
          throw new CliError('Missing value for --limit');
        }
        options.limit = Number.parseInt(next, 10);
        if (!Number.isFinite(options.limit) || options.limit <= 0) {
          throw new CliError('--limit must be a positive integer');
        }
        i += 1;
        break;
      case '--execute':
        options.execute = true;
        break;
      case '--help':
        printUsage();
        process.exit(0);
      default:
        throw new CliError(`Unknown argument: ${arg}`);
    }
  }

  if (!options.from && !options.to && !options.email) {
    throw new CliError('Provide at least one of --from, --to, or --email');
  }

  return options;
}

function parseDateArg(value: string | undefined, flagName: string): Date {
  if (!value) {
    throw new CliError(`Missing value for ${flagName}`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new CliError(`Invalid date for ${flagName}: ${value}`);
  }

  return date;
}

function printUsage(): void {
  console.log(`
Usage:
  pnpm otp:recover -- --from 2026-03-09T16:00:00Z --to 2026-03-09T18:00:00Z
  pnpm otp:recover -- --email user@example.com
  pnpm otp:recover -- --from 2026-03-09T16:00:00Z --to 2026-03-09T18:00:00Z --execute

Options:
  --from <ISO date>   Lower bound for user createdAt
  --to <ISO date>     Upper bound for user createdAt
  --email <email>     Target one specific unverified user
  --limit <n>         Limit number of users processed
  --execute           Rotate OTPs and resend emails. Without this, the script is dry-run only.
  --help              Show this message
`);
}

async function sendOtpEmail(email: string, fullName: string | null, otp: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.MAIL_FROM;

  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is missing' };
  }

  if (!fromEmail) {
    return { ok: false, error: 'MAIL_FROM is missing' };
  }

  const resend = new Resend(apiKey);
  const firstName = fullName?.split(' ')[0] || 'there';
  const response = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Verify your BandReady account',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2E3192;">Welcome to BandReady!</h2>
        <p>Hi ${firstName},</p>
        <p>We had an earlier delivery issue with verification emails. Please use the fresh verification code below to complete your registration:</p>
        <div style="background-color: #F1F5F9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1E293B;">${otp}</span>
        </div>
        <p style="color: #64748B; font-size: 14px;">This code will expire in 15 minutes.</p>
        <p style="color: #64748B; font-size: 14px;">If you already left the verification page, just log in again and we will send you another fresh code.</p>
        <p>If you already verified your email, you can ignore this message.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;" />
        <p style="color: #64748B; font-size: 12px; text-align: center;">Team BandReady</p>
      </div>
    `,
  });

  if (response.error) {
    return {
      ok: false,
      error: `${response.error.name}: ${response.error.message}`,
    };
  }

  return { ok: true };
}

async function main(): Promise<void> {
  loadEnvFile();
  const options = parseArgs(process.argv.slice(2));

  const users = await prisma.user.findMany({
    where: {
      isEmailVerified: false,
      ...(options.email ? { email: options.email } : {}),
      ...(options.from || options.to
        ? {
            createdAt: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: options.limit,
    select: {
      id: true,
      email: true,
      fullName: true,
      createdAt: true,
      emailVerificationOtpExpiry: true,
    },
  });

  if (users.length === 0) {
    console.log('No matching unverified users found.');
    return;
  }

  console.log(`Found ${users.length} unverified user(s):`);
  for (const user of users) {
    console.log(
      `- ${user.email} | created ${user.createdAt.toISOString()} | current OTP expiry ${user.emailVerificationOtpExpiry?.toISOString() ?? 'none'}`,
    );
  }

  if (!options.execute) {
    console.log('\nDry run only. Re-run with --execute to rotate OTPs and resend emails.');
    return;
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const user of users) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: otp,
        emailVerificationOtpExpiry: expiry,
      },
    });

    const result = await sendOtpEmail(user.email, user.fullName, otp);
    if (!result.ok) {
      failedCount += 1;
      console.error(`Failed: ${user.email} | ${result.error}`);
      continue;
    }

    sentCount += 1;
    console.log(`Sent: ${user.email}`);
  }

  console.log(`\nCompleted. Sent: ${sentCount}. Failed: ${failedCount}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    if (error instanceof CliError) {
      printUsage();
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
