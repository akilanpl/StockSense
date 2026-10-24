import { cn } from "@/lib/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {children}
    </section>
  );
}
