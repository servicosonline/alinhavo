import { describe, expect, it } from "vitest";
import { pickVideoType, turntableAngle, turntablePosition, videoExtension, videoFileName, VIDEO_TYPES } from "./video";

describe("pickVideoType", () => {
  it("prefere MP4 e cai para WebM", () => {
    expect(pickVideoType(() => true)).toBe(VIDEO_TYPES[0]);
    expect(pickVideoType((t) => t.startsWith("video/webm"))).toBe("video/webm;codecs=vp9");
    expect(pickVideoType((t) => t === "video/webm")).toBe("video/webm");
  });
  it("sem nenhum formato: null; navegador que lança não derruba", () => {
    expect(pickVideoType(() => false)).toBeNull();
    expect(
      pickVideoType((t) => {
        if (t.includes("mp4")) throw new Error("não sei");
        return true;
      }),
    ).toBe("video/webm;codecs=vp9");
  });
});

describe("volta da câmera", () => {
  it("começa de frente, passa pelas costas na metade e fecha a volta", () => {
    expect(turntableAngle(0)).toBe(0);
    expect(turntableAngle(4, 8)).toBeCloseTo(Math.PI);
    expect(turntableAngle(8, 8)).toBeCloseTo(2 * Math.PI);
    expect(turntableAngle(99, 8)).toBeCloseTo(2 * Math.PI);
    expect(turntableAngle(-1, 8)).toBe(0);
    expect(turntableAngle(1, 0)).toBe(0);
  });
  it("posição: de frente em +Z, de costas em −Z, sempre à mesma distância e altura", () => {
    const front = turntablePosition(0, 3, 1.2);
    expect(front).toEqual({ x: 0, y: 1.2, z: 3 });
    const back = turntablePosition(Math.PI, 3, 1.2);
    expect(back.z).toBeCloseTo(-3);
    const side = turntablePosition(Math.PI / 2, 3, 1.2);
    expect(Math.hypot(side.x, side.z)).toBeCloseTo(3);
  });
});

describe("arquivo", () => {
  it("extensão pelo tipo e nome sem acento nem espaço", () => {
    expect(videoExtension("video/mp4;codecs=avc1.42E01E")).toBe("mp4");
    expect(videoExtension("video/webm;codecs=vp9")).toBe("webm");
    expect(videoFileName("Saia évasê / Verão", "M", "video/webm")).toBe("alinhavo-360-saia-evase-verao-m.webm");
    expect(videoFileName("", "", "video/mp4")).toBe("alinhavo-360.mp4");
  });
});
