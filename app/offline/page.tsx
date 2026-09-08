import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        MS Connect
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        You are offline
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-300">
        The latest page is not available on this device yet. Reconnect to the internet and try again.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-80"
      >
        Return to home
      </Link>
    </section>
  );
}