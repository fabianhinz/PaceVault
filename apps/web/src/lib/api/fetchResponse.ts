export type FailedResponseReason = 'unauthorized' | 'rate-limited' | 'failed';

export const failedResponseReason = (response: Response): FailedResponseReason => {
  if (response.status === 401 || response.status === 403) return 'unauthorized';
  if (response.status === 429) return 'rate-limited';
  return 'failed';
};

export class FailedResponseError extends Error {
  public readonly response: Response;
  public readonly reason: FailedResponseReason;

  constructor(options: { operation: string; response: Response }) {
    const reason = failedResponseReason(options.response);
    super(`${options.operation} failed with status ${options.response.status}. Reason: ${reason}`);
    this.name = 'FailedResponseError';
    this.response = options.response;
    this.reason = reason;
  }
}
