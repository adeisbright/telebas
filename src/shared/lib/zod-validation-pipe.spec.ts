import { BadRequestException } from '@nestjs/common';
import * as z from 'zod';
import { ZodValidationPipe } from './zod-validation-pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    season: z.string().min(1),
    competition: z.string().min(1),
  });
  const pipe = new ZodValidationPipe(schema);

  it('returns the parsed query value', () => {
    const value = { season: '2026', competition: 'PL' };

    expect(pipe.transform(value, { type: 'query', metatype: Object })).toEqual(
      value,
    );
  });

  it('returns the parsed body value', () => {
    const value = { season: '2026', competition: 'PL' };

    expect(pipe.transform(value, { type: 'body', metatype: Object })).toEqual(
      value,
    );
  });

  it('rejects values that do not match the schema', () => {
    expect(() =>
      pipe.transform({ season: '' }, { type: 'body', metatype: Object }),
    ).toThrow(new BadRequestException('Validation failed'));
  });
});
