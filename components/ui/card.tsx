import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className, onClick, selected }: CardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900",
        onClick &&
          "cursor-pointer hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:border-primary/60",
        selected && "border-primary ring-2 ring-primary/20",
        className,
      )}
    >
      {children}
    </Component>
  );
}
