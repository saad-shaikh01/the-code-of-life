import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string | null;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>('SMTP_FROM') ?? null;

    const parsedPort = smtpPort ? Number.parseInt(smtpPort, 10) : NaN;

    if (
      smtpHost &&
      Number.isFinite(parsedPort) &&
      smtpUser &&
      smtpPass &&
      this.fromAddress
    ) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parsedPort,
        secure: parsedPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      return;
    }

    this.transporter = null;
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset Your Password - The Code of Life',
      text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Verify Your Email - The Code of Life',
      text: `Verify your email address using this link: ${verifyUrl}`,
      html: `<p>Verify your email address using this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter || !this.fromAddress) {
      this.logger.warn(
        `SMTP is not configured. Skipping "${options.subject}" email to ${options.to}.`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail transport error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send "${options.subject}" email to ${options.to}: ${message}`,
        stack,
      );
    }
  }
}
