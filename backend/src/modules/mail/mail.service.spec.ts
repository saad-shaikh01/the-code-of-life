import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.spyOn(nodemailer, 'createTransport');

describe('MailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    } as never);
  });

  afterEach(() => {
    mockCreateTransport.mockReset();
  });

  it('sends password reset mail when SMTP is configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '587',
                SMTP_USER: 'smtp-user',
                SMTP_PASS: 'smtp-pass',
                SMTP_FROM: 'The Code of Life <noreply@thecodeoflife.com>',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    const service = module.get<MailService>(MailService);

    await expect(
      service.sendPasswordResetEmail(
        'user@example.com',
        'http://localhost:3000/reset-password?token=abc',
      ),
    ).resolves.toBeUndefined();

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'The Code of Life <noreply@thecodeoflife.com>',
        to: 'user@example.com',
        subject: 'Reset Your Password - The Code of Life',
      }),
    );
  });

  it('gracefully skips verification mail when SMTP is unconfigured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const service = module.get<MailService>(MailService);

    await expect(
      service.sendVerificationEmail(
        'user@example.com',
        'http://localhost:3000/verify-email?token=abc',
      ),
    ).resolves.toBeUndefined();

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
