interface AuthShellProps {
  readonly title: string;
  readonly description: string;
  readonly footnote?: string;
  readonly children: React.ReactNode;
}

export function AuthShell({
  title,
  description,
  footnote,
  children,
}: AuthShellProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-100">
        <div className="mb-5.5 flex items-center gap-2">
          <span aria-hidden className="block size-5 bg-(--sp-accent)" />
          <span className="text-[18px] font-extrabold tracking-[-0.02em]">
            Sprintly
          </span>
        </div>

        <div className="border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-5.5">
          <h1 className="mb-1 text-[25px]">{title}</h1>
          <p className="mb-4.5 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            {description}
          </p>
          {children}
        </div>

        {footnote ? (
          <p className="mt-3.5 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_62%,transparent)]">
            {footnote}
          </p>
        ) : null}
      </div>
    </main>
  );
}
