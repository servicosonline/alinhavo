/** Nome de arquivo seguro: "Saia lápis base" → "saia-lapis-base". */
export function fileSlug(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "molde"
  );
}
