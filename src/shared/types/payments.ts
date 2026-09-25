export enum IPaystackPlanInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  QUARTERLY = 'quarterly',
  BIANNUALLY = 'biannually',
  ANNUALLY = 'annually',
}
export interface ICreatePlan {
  name: string;
  interval: IPaystackPlanInterval;
  amount: number;
  description?: string;
  send_invoices?: boolean;
}

export interface IPlanData {
  name: string;
  interval: string;
  amount: number;
  integration: string | number;
  domain: string;
  currency: string;
  plan_code: string;
  invoice_limit: number;
  send_invoices: boolean;
  send_sms: boolean;
  hosted_page: boolean;
  migrate: boolean;
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePlanResponse {
  status: boolean;
  message: string;
  data: IPlanData;
}

export interface IListPlanResponse {
  status: boolean;
  message: string;
  data: IPlanData[];
  meta: {
    total: number;
    skipped: number;
    perPage: number;
    page: number;
    pageCount: number;
  };
}
