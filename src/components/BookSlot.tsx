"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Book } from "@/types/book";
import { KeywordChip } from "./KeywordChip";
import { GiftWrap, FlapProgress } from "./GiftWrap";

const DRAG_DISTANCE = 260;
const COMPLETE_THRESHOLD = 0.9;

const FLAP_DIRECTIONS: Record<keyof FlapProgress, [number, number]> = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

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
  const [dragVector, setDragVector] = useState({ dx: 0, dy: 0 });
  const [overallProgress, setOverallProgress] = useState(0);
  const [settleProgress, setSettleProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || completed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    setDragVector({ dx, dy });
    setOverallProgress(Math.min(dist / DRAG_DISTANCE, 1));
  }

  function finishDrag() {
    setDragging(false);
    startPos.current = null;

    if (overallProgress >= COMPLETE_THRESHOLD) {
      setSettleProgress(1);
      setCompleted(true);
      onUnwrapComplete();
    } else {
      setSettleProgress(0);
    }
  }

  function computeFlapProgress(): FlapProgress {
    if (!dragging) {
      return {
        top: settleProgress,
        right: settleProgress,
        bottom: settleProgress,
        left: settleProgress,
      };
    }

    const dist = Math.sqrt(dragVector.dx ** 2 + dragVector.dy ** 2) || 0.0001;
    const dirX = dragVector.dx / dist;
    const dirY = dragVector.dy / dist;

    const result = {} as FlapProgress;
    (Object.keys(FLAP_DIRECTIONS) as (keyof FlapProgress)[]).forEach((side) => {
      const [fx, fy] = FLAP_DIRECTIONS[side];
      const alignment = Math.max(0, dirX * fx + dirY * fy);
      result[side] = Math.min(overallProgress * alignment * 1.3, 1);
    });
    return result;
  }

  const flapProgress = computeFlapProgress();
  const fadeProgress = dragging ? overallProgress : settleProgress;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{ touchAction: "none" }}
        className={`relative aspect-[1/1.6] w-64 rounded-2xl border border-amber-800/20 shadow-md ${
          ready && !completed ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <GiftWrap
          flapProgress={flapProgress}
          fadeProgress={fadeProgress}
          dragging={dragging}
        >
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="flex w-40 items-center justify-center overflow-hidden rounded-lg bg-stone-200 shadow-lg aspect-[1/1.6]">
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
          </div>
        </GiftWrap>

        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4"
          animate={{ opacity: 1 - Math.min(fadeProgress / 0.6, 1) }}
          transition={dragging ? { duration: 0 } : { duration: 0.6 }}
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

      {ready && !completed && (
        <p className="text-xs text-stone-400">
          Click, hold, and drag to unwrap
        </p>
      )}
    </div>
  );
}