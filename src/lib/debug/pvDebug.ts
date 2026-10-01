import { tokens } from '@/lib/tokens.ts';
import { crashCommandDocs, crashCommands, throwIfBootCrashRequested } from './crashCommands.ts';

const commands = {
  ...crashCommands,
};

const commandDocs: Record<keyof typeof commands, string> = {
  ...crashCommandDocs,
};

type PvDebug = typeof commands & { help: () => void };

declare global {
  interface Window {
    pvDebug?: PvDebug;
  }
}

const BADGE_STYLE = `background:${tokens.accent};color:#fff;font-weight:700;padding:2px 8px;border-radius:4px`;
const TITLE_STYLE = `color:${tokens.accent};font-weight:700`;
const COMMAND_STYLE = `color:${tokens.accent};font-family:monospace;font-weight:600`;
const DESCRIPTION_STYLE = `color:${tokens.textSecondary}`;

const printHelp = () => {
  const names = Object.keys(commandDocs) as Array<keyof typeof commandDocs>;
  const blocks = names.map((name) => `\n\n%cpvDebug.${name}()\n%c  ${commandDocs[name]}`);
  const styles = names.flatMap(() => [COMMAND_STYLE, DESCRIPTION_STYLE]);
  console.info(
    `%cPaceVault%c debug tools${blocks.join('')}\n\n%cpvDebug.help()%c prints this again`,
    BADGE_STYLE,
    TITLE_STYLE,
    ...styles,
    COMMAND_STYLE,
    DESCRIPTION_STYLE,
  );
};

export const registerPvDebug = () => {
  window.pvDebug = { ...commands, help: printHelp };
  printHelp();
  throwIfBootCrashRequested();
};
