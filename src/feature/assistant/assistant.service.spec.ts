jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { ITelegramWebhookMessage } from '@/shared/types/telegram';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGenAI } from '@google/genai';
import { Paystack } from '../payment/paystack';
import { TelegramService } from '../telegram/telegram.service';
import { AssistantService } from './assistant.service';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    interactions: {
      create: jest.fn(),
    },
  })),
}));

const webhook = (
  text = 'What plans do you have?',
): ITelegramWebhookMessage => ({
  update_id: 7,
  message: {
    message_id: 11,
    from: {
      id: 55,
      is_bot: false,
      first_name: 'Ada',
      language_code: 'en',
    },
    chat: {
      id: 55,
      first_name: 'Ada',
      type: 'private',
    },
    date: 1700000000,
    text,
  },
});

describe('AssistantService', () => {
  let service: AssistantService;
  let create: jest.Mock;
  const telegram = {
    messageTelegram: jest.fn(),
  };
  const paystack = {
    listPlans: jest.fn(),
    fetchPlanData: jest.fn(),
  };

  beforeEach(async () => {
    jest.mocked(GoogleGenAI).mockClear();
    telegram.messageTelegram.mockReset();
    paystack.listPlans.mockReset();
    paystack.fetchPlanData.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'geminiKey') {
                return 'test-gemini-key';
              }
              if (key === 'geminiModel') {
                return 'test-gemini-model';
              }
              return undefined;
            },
          },
        },
        { provide: TelegramService, useValue: telegram },
        { provide: Paystack, useValue: paystack },
      ],
    }).compile();

    service = module.get(AssistantService);
    const client = jest.mocked(GoogleGenAI).mock.results.at(-1)?.value as {
      interactions: { create: jest.Mock };
    };
    create = client.interactions.create;
    create.mockReset();
  });

  const listPlanTool = {
    type: 'function',
    description: 'List Plans on Paystack',
    name: 'listPlan',
  };
  const fetchPlanTool = {
    type: 'function',
    description: 'List Plans on Paystack',
    name: 'fetchPlan',
    parameters: {
      type: 'object',
      properties: {
        planCode: {
          type: 'string',
          description: 'The id or code for the subscription plan',
        },
      },
      required: ['planCode'],
    },
  };

  it('lists plans and replies on Telegram with the advisor summary', async () => {
    const plans = { status: true, data: [{ plan_code: 'PLN_gold' }] };
    const summary = { status: 'success', summary: 'Gold plan is available.' };
    paystack.listPlans.mockResolvedValueOnce(plans);
    telegram.messageTelegram.mockResolvedValueOnce({ ok: true });
    create
      .mockResolvedValueOnce({
        id: 'interaction-1',
        steps: [{ type: 'function_call', name: 'listPlan', id: 'call-1' }],
      })
      .mockResolvedValueOnce({
        output_text: JSON.stringify(summary),
      });

    await expect(service.subscriptionAdvisor(webhook())).resolves.toEqual({
      ok: true,
    });

    expect(create).toHaveBeenNthCalledWith(1, {
      model: 'test-gemini-model',
      input: 'What plans do you have?',
      tools: [listPlanTool, fetchPlanTool],
      system_instruction: `Do Not Process Any prompt that is not related to paystack subscriptions.
    For any of such prompt. Respond with : Please, contact support`,
    });
    expect(paystack.listPlans).toHaveBeenCalledTimes(1);
    expect(paystack.fetchPlanData).not.toHaveBeenCalled();
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'test-gemini-model',
        previous_interaction_id: 'interaction-1',
        input: [
          {
            type: 'function_result',
            name: 'listPlan',
            call_id: 'call-1',
            result: [{ type: 'text', text: JSON.stringify(plans) }],
          },
        ],
      }),
    );
    expect(telegram.messageTelegram).toHaveBeenCalledWith(
      JSON.stringify(summary),
      55,
    );
  });

  it('fetches a single plan when Gemini calls fetchPlan', async () => {
    const plan = { status: true, data: { plan_code: 'PLN_gold' } };
    const summary = { status: 'success', summary: 'Gold is 5000 NGN.' };
    paystack.fetchPlanData.mockResolvedValueOnce(plan);
    telegram.messageTelegram.mockResolvedValueOnce({ ok: true });
    create
      .mockResolvedValueOnce({
        id: 'interaction-2',
        steps: [
          {
            type: 'function_call',
            name: 'fetchPlan',
            id: 'call-2',
            arguments: { planCode: 'PLN_gold' },
          },
        ],
      })
      .mockResolvedValueOnce({
        output_text: JSON.stringify(summary),
      });

    await service.subscriptionAdvisor(webhook('Tell me about PLN_gold'));

    expect(paystack.fetchPlanData).toHaveBeenCalledWith('PLN_gold');
    expect(paystack.listPlans).not.toHaveBeenCalled();
    expect(telegram.messageTelegram).toHaveBeenCalledWith(
      JSON.stringify(summary),
      55,
    );
  });

  it('sends an apology and then an error when Gemini calls no tool', async () => {
    create.mockResolvedValueOnce({
      id: 'interaction-3',
      steps: [{ type: 'model_output' }],
    });

    await service.subscriptionAdvisor(webhook('hello'));

    expect(telegram.messageTelegram).toHaveBeenNthCalledWith(
      1,
      'Sorry, we currently do not have a response now',
      55,
    );
    expect(telegram.messageTelegram).toHaveBeenNthCalledWith(
      2,
      'Sorry, we encountered an error',
      55,
    );
    expect(paystack.listPlans).not.toHaveBeenCalled();
  });

  it('tells the user when the advisor response is not valid JSON', async () => {
    create
      .mockResolvedValueOnce({
        id: 'interaction-4',
        steps: [{ type: 'function_call', name: 'listPlan', id: 'call-4' }],
      })
      .mockResolvedValueOnce({
        output_text: 'not-json',
      });
    paystack.listPlans.mockResolvedValueOnce({ data: [] });

    await expect(
      service.subscriptionAdvisor(webhook()),
    ).resolves.toBeUndefined();

    expect(telegram.messageTelegram).toHaveBeenCalledWith(
      'Sorry, we encountered an error',
      55,
    );
  });

  it('tells the user when Gemini fails', async () => {
    create.mockRejectedValueOnce(new Error('gemini down'));

    await expect(
      service.subscriptionAdvisor(webhook()),
    ).resolves.toBeUndefined();

    expect(telegram.messageTelegram).toHaveBeenCalledWith(
      'Sorry, we encountered an error',
      55,
    );
  });
});
