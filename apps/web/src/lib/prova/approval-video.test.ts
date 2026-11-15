import { afterEach, describe, expect, it, vi } from "vitest";
import { approvalVideoContentType, approvalVideoFunctionUrl, approvalVideoPath, fetchApprovalVideoUrl, readSignedVideoUrl } from "./approval-video";

const ORG = "11111111-1111-4111-8111-111111111111";
const APR = "22222222-2222-4222-8222-222222222222";

describe("caminho e tipo do vídeo", () => {
  it("caminho igual ao que o banco aceita, com a extensão do formato", () => {
    expect(approvalVideoPath(ORG, APR, "video/mp4;codecs=avc1.42E01E")).toBe(`${ORG}/${APR}/video.mp4`);
    expect(approvalVideoPath(ORG, APR, "video/webm;codecs=vp9")).toBe(`${ORG}/${APR}/video.webm`);
  });
  it("tipo do envio sem codecs", () => {
    expect(approvalVideoContentType("video/mp4;codecs=avc1.42E01E")).toBe("video/mp4");
    expect(approvalVideoContentType("video/webm;codecs=vp8")).toBe("video/webm");
  });
});

describe("Edge Function", () => {
  it("endereço da função com o token escapado e sem barra dupla", () => {
    expect(approvalVideoFunctionUrl("https://abc.supabase.co/", "a b")).toBe("https://abc.supabase.co/functions/v1/aprovacao-video?token=a%20b");
  });

  it("só aceita um endereço https (ou local) na resposta", () => {
    expect(readSignedVideoUrl({ url: "https://abc.supabase.co/storage/v1/object/sign/x" })).toBe("https://abc.supabase.co/storage/v1/object/sign/x");
    expect(readSignedVideoUrl({ url: "javascript:alert(1)" })).toBeNull();
    expect(readSignedVideoUrl({ url: "http://outro.com/x" })).toBeNull();
    expect(readSignedVideoUrl({ error: "x" })).toBeNull();
    expect(readSignedVideoUrl(null)).toBeNull();
  });

  describe("fetchApprovalVideoUrl", () => {
    afterEach(() => vi.unstubAllGlobals());
    const config = { url: "https://abc.supabase.co", key: "sb_publishable_x" };

    it("pede com a chave publicável e devolve o endereço", async () => {
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ url: "https://abc.supabase.co/s/v" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      expect(await fetchApprovalVideoUrl(config, "t")).toBe("https://abc.supabase.co/s/v");
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect((init.headers as Record<string, string>).apikey).toBe("sb_publishable_x");
    });

    it("404, resposta estranha ou rede fora: null (a página segue sem o vídeo)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("{}", { status: 404 })),
      );
      expect(await fetchApprovalVideoUrl(config, "t")).toBeNull();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response("não é json", { status: 200 })),
      );
      expect(await fetchApprovalVideoUrl(config, "t")).toBeNull();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("offline");
        }),
      );
      expect(await fetchApprovalVideoUrl(config, "t")).toBeNull();
    });
  });
});
