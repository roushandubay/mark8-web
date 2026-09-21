"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 21st.dev liquid-glass-button, web original. The glass is real here: the
 * backdrop is displaced through an SVG turbulence filter (Chromium) and framed
 * by the inset-shadow rim. MARK8 variants: `default` clear glass (ink text),
 * `light` for use on photos/video (white text), `primary` ink glass.
 */
const liquidbuttonVariants = cva(
  "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-white/35 hover:scale-105 duration-300 transition text-foreground",
        light: "bg-white/10 hover:scale-105 duration-300 transition text-white",
        primary: "bg-foreground/90 hover:scale-105 duration-300 transition text-white",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-12 px-8 has-[>svg]:px-6",
        xxl: "h-14 px-10 has-[>svg]:px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "xxl",
    },
  },
)

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
  }) {
  const onDark = variant === "light" || variant === "primary"
  const rootClass = cn("relative", liquidbuttonVariants({ variant, size, className }))

  const glass = (content: React.ReactNode) => (
    <>
      <div
        className={cn(
          "absolute top-0 left-0 z-0 h-full w-full rounded-full transition-all",
          onDark
            ? "shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"
            : "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]",
        )}
      />
      <div
        className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#container-glass")', WebkitBackdropFilter: "blur(10px)" }}
      />
      {/* iOS-style reflection across the upper half */}
      <div className="pointer-events-none absolute inset-x-[6%] top-[6%] z-0 h-[45%] rounded-full bg-gradient-to-b from-white/45 to-white/0" />
      <span className="pointer-events-none relative z-10 flex items-center gap-2">{content}</span>
      <GlassFilter />
    </>
  )

  // asChild: the child element (e.g. a link) becomes the button, with the glass layers inside it.
  if (asChild && React.isValidElement<{ className?: string; children?: React.ReactNode }>(children)) {
    return React.cloneElement(
      children,
      { ...(props as object), "data-slot": "button", className: cn(rootClass, children.props.className) } as never,
      glass(children.props.children),
    )
  }

  return (
    <button data-slot="button" className={rootClass} {...props}>
      {glass(children)}
    </button>
  )
}

function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {/* Generate turbulent noise for distortion */}
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          {/* Blur the turbulence pattern slightly */}
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          {/* Displace the source graphic with the noise */}
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          {/* Apply overall blur on the final result */}
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export { LiquidButton, liquidbuttonVariants }
