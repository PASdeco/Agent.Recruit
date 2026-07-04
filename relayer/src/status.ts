export function summarizeFailure(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (/rejected|denied/i.test(text)) {
    return "Automation request was rejected. The relayer will try again.";
  }
  if (/timeout|timed out/i.test(text)) {
    return "The network took too long to respond. Retrying shortly.";
  }
  return "Automation hit a temporary issue. The relayer will retry.";
}
