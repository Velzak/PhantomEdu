import { PlayerSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function GameLoading() {
  return (
    <div>
      <PlayerSkeleton />
      <Skeleton className="mt-6 h-8 w-64" />
      <Skeleton className="mt-3 h-20 w-full max-w-3xl" />
    </div>
  );
}
