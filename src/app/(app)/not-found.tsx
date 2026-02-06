import { NotFoundState } from "@/components/features/error-states";

export default function AppNotFound() {
  return (
    <div className="container py-8">
      <NotFoundState resource="página" />
    </div>
  );
}
