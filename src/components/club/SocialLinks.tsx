import { AudioLines, Cloud, Disc3, Instagram, Link as LinkIcon, Youtube, Video } from "lucide-react";

type Social = { label: string; url: string };

function TikTokIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.5 3c.4 2.2 1.9 3.9 4 4.2v2.8c-1.5.1-2.9-.3-4.1-1.1v5.9c0 3.4-2.6 6.2-6 6.2S4.4 18.2 4.4 14.8c0-3.3 2.5-6 5.7-6.2v2.9c-1.6.2-2.8 1.5-2.8 3.2 0 1.8 1.4 3.2 3.1 3.2s3.1-1.4 3.1-3.2V3h3z" />
    </svg>
  );
}

function iconFor(url: string) {
  const u = url.toLowerCase();
  if (u.includes("tiktok") || u.includes("streamrecorder")) return <TikTokIcon />;
  if (u.includes("instagram")) return <Instagram size={15} />;
  if (u.includes("youtube")) return <Youtube size={15} />;
  if (u.includes("soundcloud")) return <AudioLines size={15} />;
  if (u.includes("mixcloud")) return <Cloud size={15} />;
  if (u.includes("bandcamp")) return <Disc3 size={15} />;
  if (u.includes("bio.site") || u.includes("bass.fan")) return <LinkIcon size={15} />;
  return <Video size={15} />;
}

/** Clickable social icons for a curator. */
export function SocialLinks({ links }: { links: Social[] }) {
  if (!links.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {links.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          title={l.label}
          aria-label={l.label}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-100"
          style={{ borderColor: "var(--club-line)", color: "var(--club-accent)", opacity: 0.75 }}
        >
          {iconFor(l.url)}
        </a>
      ))}
    </div>
  );
}
