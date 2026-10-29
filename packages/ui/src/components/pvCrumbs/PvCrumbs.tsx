import { Fragment, type FC, type ReactNode } from 'react';
import { PvWrappingCrumbs } from './PvWrappingCrumbs.tsx';

interface PvCrumbsProps {
  items: ReactNode[];
  wrap?: boolean;
}

export const PvCrumbs: FC<PvCrumbsProps> = (props) => {
  if (props.wrap) return <PvWrappingCrumbs items={props.items} />;
  return (
    <>
      {props.items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className="whitespace-nowrap">{item}</span>
        </Fragment>
      ))}
    </>
  );
};
