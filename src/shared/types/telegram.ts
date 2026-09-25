export interface ITelegamMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: false;
    first_name: string;
    language_code: string;
  };
  chat: {
    id: number;
    first_name: string;
    type: 'private' | 'public';
  };
  date: number;
  text: string;
}

export interface ITelegramWebhookMessage {
  update_id: number;
  message: ITelegamMessage;
}
