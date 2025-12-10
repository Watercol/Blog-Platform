import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed', details: error.flatten() });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[Error]', error);

  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = error?.message ?? 'Internal server error';

  if (req.accepts('html')) {
    const safeMessage = escapeHtml(message);
    res
      .status(status)
      .send(
        `服务器错误：${safeMessage}`
      );
    return;
  }

  res.status(status).json({ message });
};
