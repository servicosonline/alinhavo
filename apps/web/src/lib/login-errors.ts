/** Formato mínimo do erro do Supabase Auth que interessa aqui. */
export type OtpError = { status?: number; code?: string; message?: string };

const EMAIL_RE = /[^\s@"']+@[^\s@"']+/g;

/** Mensagem para a tela, em português, a partir do erro do envio do link. */
export function otpErrorMessage(error: OtpError): string {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Muitos pedidos seguidos. Espere um minuto e tente de novo.";
  }
  if (error.code === "email_address_invalid") return "Digite um e-mail válido.";
  if (error.code === "email_address_not_authorized") {
    return "Este e-mail ainda não pode receber o link de acesso. Fale com quem administra o Alinhavo.";
  }
  return "Não conseguimos enviar o link agora. Tente de novo em instantes.";
}

/**
 * Linha para o log do servidor: status, código e motivo, sem o e-mail da
 * pessoa (o Supabase às vezes repete o endereço na mensagem).
 */
export function otpErrorLog(error: OtpError): string {
  const reason = (error.message ?? "").replace(EMAIL_RE, "<e-mail>");
  const hint = error.status === 401 ? " (chave publicável recusada: confira NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)" : "";
  return `[entrar] Envio do link falhou: status=${error.status ?? "?"} code=${error.code ?? "?"} motivo="${reason}"${hint}`;
}
