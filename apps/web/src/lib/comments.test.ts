import { describe, expect, it } from "vitest";
import { mergeComment, readCommentBody, removeComment, whenLabel, type CommentView } from "./comments";

const c = (id: string, at: string): CommentView => ({ id, author: "u", body: id, created_at: at });

describe("comentários na tela", () => {
  it("junta sem repetir e em ordem de criação", () => {
    const list = [c("a", "2026-11-14T10:00:00Z"), c("b", "2026-11-14T10:05:00Z")];
    expect(mergeComment(list, c("b", "2026-11-14T10:05:00Z")).map((x) => x.id)).toEqual(["a", "b"]);
    expect(mergeComment(list, c("z", "2026-11-14T10:01:00Z")).map((x) => x.id)).toEqual(["a", "z", "b"]);
    expect(removeComment(list, "a").map((x) => x.id)).toEqual(["b"]);
  });

  it("lê o texto e recusa vazio ou longo demais", () => {
    expect(readCommentBody("  Subir a cintura  ")).toBe("Subir a cintura");
    expect(readCommentBody("   ")).toBeNull();
    expect(readCommentBody("x".repeat(4001))).toBeNull();
  });

  it("diz quando foi", () => {
    const now = Date.parse("2026-11-14T12:00:00Z");
    expect(whenLabel("2026-11-14T11:59:40Z", now)).toBe("agora");
    expect(whenLabel("2026-11-14T11:55:00Z", now)).toBe("há 5 min");
    expect(whenLabel("2026-11-14T09:00:00Z", now)).toBe("há 3 h");
    expect(whenLabel("2026-11-12T12:00:00Z", now)).toMatch(/12\/11/);
  });
});
