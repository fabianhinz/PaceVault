import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { REPO_ROOT, bannerLocale } from './env.ts';

const LOCALE = bannerLocale();

const messagesSchema = z.record(z.string(), z.unknown());
const messages = messagesSchema.parse(
  JSON.parse(readFileSync(resolve(REPO_ROOT, 'packages/i18n/messages', `${LOCALE}.json`), 'utf8')),
);
export const messageText = (key: string) => {
  const value = messages[key];
  if (typeof value !== 'string') throw new Error(`message "${key}" is not a plain string`);
  return value;
};
export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
