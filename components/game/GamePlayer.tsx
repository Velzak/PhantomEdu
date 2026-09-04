"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { PlayerSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { recordPlayed } from "@/lib/localPrefs";

export type GameSource = { type: "html_upload"; entryUrl: string };

export function GamePlayer({
  source,
  gameId,
  slug,
  title,
  onReport,
}: {
  source: GameSource;
  gameId: string;
  slug: string;
  title: string;
  onReport: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const recorded = useRef(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    recorded.current = false;
    loadedRef.current = false;
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [source.entryUrl, nonce]);

  async function markPlayed() {
    if (recorded.current) return;
    recorded.current = true;
    recordPlayed(slug);
    try {
      await fetch(`/api/games/${gameId}/play`, { method: "POST" });
    } catch {
      recorded.current = false;
    }
  }

  async function toggleFullscreen() {
    const node = wrapRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await node.requestFullscreen();
    }
  }

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function retry() {
    setNonce((n) => n + 1);
    setFailed(false);
    setReady(false);
  }

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl bg-black">
      {!ready && !failed ? <div className="absolute inset-0 z-10"><PlayerSkeleton /></div> : null}
      {failed ? (
        <div className="aspect-video">
          <ErrorState
            title={`${title} failed to load`}
            body="The game file did not start in time. Retry, or send a short report so it can be checked."
            actionLabel="Retry"
            onAction={retry}
          />
          <div className="pb-6 text-center">
            <button type="button" className="text-sm text-signal hover:underline" onClick={onReport}>
              Report this game
            </button>
          </div>
        </div>
      ) : (
        <iframe
          key={nonce}
          title={title}
          src={source.entryUrl}
          sandbox="allow-scripts allow-forms allow-pointer-lock"
          loading="lazy"
          className="aspect-video h-full w-full border-0"
          onLoad={() => {
            loadedRef.current = true;
            setReady(true);
            void markPlayed();
          }}
          onError={() => setFailed(true)}
        />
      )}
      {!failed ? (
        <button
          type="button"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={() => void toggleFullscreen()}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/75"
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      ) : null}
    </div>
  );
}
