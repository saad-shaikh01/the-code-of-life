import { validateEnv } from './main';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when JWT_SECRET is missing', () => {
    process.env.DATABASE_URL = 'postgresql://example';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow(
      'Missing required environment variable: JWT_SECRET',
    );
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    process.env.DATABASE_URL = 'postgresql://example';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'jwt-secret';
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => validateEnv()).toThrow(
      'Missing required environment variable: JWT_REFRESH_SECRET',
    );
  });

  it('throws when FRONTEND_URL is missing', () => {
    process.env.DATABASE_URL = 'postgresql://example';
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    delete process.env.FRONTEND_URL;

    expect(() => validateEnv()).toThrow(
      'Missing required environment variable: FRONTEND_URL',
    );
  });

  it('passes when all required environment variables are present', () => {
    process.env.DATABASE_URL = 'postgresql://example';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';

    expect(() => validateEnv()).not.toThrow();
  });
});
