export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const abort = new AbortController();
  let timedOut = false;
  const cancel = () => abort.abort();
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    abort.abort();
  }, options.body instanceof FormData ? 30_000 : 15_000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: abort.signal,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const expired = response.status === 401 && !path.endsWith("/login") && !path.endsWith("/setup");
      throw new AdminApiError(
        expired
          ? "Your session has expired. Sign in again in another tab, then return here and retry. Your edits are kept."
          : data?.error || "Your change could not be saved. Please try again.",
        response.status,
      );
    }
    if (!data || typeof data !== "object")
      throw new AdminApiError("The server returned an unreadable response. Refresh and try again; your draft is kept.", 502);
    return data as T;
  } catch (failure) {
    if (failure instanceof AdminApiError) throw failure;
    throw new AdminApiError(
      timedOut
        ? "This request took too long. Check your connection, refresh the catalogue and retry. Your draft is kept."
        : "Could not connect. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
  }
}
