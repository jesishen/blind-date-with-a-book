"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Book } from "@/types/book";
import { KeywordChip } from "./KeywordChip";
import { GiftWrap, FlapProgress } from "./GiftWrap";

const DRAG_DISTANCE = 200;
const COMPLETE_THRESHOLD = 0.9;

type Step = "cornerRight" | "cornerLeft" | "base" | "done";

const STEP_ORDER: Step[] = ["cornerRight", "cornerLeft", "base", "done"];

export function BookSlot({
  book,
  ready,
  coverUrl,
  coverLoading,
  onUnwrapComplete,
}: {
  book: Book;
  ready: boolean;
  coverUrl?: string | null;
  coverLoading?: boolean;
  onUnwrapComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("cornerRight");
  const [liveProgress, setLiveProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const active = ready && step !== "done";

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    if (step === "base") {
      // Simple left-to-right drag for the final panel — just pull the
      // left side of the paper across to the right.
      setLiveProgress(Math.min(Math.max(dx, 0) / DRAG_DISTANCE, 1));
    } else {
      const dist = Math.sqrt(dx * dx + dy * dy);
      setLiveProgress(Math.min(dist / DRAG_DISTANCE, 1));
    }
  }

  function finishDrag() {
    setDragging(false);
    startPos.current = null;

    if (liveProgress >= COMPLETE_THRESHOLD) {
      const currentIndex = STEP_ORDER.indexOf(step);
      const nextStep = STEP_ORDER[currentIndex + 1];
      setLiveProgress(0);
      setStep(nextStep);
      if (nextStep === "done") {
        onUnwrapComplete();
      }
    } else {
      setLiveProgress(0);
    }
  }

  function progressFor(target: "cornerRight" | "cornerLeft" | "base"): number {
    const targetIndex = STEP_ORDER.indexOf(target);
    const stepIndex = STEP_ORDER.indexOf(step);
    if (targetIndex < stepIndex) return 1;
    if (targetIndex > stepIndex) return 0;
    return liveProgress;
  }

  const flapProgress: FlapProgress = {
    cornerRight: progressFor("cornerRight"),
    cornerLeft: progressFor("cornerLeft"),
    base: progressFor("base"),
  };

  const revealProgress = flapProgress.base;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{ touchAction: "none" }}
        className={`relative aspect-[1/1.6] w-64 rounded-2xl border border-amber-800/20 shadow-md ${
          active ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <GiftWrap
          flapProgress={flapProgress}
          fadeProgress={revealProgress}
          dragging={dragging}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-stone-200">
            {coverLoading ? (
              <p className="text-2xl">📖</p>
            ) : coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-2xl">📖</p>
            )}
          </div>
        </GiftWrap>

        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4"
          animate={{ opacity: 1 - Math.min(revealProgress / 0.6, 1) }}
          transition={dragging ? { duration: 0 } : { duration: 0.3 }}
        >
          {book.teaserKeywords?.map((k, i) => (
            <KeywordChip key={i} text={k} />
          )) ?? (
            <>
              <KeywordChip text="" loading />
              <KeywordChip text="" loading />
              <KeywordChip text="" loading />
            </>
          )}
        </motion.div>
      </div>

      {active && (
        <p className="text-xs text-stone-400">
          Click, hold, and drag to unwrap
        </p>
      )}
    </div>
  );
}