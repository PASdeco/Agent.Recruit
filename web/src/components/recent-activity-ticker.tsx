type ActivityItem = {
  timestamp: string;
  description: string;
};

export function RecentActivityTicker({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <section className="panel overflow-hidden rounded-[28px] px-6 py-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent Match Activity</p>
          <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
            Live activity will appear after the first match request is accepted onchain.
          </h2>
        </div>
        <div className="mt-6 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base text-[var(--text-muted)]">
          No recent match activity has been recorded on Studionet yet.
        </div>
      </section>
    );
  }

  const doubled = [...items, ...items];

  return (
    <section className="panel overflow-hidden rounded-[28px] px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent Match Activity</p>
          <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
            See fit scores as they are evaluated across the network.
          </h2>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-full border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] py-3">
        <div className="ticker-track flex min-w-max gap-8 px-6 hover:[animation-play-state:paused]">
          {doubled.map((item, index) => (
            <div key={`${item.timestamp}-${item.description}-${index}`} className="flex items-center gap-4 whitespace-nowrap">
              <span className="font-mono text-sm text-[var(--text-muted)]">{item.timestamp}</span>
              <span className="text-base text-[var(--text-primary)]">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
