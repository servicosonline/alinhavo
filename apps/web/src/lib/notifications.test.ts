import { describe, expect, it } from "vitest";
import { readLink, videoEmbedUrl } from "./notifications";

describe("link da notificação", () => {
  it("aceita caminho do app e https; recusa o resto", () => {
    expect(readLink("/painel/conta")).toBe("/painel/conta");
    expect(readLink("https://alinhavo.com.br/novidade")).toBe("https://alinhavo.com.br/novidade");
    expect(readLink("")).toBeNull();
    expect(readLink("javascript:alert(1)")).toBeUndefined();
    expect(readLink("//evil.com")).toBeUndefined();
    expect(readLink("http://sem-tls.com")).toBeUndefined();
  });
});

describe("vídeo da novidade", () => {
  it("YouTube e Vimeo viram player embutido", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });

  it("outro site, http ou link quebrado: nada", () => {
    expect(videoEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoEmbedUrl("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoEmbedUrl("não é link")).toBeNull();
    expect(videoEmbedUrl(null)).toBeNull();
  });
});
