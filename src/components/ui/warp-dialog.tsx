"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

/** 21st.dev warp-dialog, recoloured from red to the MARK8 violet. */

type WarpDialogContextType = {
  open: boolean
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void
}

const WarpDialogContext = React.createContext<WarpDialogContextType | null>(null)

export function useWarpDialogContext() {
  const ctx = React.useContext(WarpDialogContext)
  if (!ctx) throw new Error("WarpDialog components must be used inside <WarpDialog>")
  return ctx
}

export function WarpDialog({
  open: openProp,
  onOpenChange: setOpenProp,
  ...props
}: React.ComponentProps<"div"> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [_open, _setOpen] = React.useState(false)
  const open = openProp ?? _open

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) setOpenProp(openState)
      else _setOpen(openState)
    },
    [setOpenProp, open],
  )

  // Escape closes, like any dialog.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  const contextValue = React.useMemo<WarpDialogContextType>(() => ({ open, setOpen }), [open, setOpen])

  return (
    <WarpDialogContext.Provider value={contextValue}>
      <div data-slot="dialog" {...props} />
    </WarpDialogContext.Provider>
  )
}

export function WarpDialogTrigger({ asChild = false, ...props }: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"
  const { setOpen } = useWarpDialogContext()
  return <Comp onClick={() => setOpen((prev) => !prev)} data-slot="dialog-trigger" {...props} />
}

function WarpDialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("fixed inset-0 z-50 overflow-hidden bg-[#9775fa]/10 backdrop-blur-sm", className)} {...props}>
      <WarpAnimations />
    </div>
  )
}

export function WarpDialogContent({ children, className, ...props }: React.ComponentProps<typeof motion.div>) {
  const { open, setOpen } = useWarpDialogContext()

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute">
          <WarpDialogOverlay />
          <motion.div
            onClick={() => setOpen((prev) => !prev)}
            className={cn("fixed inset-0 z-[1000] flex items-center justify-center px-4", className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.59, 0, 0.35, 1] }}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            <motion.div
              className="relative flex flex-col items-center justify-center gap-4"
              onClick={(e) => e.stopPropagation()}
              initial={{ rotateX: -5, skewY: -1.5, scaleY: 2, scaleX: 0.4, y: 100 }}
              animate={{
                rotateX: 0,
                skewY: 0,
                scaleY: 1,
                scaleX: 1,
                y: 0,
                transition: {
                  duration: 0.35,
                  ease: [0.59, 0, 0.35, 1],
                  y: { type: "spring", visualDuration: 0.7, bounce: 0.2 },
                },
              }}
              exit={{ rotateX: -5, skewY: -1.5, scaleY: 2, scaleX: 0.4, y: 100 }}
              transition={{ duration: 0.35, ease: [0.59, 0, 0.35, 1] }}
              style={{ transformPerspective: 1000, originX: 0.5, originY: 0 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function WarpAnimations() {
  const enterDuration = 0.5
  const exitDuration = 0.25
  return (
    <>
      <motion.div
        className="absolute left-[25%] top-[100%] h-1/2 w-1/2 origin-center rounded-full blur-lg will-change-transform"
        initial={{ scale: 0, opacity: 1, backgroundColor: "hsl(255, 90%, 86%)" }}
        animate={{
          scale: 10,
          opacity: 0.2,
          backgroundColor: "hsl(255, 93%, 63%)",
          transition: { duration: enterDuration, opacity: { duration: enterDuration, ease: "easeInOut" } },
        }}
        exit={{ scale: 0, opacity: 1, backgroundColor: "hsl(255, 90%, 86%)", transition: { duration: exitDuration } }}
      />
      <motion.div
        className="absolute left-[-50%] top-[-25%] h-full w-full rounded-full bg-[#9775fa]/80 blur-[100px]"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.7,
          transition: {
            duration: enterDuration,
            scale: { duration: 15, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.35 },
          },
          scale: [1, 0.7, 1],
        }}
        exit={{ opacity: 0, transition: { duration: exitDuration } }}
      />
      <motion.div
        className="absolute left-[50%] top-[25%] h-full w-full rounded-full bg-[#7649f8]/70 blur-[100px]"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.7,
          transition: {
            duration: enterDuration,
            scale: { duration: 15, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.35 },
          },
          scale: [1, 0.7, 1],
        }}
        exit={{ opacity: 0, transition: { duration: exitDuration } }}
      />
    </>
  )
}
