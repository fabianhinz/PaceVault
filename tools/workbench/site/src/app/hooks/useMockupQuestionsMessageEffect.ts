import type { RefObject } from 'react';
import { useUpdateEffect } from 'react-use';

export const useMockupQuestionsMessageEffect = (options: {
  frame: RefObject<HTMLIFrameElement | null>;
  questionStates: string;
}): void => {
  const frame = options.frame;
  useUpdateEffect(() => {
    frame.current?.contentWindow?.postMessage({ wbQuestions: true }, '*');
  }, [options.questionStates]);
};
