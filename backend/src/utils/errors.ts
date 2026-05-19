export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(err: Error): { statusCode: number; body: { message: string } } {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, body: { message: err.message } };
  }

  console.error('Unhandled error:', err);
  return { statusCode: 500, body: { message: '服务器内部错误' } };
}
