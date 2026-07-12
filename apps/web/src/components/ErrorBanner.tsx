export default function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/25 text-rose-400 text-sm px-4 py-3 rounded-lg mb-4">
      <span className="text-base leading-none mt-0.5 shrink-0">⚠</span>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
