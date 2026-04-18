interface ShareResult {
  method: 'web-share' | 'clipboard' | 'unsupported';
  ok: boolean;
}

interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

async function trySystemShare(payload: SharePayload): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  try {
    await navigator.share(payload);
    return true;
  } catch (error) {
    // User cancels with an AbortError — treat as non-failure so we don't fall back to clipboard
    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }
    return false;
  }
}

async function tryClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareScore(payload: SharePayload): Promise<ShareResult> {
  const sharedViaSystem = await trySystemShare(payload);
  if (sharedViaSystem) {
    return { method: 'web-share', ok: true };
  }

  const fallbackText = payload.url ? `${payload.text}\n${payload.url}` : payload.text;
  const copied = await tryClipboard(fallbackText);
  if (copied) {
    return { method: 'clipboard', ok: true };
  }

  return { method: 'unsupported', ok: false };
}

export type { SharePayload, ShareResult };
export { shareScore };
