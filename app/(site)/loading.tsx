import { GridSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-[280px] w-full rounded-2xl" />
      <div className="mt-10">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[180px] shrink-0">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10">
        <GridSkeleton />
      </div>
    </div>
  );
}
