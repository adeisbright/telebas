jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { httpClient } from '@/shared/lib';
import {
  ICreatePlanResponse,
  IListPlanResponse,
  IPaystackPlanInterval,
} from '@/shared/types/payments';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Paystack } from './paystack';

jest.mock('@/shared/lib', () => ({
  httpClient: jest.fn(),
}));

describe('Paystack', () => {
  const secret = 'sk_test_secret';
  const baseUrl = 'https://api.paystack.co';
  let paystack: Paystack;

  const plan = {
    name: 'Gold',
    interval: IPaystackPlanInterval.WEEKLY,
    amount: 500000,
    integration: 1,
    domain: 'test',
    currency: 'NGN',
    plan_code: 'PLN_gold',
    invoice_limit: 0,
    send_invoices: true,
    send_sms: false,
    hosted_page: false,
    migrate: false,
    id: 10,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.mocked(httpClient).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Paystack,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'paystackSecretKey') {
                return secret;
              }
              if (key === 'paystackTransactionUrl') {
                return baseUrl;
              }
              return undefined;
            },
          },
        },
      ],
    }).compile();

    paystack = module.get(Paystack);
  });

  const request = () => jest.mocked(httpClient).mock.calls[0][0];

  it('lists subscriptions with bearer auth', async () => {
    const payload = { status: true, data: [] };
    jest.mocked(httpClient).mockResolvedValueOnce(payload);

    await expect(paystack.listSubscriptions()).resolves.toEqual(payload);

    expect(request().method).toBe('GET');
    expect(String(request().url)).toBe(`${baseUrl}/subscription`);
    expect(request().headers).toEqual({
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    });
  });

  it('creates a plan', async () => {
    const body = {
      name: 'Gold',
      interval: IPaystackPlanInterval.WEEKLY,
      amount: 500000,
      description: 'Monthly gold plan',
    };
    const response: ICreatePlanResponse = {
      status: true,
      message: 'Plan created',
      data: plan,
    };
    jest.mocked(httpClient).mockResolvedValueOnce(response);

    await expect(paystack.createPlan(body)).resolves.toEqual(response);

    expect(request().method).toBe('POST');
    expect(String(request().url)).toBe(`${baseUrl}/plan`);
    expect(request().body).toEqual(body);
    expect(request().headers).toEqual({
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    });
  });

  it('lists plans', async () => {
    const response: IListPlanResponse = {
      status: true,
      message: 'Plans retrieved',
      data: [plan],
      meta: {
        total: 1,
        skipped: 0,
        perPage: 50,
        page: 1,
        pageCount: 1,
      },
    };
    jest.mocked(httpClient).mockResolvedValueOnce(response);

    await expect(paystack.listPlans()).resolves.toEqual(response);
    expect(String(request().url)).toBe(`${baseUrl}/plan`);
    expect(request().method).toBe('GET');
  });

  it('fetches a plan by code', async () => {
    const response: ICreatePlanResponse = {
      status: true,
      message: 'Plan retrieved',
      data: plan,
    };
    jest.mocked(httpClient).mockResolvedValueOnce(response);

    await expect(paystack.fetchPlanData('PLN_gold')).resolves.toEqual(response);

    expect(String(request().url)).toBe(`${baseUrl}/plan/PLN_gold`);
    expect(request().method).toBe('GET');
  });

  it('propagates upstream failures', async () => {
    const error = new Error('Paystack unavailable');
    jest.mocked(httpClient).mockRejectedValueOnce(error);

    await expect(paystack.listPlans()).rejects.toBe(error);
  });
});
