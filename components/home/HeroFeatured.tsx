"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { GameThumbnail } from "@/components/game/GameCard";
import type { GameCardDTO } from "@/lib/gameView";

export function HeroFeatured({ game }: { game: GameCardDTO }) {
  const reduce = useReducedMotion();
  const hook = game.description.split(".")[0] || game.description;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl bg-surface"
    >
      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[220px] lg:min-h-[340px]">
          <GameThumbnail game={game} />
        </div>
        <div className="flex flex-col justify-center px-6 py-8 lg:px-10">
          <p className="text-sm text-signal">{game.category.name}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{game.title}</h1>
          <p className="mt-3 max-w-md text-muted">{hook}.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href={`/games/${game.slug}`} size="lg">
              Play now
            </ButtonLink>
            <Link href={`/categories/${game.category.slug}`} className="text-sm text-muted hover:text-ink">
              More {game.category.name.toLowerCase()}
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
