import {
  ICreatePlan,
  ICreatePlanResponse,
  IListPlanResponse,
} from '@/shared/types/payments';
import { httpClient } from '@/shared/lib';
import { IEnvironmentVariables } from '@/shared/types';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Paystack {
  private readonly paystackSecret: string;
  private readonly paystackTransactionUrl: string;
  constructor(
    private readonly configService: ConfigService<IEnvironmentVariables, true>,
  ) {
    this.paystackSecret = this.configService.get('paystackSecretKey');
    this.paystackTransactionUrl = this.configService.get(
      'paystackTransactionUrl',
    );
  }
  setHeaders() {
    const headers = {
      Authorization: `Bearer ${this.paystackSecret}`,
      'Content-Type': 'application/json',
    };
    return headers;
  }

  async listSubscriptions() {
    const url = new URL(`${this.paystackTransactionUrl}/subscription`);
    return await httpClient<any, unknown>({
      url,
      method: 'GET',
      headers: this.setHeaders(),
    });
  }

  async createPlan(planPayload: ICreatePlan) {
    const url = new URL(`${this.paystackTransactionUrl}/plan`);
    return await httpClient<ICreatePlanResponse, unknown>({
      url,
      method: 'POST',
      headers: this.setHeaders(),
      body: planPayload,
    });
  }

  async listPlans() {
    const url = new URL(`${this.paystackTransactionUrl}/plan`);
    return await httpClient<IListPlanResponse, unknown>({
      url,
      method: 'GET',
      headers: this.setHeaders(),
    });
  }

  async fetchPlanData(planCode: string) {
    const url = new URL(`${this.paystackTransactionUrl}/plan/${planCode}`);
    return await httpClient<ICreatePlanResponse, unknown>({
      url,
      method: 'GET',
      headers: this.setHeaders(),
    });
  }
}
