import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyToCents, parseQuantity } from "./money";

describe("dinheiro", () => {
  it("lê reais como a modelista digita", () => {
    expect(parseMoneyToCents("39,90")).toBe(3990);
    expect(parseMoneyToCents("39.90")).toBe(3990);
    expect(parseMoneyToCents("R$ 1.234,50")).toBe(123450);
    expect(parseMoneyToCents("40")).toBe(4000);
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeUndefined();
    expect(parseMoneyToCents("1,234")).toBeUndefined();
  });

  it("mostra em reais", () => {
    expect(formatMoney(3990)).toMatch(/R\$\s?39,90/);
    expect(formatMoney(null)).toBe("—");
  });

  it("quantidade positiva com até 2 casas", () => {
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity("0")).toBeUndefined();
    expect(parseQuantity("-1")).toBeUndefined();
  });
});
