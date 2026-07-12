export function friendlyError(err: any): string {
  return err?.response?.data?.message ?? err?.message ?? 'An unexpected error occurred. Please try again.';
}
