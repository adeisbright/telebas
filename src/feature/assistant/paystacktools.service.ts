import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Paystack } from '../payment/paystack';

const fetchPlanArgsSchema = z.object({
  planCode: z.string().min(1),
});

@Injectable()
export class PaystackTools {
  constructor(private readonly paystack: Paystack) {}

  definitions() {
    return [
      {
        type: 'function',
        description: 'List subscription plans available on Paystack',
        name: 'listPlans',
      } as const,

      {
        type: 'function',
        description: 'Get information about a Paystack subscription plan',
        name: 'getPlan',
        parameters: {
          type: 'object',
          properties: {
            planCode: {
              type: 'string',
              description: 'The Paystack plan code',
            },
          },
          required: ['planCode'],
        },
      } as const,
    ];
  }

  async listPlans() {
    return this.paystack.listPlans();
  }

  async getPlan(args: unknown) {
    const { planCode } = fetchPlanArgsSchema.parse(args);

    return this.paystack.fetchPlanData(planCode);
  }
}
