import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
        <Link href="/" className="text-lg font-semibold text-secondary">
          MS Connect
        </Link>
      </div>
    </header>
  );
}
