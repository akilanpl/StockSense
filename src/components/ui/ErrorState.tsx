import { Button } from "@/components/ui/Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "This page could not be loaded",
  description = "The workspace hit an unexpected error. You can try the page again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-64 max-w-lg flex-col items-start justify-center px-2 py-10">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
