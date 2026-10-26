export const checkRowText = ({
  text,
  superseded,
  agent,
}: {
  text: string;
  superseded: boolean;
  agent: boolean;
}): { what: string; why: string | undefined; pointer: string | undefined } => {
  let body = text;
  let pointer: string | undefined = undefined;
  const replaced = /\s*\bSuperseded by:\s*([\s\S]*)$/.exec(text);
  if (superseded && replaced) {
    body = text.slice(0, replaced.index);
    pointer = replaced[1];
  }
  const why = /\s(Agent:[\s\S]*)$/.exec(body);
  let what = body;
  if (agent && why) what = body.slice(0, why.index);
  let whyText: string | undefined = undefined;
  if (agent && why) whyText = why[1];
  return { what, why: whyText, pointer };
};
