# Telebas

Telebas is a NestJS service that answers questions about Paystack subscription plans from a Telegram chat. A Telegram webhook delivers each message, Gemini decides whether to look up plans, and the reply is sent back to the same chat.

It only answers prompts about Paystack subscriptions. Anything else is turned away with a request to contact support.

## How a message is handled

1. Telegram posts an update to `POST /v1/chats`.
2. The body is validated as a Telegram message. Invalid payloads return `400` and are not processed.
3. The endpoint acknowledges the webhook immediately, then hands the message to the assistant.
4. Gemini receives the user's text and two tools:
   - `listPlan` — list plans on Paystack
   - `fetchPlan` — load one plan by its plan code
5. When a tool is called, Telebas queries the Paystack API and sends the result back to Gemini.
6. Gemini returns JSON with `status` and `summary`. That payload is posted to the originating Telegram chat with `sendMessage`.

If Gemini does not call a tool, or a later step fails, the chat receives a short fallback message instead of a plan summary.

## Stack

- [NestJS](https://nestjs.com/) 11 on Node.js
- [Google Gemini](https://ai.google.dev/) (`@google/genai`) for the assistant and tool calls
- [Paystack](https://paystack.com/docs/api/) for plan data
- [Telegram Bot API](https://core.telegram.org/bots/api) for inbound webhooks and outbound replies
- Zod for environment and request validation

## Prerequisites

- Node.js 20 or later
- A Gemini API key and model name
- A Paystack secret key with access to the Plan API
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A public HTTPS URL Telegram can reach (for example an ngrok tunnel while developing locally)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Model used for the assistant |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`Bearer` token for plan requests) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `PAYSTACK_TRANSACTION_URL` | Paystack API origin, such as `https://api.paystack.co` |
| `TELEGRAM_TOKEN` | Bot token from BotFather |
| `TELEGRAM_BASE_URL` | Telegram API origin, `https://api.telegram.org` |

The app refuses to start if any of these values is missing.

## Run

The server listens on port `3000`.

```bash
# development, with reload
npm run start:dev

# one-off
npm run start

# compiled output
npm run build
npm run start:prod
```

## Telegram webhook

Point the bot webhook at the public URL of the chat endpoint:

```text
https://<your-host>/v1/chats
```

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<your-host>/v1/chats"}'
```

A valid update looks like this:

```json
{
  "update_id": 1,
  "message": {
    "message_id": 10,
    "from": {
      "id": 99,
      "is_bot": false,
      "first_name": "Ada",
      "language_code": "en"
    },
    "chat": {
      "id": 99,
      "first_name": "Ada",
      "type": "private"
    },
    "date": 1700000000,
    "text": "What plans do you have?"
  }
}
```

A well-formed webhook is acknowledged with `201`:

```json
{
  "message": "Webook message acknowledged"
}
```

The assistant reply arrives in Telegram after that acknowledgement. `chat.type` must be `private` or `public`.

## Project layout

```text
src/
  main.ts                 Helmet, CORS, URI versioning, port 3000
  config/                 Env loading and Zod validation
  feature/
    chat/                 POST /v1/chats webhook
    assistant/            Gemini subscription advisor and response schema
    payment/              Paystack plan and subscription client
    telegram/             sendMessage and webhook helpers
  shared/
    lib/                  HTTP client (timeouts and retries) and Zod pipe
    errors/               Global exception filter
test/
  chat.e2e-spec.ts        Webhook integration tests
```

Paystack access also includes listing subscriptions and creating a plan. The assistant currently calls `listPlans` and `fetchPlanData` only.

Outbound HTTP calls time out after 5 seconds and retry up to twice on `429`, `5xx`, and network failures, with exponential backoff.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled app |
| `npm test` | Unit tests |
| `npm run test:e2e` | Webhook integration tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run lint` | ESLint with autofix |
| `npm run format` | Prettier |

The pre-commit hook runs format, lint, and unit tests.

## License

Private and unlicensed.
