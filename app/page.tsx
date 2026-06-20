import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 lg:p-24 bg-gradient-to-br from-background to-secondary">
      <div className="z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm">
        <p className="flex justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit w-auto rounded-xl border bg-gray-200 p-4 dark:bg-zinc-800/30 shadow-sm">
          Welcome to&nbsp;
          <code className="font-mono font-bold text-primary">Smart Pig Farm</code>
        </p>
        <div>
          <a
            href="/login"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2"
          >
            Sign In
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center mt-20 md:mt-32">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-400">
          Digital Farm Management
        </h1>
      </div>
      
      <p className="mt-6 text-lg md:text-xl text-muted-foreground text-center max-w-2xl">
        Monitor health, reproduction, vaccination, and farm activity digitally in realtime.
      </p>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left mt-16 gap-4">
        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Home{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Realtime monitoring of your entire pig farm operations.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Health{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Track diseases, medicines, and vaccination schedules.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Reproduction{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Manage breeding, pregnancy, and birth estimation.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            QR Scan{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Quick access to farm data through integrated QR code system.
          </p>
        </a>
      </div>
    </main>
  );
}
