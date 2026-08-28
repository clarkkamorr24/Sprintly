import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      <Skeleton className="h-9 w-full max-w-sm" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading workspace…
      </span>
    </div>
  );
}
