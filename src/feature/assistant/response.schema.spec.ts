import { predictionResponseSchema } from './response.schema';

describe('predictionResponseSchema', () => {
  it('accepts a status and summary', () => {
    const payload = {
      status: 'success',
      summary: 'Gold is 5000 NGN monthly.',
    };

    expect(predictionResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects a response that is missing the summary', () => {
    expect(() =>
      predictionResponseSchema.parse({ status: 'success' }),
    ).toThrow();
  });
});
