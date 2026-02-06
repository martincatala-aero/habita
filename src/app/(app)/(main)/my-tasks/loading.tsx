import { TaskListSkeleton } from "@/components/features/loading-skeletons";

export default function MyTasksLoading() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
      </div>
      <TaskListSkeleton />
    </div>
  );
}
