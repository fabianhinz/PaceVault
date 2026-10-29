import { isInputError } from 'astro:actions';

export const messageOf = (error: unknown): string => {
  if (isInputError(error)) {
    const fields = Object.values(error.fields).flatMap((messages) => messages ?? []);
    if (fields.length > 0) return fields.join(' ');
  }
  if (error instanceof Error) return error.message;
  return String(error);
};
