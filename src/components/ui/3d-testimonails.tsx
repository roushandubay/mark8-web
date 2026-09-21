import React, { type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/** 21st.dev 3D marquee. MARK8 uses it for the live product wall. */
interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  /** Reverse the animation direction */
  reverse?: boolean;
  /** Pause while hovered */
  pauseOnHover?: boolean;
  children: React.ReactNode;
  /** Animate vertically instead of horizontally */
  vertical?: boolean;
  /** Times to repeat the content so the loop never shows a gap */
  repeat?: number;
  ariaLabel?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaRole?: string;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ariaLabel,
  ariaLive = 'off',
  ariaRole = 'marquee',
  ...props
}: MarqueeProps) {
  const content = React.useMemo(
    () => (
      <>
        {Array.from({ length: repeat }, (_, i) => (
          <div
            key={i}
            aria-hidden={i > 0 ? true : undefined}
            className={cn(
              !vertical ? 'flex-row [gap:var(--gap)]' : 'flex-col [gap:var(--gap)]',
              'flex shrink-0 justify-around',
              !vertical && 'animate-marquee flex-row',
              vertical && 'animate-marquee-vertical flex-col',
              pauseOnHover && 'group-hover:[animation-play-state:paused]',
              reverse && '[animation-direction:reverse]',
            )}
          >
            {children}
          </div>
        ))}
      </>
    ),
    [repeat, children, vertical, pauseOnHover, reverse],
  );

  return (
    <div
      {...props}
      data-slot="marquee"
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        { 'flex-row': !vertical, 'flex-col': vertical },
        className,
      )}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      role={ariaRole}
    >
      {content}
    </div>
  );
}
