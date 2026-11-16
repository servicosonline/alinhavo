/**
 * CPF e CNPJ: a mesma regra do banco (private.valid_cpf / valid_cnpj, migração conta_e_trial),
 * para avisar na tela antes de salvar. O banco confere de novo.
 */

export type DocumentType = "cpf" | "cnpj";

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function validCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const d = [...digits].map(Number);
  const check = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += d[i]! * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === d[9] && check(10) === d[10];
}

export function validCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const d = [...digits].map(Number);
  const check = (weights: number[]) => {
    const s = weights.reduce((acc, w, i) => acc + d[i]! * w, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return check([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === d[12] && check([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === d[13];
}

/** Lê o que a pessoa digitou (com ou sem pontuação). Vazio = sem documento. */
export function parseDocument(text: string): { ok: true; value: { type: DocumentType; digits: string } | null } | { ok: false; error: string } {
  const digits = onlyDigits(text);
  if (!digits) return { ok: true, value: null };
  if (digits.length === 11) {
    return validCpf(digits) ? { ok: true, value: { type: "cpf", digits } } : { ok: false, error: "Esse CPF não confere. Verifique os números." };
  }
  if (digits.length === 14) {
    return validCnpj(digits) ? { ok: true, value: { type: "cnpj", digits } } : { ok: false, error: "Esse CNPJ não confere. Verifique os números." };
  }
  return { ok: false, error: "Digite um CPF (11 números) ou um CNPJ (14 números)." };
}

/** 52998224725 → 529.982.247-25; 11222333000181 → 11.222.333/0001-81. */
export function formatDocument(digits: string | null | undefined): string {
  if (!digits) return "";
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return digits;
}
