import { Injectable, Logger } from '@nestjs/common';
import { PaystackTools } from './paystacktools.service';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(private readonly paystackTools: PaystackTools) {}

  getDefinitions() {
    return [...this.paystackTools.definitions()];
  }

  async execute(name: string, args: unknown) {
    this.logger.log(`Executing tool: ${name}`);

    switch (name) {
      case 'listPlans':
        return this.paystackTools.listPlans();

      case 'getPlan':
        return this.paystackTools.getPlan(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
