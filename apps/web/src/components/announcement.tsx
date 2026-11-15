import { publicFileUrl } from "./account/avatar";
import { videoEmbedUrl } from "@/lib/notifications";

export interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  image_path: string | null;
  video_url: string | null;
  created_at: string;
}

const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** Uma novidade: data, título, texto, imagem e o vídeo (player do YouTube ou Vimeo, sem cookies no YouTube). */
export function Announcement({ a, compact = false }: { a: AnnouncementData; compact?: boolean }) {
  const img = publicFileUrl("novidades", a.image_path);
  const video = videoEmbedUrl(a.video_url);
  return (
    <article className="space-y-3" data-novidade>
      <p className="font-mono text-[11px] tracking-wide text-tinta-suave uppercase">{dia.format(new Date(a.created_at))}</p>
      <h3 className={compact ? "font-display text-xl leading-tight font-semibold" : "font-display text-2xl leading-tight font-semibold"}>{a.title}</h3>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem do bucket público de novidades
        <img src={img} alt="" loading="lazy" className="w-full rounded-xl border border-tinta/10 object-cover" />
      )}
      {a.body && <p className={`whitespace-pre-line text-tinta-suave ${compact ? "line-clamp-3 text-sm" : "text-[15px] leading-relaxed"}`}>{a.body}</p>}
      {video && !compact && (
        <div className="aspect-video overflow-hidden rounded-xl border border-tinta/10 bg-tinta">
          <iframe
            src={video}
            title={`Vídeo: ${a.title}`}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
      )}
      {video && compact && <p className="font-mono text-xs text-linha">▶ tem vídeo</p>}
    </article>
  );
}
