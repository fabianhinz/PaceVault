import type { RefObject } from 'react';
import { useUpdateEffect } from 'react-use';

export const useMockupQuestionsMessageEffect = ({
  frame,
  questionStates,
}: {
  frame: RefObject<HTMLIFrameElement | null>;
  questionStates: string;
}): void => {
  useUpdateEffect(() => {
    frame.current?.contentWindow?.postMessage({ wbQuestions: true }, '*');
  }, [questionStates]);
};
