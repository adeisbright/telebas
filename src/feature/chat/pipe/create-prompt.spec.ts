import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '@/shared/lib/zod-validation-pipe';
import { createPromptSchema } from './create-prompt';

const webhook = () => ({
  update_id: 1,
  message: {
    message_id: 10,
    from: {
      id: 99,
      is_bot: false,
      first_name: 'Ada',
      language_code: 'en',
    },
    chat: {
      id: 99,
      first_name: 'Ada',
      type: 'private',
    },
    date: 1700000000,
    text: 'List the gold plan',
  },
});

describe('createPromptSchema', () => {
  const pipe = new ZodValidationPipe(createPromptSchema);

  it('accepts a private Telegram message', () => {
    const payload = webhook();

    expect(pipe.transform(payload, { type: 'body', metatype: Object })).toEqual(
      payload,
    );
  });

  it('accepts a public chat type', () => {
    const payload = webhook();
    payload.message.chat.type = 'public';

    expect(pipe.transform(payload, { type: 'body', metatype: Object })).toEqual(
      payload,
    );
  });

  it('rejects a payload that is missing the message text', () => {
    const payload = webhook();
    delete (payload.message as { text?: string }).text;

    expect(() =>
      pipe.transform(payload, { type: 'body', metatype: Object }),
    ).toThrow(BadRequestException);
    expect(() =>
      pipe.transform(payload, { type: 'body', metatype: Object }),
    ).toThrow('Validation failed');
  });

  it('rejects an unsupported chat type', () => {
    const payload = webhook();
    payload.message.chat.type = 'group';

    expect(() =>
      pipe.transform(payload, { type: 'body', metatype: Object }),
    ).toThrow(BadRequestException);
  });
});
