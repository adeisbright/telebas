import { IEnvironmentVariables } from '@/shared/types';

const config = (): IEnvironmentVariables => ({
  geminiModel: process.env.GEMINI_MODEL!,
  geminiKey: process.env.GEMINI_API_KEY!,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY!,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  paystackTransactionUrl: process.env.PAYSTACK_TRANSACTION_URL!,
  telegramToken: process.env.TELEGRAM_TOKEN!,
  telegramBaseUrl: process.env.TELEGRAM_BASE_URL!,
  telegramChatId: process.env.TELEGRAM_CHAT_ID!,
});

export default config;
export * from './validator';
