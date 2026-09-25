import { configValidationSchema } from './validator';

const validEnv = {
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_API_KEY: 'gemini-key',
  PAYSTACK_SECRET_KEY: 'sk_test',
  PAYSTACK_PUBLIC_KEY: 'pk_test',
  PAYSTACK_TRANSACTION_URL: 'https://api.paystack.co',
  TELEGRAM_BASE_URL: 'https://api.telegram.org',
  TELEGRAM_TOKEN: '123:abc',
};

describe('configValidationSchema', () => {
  it('accepts a complete environment', () => {
    expect(configValidationSchema.parse(validEnv)).toEqual(validEnv);
  });

  it('rejects an empty paystack secret', () => {
    expect(() =>
      configValidationSchema.parse({ ...validEnv, PAYSTACK_SECRET_KEY: '' }),
    ).toThrow();
  });
});
