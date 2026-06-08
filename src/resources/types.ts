export type QueryValue = string | number | boolean | Array<string | number | boolean>;

export type RequestFn = <T>(
  path: string,
  params?: Record<string, QueryValue | undefined>,
  baseUrl?: string,
  signal?: AbortSignal,
) => Promise<T>;

export type PostFn = <T>(path: string, body: unknown, signal?: AbortSignal) => Promise<T>;
