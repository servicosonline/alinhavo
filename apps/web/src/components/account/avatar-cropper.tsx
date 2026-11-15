"use client";

import { setAvatar } from "@/app/painel/conta/actions";
import { ImageCropper } from "./image-cropper";

/** Foto de perfil: o recorte quadrado com o círculo, na pasta da pessoa no bucket `avatars`. */
export function AvatarCropper({ userId, hasPhoto }: { userId: string; hasPhoto: boolean }) {
  return <ImageCropper bucket="avatars" folder={userId} onSave={setAvatar} hasImage={hasPhoto} />;
}
