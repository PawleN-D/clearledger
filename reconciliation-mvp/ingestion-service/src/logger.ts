export const logError = (scope: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}] ${message}`);
};
