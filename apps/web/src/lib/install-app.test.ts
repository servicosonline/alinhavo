import { describe, expect, it } from "vitest";
import { iosInstallPlace } from "./install-app";

const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0 Mobile/15E148 Safari/604.1";
const INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0";
const IPAD_AS_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";

describe("iosInstallPlace", () => {
  it("Safari no iPhone: Compartilhar embaixo", () => {
    expect(iosInstallPlace(SAFARI)).toBe("safari-iphone");
  });

  it("Chrome no iPhone e iPad (que se apresenta como Mac): Compartilhar em cima", () => {
    expect(iosInstallPlace(CHROME)).toBe("top");
    expect(iosInstallPlace(IPAD_AS_MAC, 5, "MacIntel")).toBe("top");
  });

  it("navegador dentro de outro app não instala", () => {
    expect(iosInstallPlace(INSTAGRAM)).toBe("in-app");
  });
});
