import Image from "next/image";

const FALLBACK_BG = [
  "bg-iris-100 text-iris-700",
  "bg-[var(--green-soft)] text-[var(--green-500)]",
  "bg-[var(--amber-soft)] text-[var(--amber-500)]",
  "bg-gray-100 text-gray-600",
];

export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full border border-border-subtle object-cover shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const palette = FALLBACK_BG[name.length % FALLBACK_BG.length];
  return (
    <div
      className={`flex items-center justify-center rounded-full font-medium shrink-0 ${palette}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
