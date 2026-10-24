export function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center" role="status">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
