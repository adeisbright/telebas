import { TimeoutError } from '../errors';
import { httpClient } from './http-client';

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get: (name: string) => string | null };
  json: jest.Mock;
};

const mockResponse = ({
  ok = true,
  status = 200,
  statusText = 'OK',
  headers = {},
  json,
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  json?: unknown;
} = {}): MockResponse => {
  const headerMap = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok,
    status,
    statusText,
    headers: {
      get: (name: string) => headerMap[name.toLowerCase()] ?? null,
    },
    json: jest.fn().mockResolvedValue(json),
  };
};

const jsonResponse = <T>(data: T, status = 200) =>
  mockResponse({
    status,
    headers: { 'content-type': 'application/json' },
    json: data,
  });

const errorResponse = (status: number, statusText: string) =>
  mockResponse({
    ok: false,
    status,
    statusText,
  });

describe('httpClient', () => {
  const url = 'https://api.example.com/resource';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns parsed JSON from a successful GET', async () => {
    const payload = { id: 1, name: 'match' };
    jest.mocked(fetch).mockResolvedValueOnce(jsonResponse(payload) as never);

    await expect(httpClient({ url, method: 'GET' })).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal),
        headers: {},
      }),
    );
    expect(jest.mocked(fetch).mock.calls[0][1]).not.toHaveProperty('body');
  });

  it('sends a JSON body and Content-Type on POST', async () => {
    const body = { query: 'arsenal' };
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    await httpClient({ url, method: 'POST', body });

    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('lets caller headers override the default JSON Content-Type', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    await httpClient({
      url,
      method: 'POST',
      body: { query: 'arsenal' },
      headers: { 'Content-Type': 'text/plain', 'X-Request-Id': 'abc' },
    });

    expect(fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: {
          'Content-Type': 'text/plain',
          'X-Request-Id': 'abc',
        },
      }),
    );
  });

  it('does not force JSON Content-Type for FormData bodies', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    await httpClient({
      url,
      method: 'POST',
      body: new FormData(),
    });

    expect(jest.mocked(fetch).mock.calls[0][1]?.headers).toEqual({});
  });

  it('does not force JSON Content-Type for URLSearchParams bodies', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    await httpClient({
      url,
      method: 'PUT',
      body: new URLSearchParams({ q: 'arsenal' }),
    });

    expect(jest.mocked(fetch).mock.calls[0][1]?.headers).toEqual({});
  });

  it('does not attach a JSON body on GET', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    await httpClient({
      url,
      method: 'GET',
      body: { unused: true },
    });

    expect(jest.mocked(fetch).mock.calls[0][1]).not.toHaveProperty('body');
  });

  it('returns an empty object for 204 responses', async () => {
    const response = mockResponse({ status: 204, statusText: 'No Content' });
    jest.mocked(fetch).mockResolvedValueOnce(response as never);

    await expect(httpClient({ url, method: 'DELETE' })).resolves.toEqual({});
    expect(response.json).not.toHaveBeenCalled();
  });

  it('returns an empty object when content-length is 0', async () => {
    const response = mockResponse({
      headers: { 'content-length': '0' },
    });
    jest.mocked(fetch).mockResolvedValueOnce(response as never);

    await expect(httpClient({ url, method: 'GET' })).resolves.toEqual({});
    expect(response.json).not.toHaveBeenCalled();
  });

  it('throws HttpError 502 when the success body is not JSON', async () => {
    jest.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        headers: { 'content-type': 'text/plain' },
      }) as never,
    );

    await expect(
      httpClient({ url, method: 'GET', maxRetries: 0 }),
    ).rejects.toMatchObject({
      name: 'HttpError',
      status: 502,
      message: 'Bad Content Type From Upstream',
    });
  });

  it('throws HttpError without retrying a 4xx response', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(errorResponse(404, 'Not Found') as never);

    await expect(
      httpClient({ url, method: 'GET', maxRetries: 2 }),
    ).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
      message: 'Not Found',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a 5xx response and returns the successful retry', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        errorResponse(500, 'Internal Server Error') as never,
      )
      .mockResolvedValueOnce(jsonResponse({ id: 7 }) as never);

    const pending = httpClient({
      url,
      method: 'GET',
      maxRetries: 2,
      retryDelayMs: 100,
    });

    await jest.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ id: 7 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalled();
  });

  it('retries a 429 response', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(errorResponse(429, 'Too Many Requests') as never)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    const pending = httpClient({
      url,
      method: 'GET',
      maxRetries: 1,
      retryDelayMs: 50,
    });

    await jest.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries a TypeError and returns the successful retry', async () => {
    const networkError = new TypeError('fetch failed');
    jest
      .mocked(fetch)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(jsonResponse({ ok: true }) as never);

    const pending = httpClient({
      url,
      method: 'GET',
      maxRetries: 1,
      retryDelayMs: 50,
    });

    await jest.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rethrows a non-retryable Error as-is', async () => {
    const error = new Error('boom');
    jest.mocked(fetch).mockRejectedValueOnce(error);

    await expect(httpClient({ url, method: 'GET' })).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('wraps a non-Error rejection', async () => {
    jest.mocked(fetch).mockRejectedValueOnce('upstream down');

    await expect(httpClient({ url, method: 'GET' })).rejects.toThrow(
      'An unexpected error occurred during the network request',
    );
  });

  it('throws TimeoutError when AbortError retries are exhausted', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    jest.mocked(fetch).mockRejectedValue(abortError);

    const pending = httpClient({
      url,
      method: 'GET',
      maxRetries: 2,
      retryDelayMs: 10,
    });
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);

    await jest.runAllTimersAsync();
    await assertion;
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws TimeoutError when the request exceeds timeoutMs', async () => {
    jest.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const pending = httpClient({
      url,
      method: 'GET',
      timeoutMs: 50,
      maxRetries: 0,
    });
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);

    await jest.advanceTimersByTimeAsync(50);
    await assertion;
  });
});
