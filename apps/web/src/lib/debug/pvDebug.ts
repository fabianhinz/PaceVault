import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { crashCommands } from './crashCommands.ts';
import { throwIfBootCrashRequested } from './crashSignal.ts';
import { migrationCommands } from './migrationCommands.ts';

const commands = {
  ...crashCommands,
  ...migrationCommands,
};

const DOC_BY_COMMAND: Record<keyof typeof commands, string> = {
  crashRoot: 'Root card — Reload + Report bug',
  crashRoute: 'Route card — Try again or navigate away',
  crashMap: 'Map vanishes, content keeps working',
  crashBoot: 'Reload + fail during boot — root card',
  reportUrl: 'GitHub issue URL for an optional error',
  rerunMigration: 'Mark sessions outdated + reload — real reprocess ({ count } = newest N only)',
};

type PvDebug = typeof commands & { help: () => void };

declare global {
  interface Window {
    pvDebug?: PvDebug;
  }
}

const BADGE_STYLE = `background:${tokens.accent};color:${tokens.white};font-weight:700;padding:2px 8px;border-radius:4px`;
const TITLE_STYLE = `color:${tokens.accent};font-weight:700`;
const COMMAND_STYLE = `color:${tokens.accent};font-family:monospace;font-weight:600`;
const DESCRIPTION_STYLE = `color:${tokens.textSecondary}`;

const printHelp = () => {
  const names = Object.keys(DOC_BY_COMMAND) as Array<keyof typeof DOC_BY_COMMAND>;
  const blocks = names.map((name) => `\n\n%cpvDebug.${name}()\n%c  ${DOC_BY_COMMAND[name]}`);
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
