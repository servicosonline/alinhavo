/**
 * Tipos do banco, no formato do `supabase gen types typescript`.
 *
 * PROVISÓRIO: escrito à mão a partir de supabase/migrations/ enquanto não há
 * projeto Supabase para gerar. Assim que houver, substitua por:
 *   npx supabase gen types typescript --project-id <id> > apps/web/src/lib/supabase/database.types.ts
 * Até lá, toda migração nova precisa atualizar este arquivo.
 */

export type OrgRole = "owner" | "admin" | "modelista" | "estilista" | "leitura";

type OrgRow = {
  id: string;
  name: string;
  plan: string;
  /** Capa (bucket público org-capas, caminho <org_id>/...). */
  thumbnail_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentType = "cpf" | "cnpj";
export type SubscriptionStatus = "trial" | "ativa" | "vencida" | "cancelada" | "cortesia";

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  document_type: DocumentType | null;
  document: string | null;
  avatar_path: string | null;
  welcome_seen_at: string | null;
  onboarding_closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileWrite = {
  first_name?: string | null;
  last_name?: string | null;
  document_type?: DocumentType | null;
  document?: string | null;
  avatar_path?: string | null;
  welcome_seen_at?: string | null;
  onboarding_closed_at?: string | null;
};

type OrgSubscriptionRow = {
  org_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  seats: number;
  created_at: string;
  updated_at: string;
};

type ActivityLogRow = {
  id: number;
  org_id: string;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export type TrackingShow = { status?: boolean; prazos?: boolean; cronograma?: boolean; imagens?: boolean; molde?: boolean };

type TrackingLinkRow = {
  id: string;
  org_id: string;
  kind: "produto" | "colecao";
  product_id: string | null;
  collection_id: string | null;
  token: string;
  show: TrackingShow;
  expires_at: string | null;
  revoked_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  created_by: string | null;
  created_at: string;
};

type RoiSettingsRow = {
  org_id: string;
  pilots_per_month: number;
  fabric_per_pilot_mm: number;
  price_per_meter_cents: number;
  hours_per_pilot: number;
  hour_rate_cents: number;
  monthly_fabric_mm: number;
  efficiency_pct: number | null;
  goal_monthly_cents: number | null;
  created_at: string;
  updated_at: string;
};

type RoiSettingsWrite = Partial<Omit<RoiSettingsRow, "org_id" | "created_at" | "updated_at">>;

type RoiMonthRow = { org_id: string; month: string; pilots_cut: number; updated_at: string };

type OrgMemberRow = {
  org_id: string;
  user_id: string;
  role: OrgRole;
  /** Pode criar organizações próprias (vem do convite; dono e admin mudam). */
  can_create_orgs: boolean;
  created_at: string;
  updated_at: string;
};

type InviteRow = {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  token: string;
  created_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  /** A pessoa convidada pode criar organizações próprias. */
  can_create_orgs: boolean;
  created_at: string;
  updated_at: string;
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type PatternOrigin = "editor" | "prova" | "scan" | "importacao";

type Timestamps = { created_at: string; updated_at: string };
type ClientRow = { id: string; org_id: string; name: string } & Timestamps;
type SizeChartRow = { id: string; org_id: string; client_id: string | null; name: string; template: string | null } & Timestamps;
type SizeRow = {
  id: string;
  org_id: string;
  size_chart_id: string;
  label: string;
  position: number;
  is_base: boolean;
} & Timestamps;
type MeasurementRow = { id: string; org_id: string; size_id: string; name: string; value_mm: number } & Timestamps;
type PatternRow = {
  id: string;
  org_id: string;
  name: string;
  size_chart_id: string | null;
  current_version: number;
  created_by: string | null;
  archived_at: string | null;
} & Timestamps;
type PatternVersionRow = {
  id: string;
  org_id: string;
  pattern_id: string;
  number: number;
  /** PatternDocument de @alinhavo/geometry; valide com validatePattern antes de usar. */
  document: Json;
  origin: PatternOrigin;
  message: string | null;
  created_by: string | null;
  created_at: string;
};

type ApprovalStatus = "pendente" | "aprovado" | "ajustes";
type ApprovalAngle = "atual" | "frente" | "costas" | "lado";
type ApprovalRow = {
  id: string;
  org_id: string;
  pattern_id: string;
  version_number: number;
  token: string;
  /** Como a Prova estava (tamanho, tecido, pose). */
  settings: Json;
  expires_at: string;
  status: ApprovalStatus;
  reviewer_name: string | null;
  reviewer_comment: string | null;
  decided_at: string | null;
  created_by: string | null;
  created_at: string;
  /** Vídeo 360° no Storage (bucket aprovacoes), ligado por attach_approval_video. */
  video_path: string | null;
};
type ApprovalImageRow = {
  id: string;
  org_id: string;
  approval_id: string;
  position: number;
  angle: ApprovalAngle;
  mime: "image/jpeg" | "image/png";
  /** bytea: o PostgREST devolve como texto hexadecimal ("\x..."). */
  data: string;
};
/** O que public_approval devolve (null se o token não vale). */
export type PublicApproval = {
  pattern_name: string;
  version: number;
  settings: Json;
  status: ApprovalStatus;
  reviewer_name: string | null;
  reviewer_comment: string | null;
  decided_at: string | null;
  expires_at: string;
  /** Há vídeo 360°: o endereço vem da Edge Function aprovacao-video. */
  has_video: boolean;
  images: { angle: ApprovalAngle; mime: "image/jpeg" | "image/png"; data: string }[];
};

export type ProductStatus = "ideia" | "modelagem" | "prova" | "aprovado" | "producao";
/** Entrada do produto num estágio (só o banco escreve). */
type ProductStatusEventRow = { id: number; org_id: string; product_id: string; status: ProductStatus; entered_at: string; backfilled: boolean };
/** Tempo por estágio (production_stage_times): `stage` é um ProductStatus ou "total". Segundos. */
export type StageTimeRow = {
  stage: string;
  done_count: number;
  done_avg_seconds: number | null;
  done_median_seconds: number | null;
  current_count: number;
  current_avg_seconds: number | null;
};
type CollectionRow = {
  id: string;
  org_id: string;
  name: string;
  season: string | null;
  starts_on: string | null;
  launch_on: string | null;
  archived_at: string | null;
} & Timestamps;
type ProductRow = {
  id: string;
  org_id: string;
  collection_id: string | null;
  reference: string | null;
  name: string;
  status: ProductStatus;
  size_chart_id: string | null;
  pattern_id: string | null;
  fabric_id: string | null;
  /** Texto de venda (loja, catálogo); até 2000 caracteres. */
  sales_description: string | null;
  /** Texto técnico (entra na ficha); até 4000 caracteres. */
  technical_description: string | null;
  /** Data de entrega do produto (AAAA-MM-DD). */
  due_on: string | null;
  /** Foto enviada pela equipe, bucket privado `produtos` (`<org>/<produto>/<nome>`). */
  photo_path: string | null;
} & Timestamps;
type ApiKeyRow = {
  id: string;
  org_id: string;
  name: string;
  /** Começo do segredo (alv_ + 8), para reconhecer a chave. O hash não é legível. */
  prefix: string;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};
/** Endpoint de webhook (sem o segredo, que não é legível pelo app). */
type WebhookEndpointRow = {
  id: string;
  org_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_by: string | null;
  created_at: string;
};
export type WebhookStatus = "pendente" | "enviando" | "entregue" | "falhou";
/** Entrega de webhook (sem o corpo, que não é legível pelo app). */
type WebhookDeliveryRow = {
  id: string;
  org_id: string;
  endpoint_id: string;
  event: string;
  status: WebhookStatus;
  attempts: number;
  next_attempt_at: string;
  last_status_code: number | null;
  last_error: string | null;
  created_at: string;
  delivered_at: string | null;
};
export type AiGenerationStatus = "reservada" | "pronta" | "erro";
export type AiGenerationKind = "textos_produto" | "foto_catalogo";
/** Foto de catálogo por IA; o id é o da geração (ai_generations). Arquivo no bucket `catalogo`. */
type CatalogPhotoRow = {
  id: string;
  org_id: string;
  product_id: string;
  path: string;
  settings: Json;
  model: string | null;
  created_by: string | null;
  created_at: string;
};
type AiGenerationRow = {
  id: string;
  org_id: string;
  product_id: string;
  kind: AiGenerationKind;
  status: AiGenerationStatus;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
};
type MilestoneRow = {
  id: string;
  org_id: string;
  collection_id: string;
  title: string;
  /** AAAA-MM-DD */
  due_on: string;
  assignee: string | null;
  done_at: string | null;
  position: number;
} & Timestamps;

/** Presets da Prova (os mesmos de packages/cloth/src/fabrics.ts; a trava do banco lista os mesmos). */
export type FabricPreset =
  | "malha"
  | "planoLeve"
  | "jeans"
  | "tricoline"
  | "viscose"
  | "linho"
  | "crepe"
  | "chiffon"
  | "sarja"
  | "jeansElastano"
  | "ribana"
  | "moletom";
/** Propriedades do tecido na Prova (todas opcionais). */
type FabricProvaColumns = {
  stretch_pct: number | null;
  drape: number | null;
  thickness_mm: number | null;
  /** Foto do tecido, data URL até 200 000 caracteres. */
  texture: string | null;
  /** Largura real que a foto mostra, em cm. */
  texture_cm: number | null;
};
type FabricRow = {
  id: string;
  org_id: string;
  name: string;
  composition: string | null;
  width_mm: number | null;
  weight_gsm: number | null;
  /** centavos por metro linear */
  price_cents: number | null;
  preset: FabricPreset | null;
} & FabricProvaColumns &
  Timestamps;
export type TrimUnit = "un" | "par" | "m" | "cm";
type ProductTrimRow = {
  id: string;
  org_id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit: TrimUnit;
  unit_price_cents: number | null;
  position: number;
} & Timestamps;
type TechPackRow = {
  id: string;
  org_id: string;
  product_id: string;
  number: number;
  pattern_id: string | null;
  pattern_version: number | null;
  /** TechPackData de @alinhavo/export/tech-pack (formato 1). */
  data: Json;
  created_by: string | null;
  created_at: string;
};

type MarkerRow = {
  id: string;
  org_id: string;
  product_id: string;
  number: number;
  pattern_id: string | null;
  pattern_version: number;
  fabric_id: string | null;
  width_mm: number;
  /** Tamanho → peças prontas. */
  demand: Json;
  length_mm: number;
  efficiency: number;
  /** MarkerLayout de @alinhavo/nesting (formato 1). */
  layout: Json;
  created_by: string | null;
  created_at: string;
};

export type NestJobStatus = "fila" | "rodando" | "pronto" | "erro";

export type NestJobRow = {
  id: string;
  org_id: string;
  product_id: string;
  pattern_id: string | null;
  pattern_version: number;
  width_mm: number;
  gap_mm: number;
  one_way: boolean;
  /** Tamanho → peças prontas. */
  demand: Json;
  status: NestJobStatus;
  /** 0 a 1. */
  progress: number;
  attempts: number;
  claimed_by: string | null;
  claimed_at: string | null;
  lease_until: string | null;
  marker_id: string | null;
  error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
};

/** Manequim salvo na Prova (medidas em mm e condições; formato lido por lib/prova/saved-bodies.ts). */
export type BodyPresetRow = {
  id: string;
  org_id: string;
  name: string;
  measurements: Json;
  conditions: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CommentRow = {
  id: string;
  org_id: string;
  product_id: string;
  author: string | null;
  body: string;
  pattern_version: number | null;
  created_at: string;
};

/** Chave estrangeira simples (col → ref.id). */
type Fk<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

/** Chave composta que carrega org_id ((col, org_id) → ref(id, org_id)). */
type OrgFk<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col, "org_id"];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id", "org_id"];
};

export type Database = {
  public: {
    Tables: {
      orgs: {
        Row: OrgRow;
        Insert: never;
        Update: { name?: string; thumbnail_path?: string | null };
        Relationships: [];
      };
      org_members: {
        Row: OrgMemberRow;
        Insert: never;
        Update: { role?: OrgRole; can_create_orgs?: boolean };
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: InviteRow;
        Insert: { org_id: string; email: string; role: OrgRole; created_by?: string; expires_at?: string; can_create_orgs?: boolean };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: ClientRow;
        Insert: { org_id: string; name: string };
        Update: { name?: string };
        Relationships: [Fk<"clients_org_id_fkey", "org_id", "orgs">];
      };
      size_charts: {
        Row: SizeChartRow;
        Insert: { org_id: string; name: string; client_id?: string | null; template?: string | null };
        Update: { name?: string; client_id?: string | null };
        Relationships: [
          Fk<"size_charts_org_id_fkey", "org_id", "orgs">,
          OrgFk<"size_charts_client_id_org_id_fkey", "client_id", "clients">,
        ];
      };
      sizes: {
        Row: SizeRow;
        Insert: { org_id: string; size_chart_id: string; label: string; position: number; is_base?: boolean };
        Update: { label?: string; position?: number; is_base?: boolean };
        Relationships: [OrgFk<"sizes_size_chart_id_org_id_fkey", "size_chart_id", "size_charts">];
      };
      measurements: {
        Row: MeasurementRow;
        Insert: { org_id: string; size_id: string; name: string; value_mm: number };
        Update: { value_mm?: number };
        Relationships: [OrgFk<"measurements_size_id_org_id_fkey", "size_id", "sizes">];
      };
      patterns: {
        Row: PatternRow;
        Insert: { org_id: string; name: string; size_chart_id?: string | null };
        Update: { name?: string; size_chart_id?: string | null; archived_at?: string | null };
        Relationships: [
          Fk<"patterns_org_id_fkey", "org_id", "orgs">,
          OrgFk<"patterns_size_chart_id_org_id_fkey", "size_chart_id", "size_charts">,
        ];
      };
      pattern_versions: {
        Row: PatternVersionRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"pattern_versions_pattern_id_org_id_fkey", "pattern_id", "patterns">];
      };
      collections: {
        Row: CollectionRow;
        Insert: { org_id: string; name: string; season?: string | null; starts_on?: string | null; launch_on?: string | null };
        Update: { name?: string; season?: string | null; starts_on?: string | null; launch_on?: string | null; archived_at?: string | null };
        Relationships: [Fk<"collections_org_id_fkey", "org_id", "orgs">];
      };
      product_status_events: {
        Row: ProductStatusEventRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"product_status_events_product_id_org_id_fkey", "product_id", "products">];
      };
      products: {
        Row: ProductRow;
        Insert: {
          org_id: string;
          name: string;
          collection_id?: string | null;
          reference?: string | null;
          status?: ProductStatus;
          size_chart_id?: string | null;
          pattern_id?: string | null;
          fabric_id?: string | null;
          due_on?: string | null;
        };
        Update: {
          due_on?: string | null;
          photo_path?: string | null;
          collection_id?: string | null;
          reference?: string | null;
          name?: string;
          status?: ProductStatus;
          size_chart_id?: string | null;
          pattern_id?: string | null;
          fabric_id?: string | null;
          sales_description?: string | null;
          technical_description?: string | null;
        };
        Relationships: [
          Fk<"products_org_id_fkey", "org_id", "orgs">,
          OrgFk<"products_fabric_id_org_id_fkey", "fabric_id", "fabrics">,
          OrgFk<"products_collection_id_org_id_fkey", "collection_id", "collections">,
          OrgFk<"products_size_chart_id_org_id_fkey", "size_chart_id", "size_charts">,
          OrgFk<"products_pattern_id_org_id_fkey", "pattern_id", "patterns">,
        ];
      };
      api_keys: {
        Row: ApiKeyRow;
        Insert: never;
        Update: never;
        Relationships: [Fk<"api_keys_org_id_fkey", "org_id", "orgs">];
      };
      webhook_endpoints: {
        Row: WebhookEndpointRow;
        Insert: never;
        Update: never;
        Relationships: [Fk<"webhook_endpoints_org_id_fkey", "org_id", "orgs">];
      };
      webhook_deliveries: {
        Row: WebhookDeliveryRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"webhook_deliveries_endpoint_id_org_id_fkey", "endpoint_id", "webhook_endpoints">];
      };
      ai_generations: {
        Row: AiGenerationRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"ai_generations_product_id_org_id_fkey", "product_id", "products">];
      };
      catalog_photos: {
        Row: CatalogPhotoRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"catalog_photos_product_id_org_id_fkey", "product_id", "products">];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileWrite & { user_id?: string };
        Update: ProfileWrite;
        Relationships: [];
      };
      org_subscriptions: {
        Row: OrgSubscriptionRow;
        Insert: never;
        Update: never;
        Relationships: [Fk<"org_subscriptions_org_id_fkey", "org_id", "orgs">];
      };
      activity_log: {
        Row: ActivityLogRow;
        Insert: never;
        Update: never;
        Relationships: [Fk<"activity_log_org_id_fkey", "org_id", "orgs">];
      };
      support_threads: {
        Row: {
          id: string;
          org_id: string | null;
          user_id: string;
          subject: string;
          status: "aberta" | "respondida" | "fechada";
          last_message_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      support_messages: {
        Row: { id: string; thread_id: string; org_id: string | null; author: string | null; from_admin: boolean; body: string; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          body: string;
          link: string | null;
          audience: string;
          audience_value: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          image_path: string | null;
          video_url: string | null;
          published: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      tracking_links: {
        Row: TrackingLinkRow;
        Insert: never;
        Update: never;
        Relationships: [Fk<"tracking_links_org_id_fkey", "org_id", "orgs">];
      };
      roi_settings: {
        Row: RoiSettingsRow;
        Insert: RoiSettingsWrite & { org_id: string };
        Update: RoiSettingsWrite;
        Relationships: [Fk<"roi_settings_org_id_fkey", "org_id", "orgs">];
      };
      roi_months: {
        Row: RoiMonthRow;
        Insert: { org_id: string; month: string; pilots_cut: number };
        Update: { pilots_cut?: number };
        Relationships: [Fk<"roi_months_org_id_fkey", "org_id", "orgs">];
      };
      body_presets: {
        Row: BodyPresetRow;
        Insert: { org_id: string; name: string; measurements: Json; conditions?: Json };
        Update: { name?: string; measurements?: Json; conditions?: Json };
        Relationships: [Fk<"body_presets_org_id_fkey", "org_id", "orgs">];
      };
      fabrics: {
        Row: FabricRow;
        Insert: {
          org_id: string;
          name: string;
          composition?: string | null;
          width_mm?: number | null;
          weight_gsm?: number | null;
          price_cents?: number | null;
          preset?: FabricPreset | null;
        } & Partial<FabricProvaColumns>;
        Update: {
          name?: string;
          composition?: string | null;
          width_mm?: number | null;
          weight_gsm?: number | null;
          price_cents?: number | null;
          preset?: FabricPreset | null;
        } & Partial<FabricProvaColumns>;
        Relationships: [Fk<"fabrics_org_id_fkey", "org_id", "orgs">];
      };
      product_trims: {
        Row: ProductTrimRow;
        Insert: {
          org_id: string;
          product_id: string;
          name: string;
          quantity: number;
          unit: TrimUnit;
          unit_price_cents?: number | null;
          position?: number;
        };
        Update: { name?: string; quantity?: number; unit?: TrimUnit; unit_price_cents?: number | null; position?: number };
        Relationships: [OrgFk<"product_trims_product_id_org_id_fkey", "product_id", "products">];
      };
      tech_packs: {
        Row: TechPackRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"tech_packs_product_id_org_id_fkey", "product_id", "products">];
      };
      markers: {
        Row: MarkerRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"markers_product_id_org_id_fkey", "product_id", "products">];
      };
      nest_jobs: {
        Row: NestJobRow;
        Insert: never;
        Update: never;
        Relationships: [
          OrgFk<"nest_jobs_product_id_org_id_fkey", "product_id", "products">,
          OrgFk<"nest_jobs_marker_id_org_id_fkey", "marker_id", "markers">,
        ];
      };
      comments: {
        Row: CommentRow;
        Insert: { org_id: string; product_id: string; body: string; pattern_version?: number | null };
        Update: never;
        Relationships: [OrgFk<"comments_product_id_org_id_fkey", "product_id", "products">];
      };
      milestones: {
        Row: MilestoneRow;
        Insert: {
          org_id: string;
          collection_id: string;
          title: string;
          due_on: string;
          assignee?: string | null;
          done_at?: string | null;
          position?: number;
        };
        Update: { title?: string; due_on?: string; assignee?: string | null; done_at?: string | null; position?: number };
        Relationships: [OrgFk<"milestones_collection_id_org_id_fkey", "collection_id", "collections">];
      };
      approvals: {
        Row: ApprovalRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"approvals_pattern_id_org_id_fkey", "pattern_id", "patterns">];
      };
      approval_images: {
        Row: ApprovalImageRow;
        Insert: never;
        Update: never;
        Relationships: [OrgFk<"approval_images_approval_id_org_id_fkey", "approval_id", "approvals">];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_org: { Args: { p_name: string }; Returns: OrgRow };
      accept_invite: { Args: { p_token: string }; Returns: OrgMemberRow };
      org_plan_status: {
        Args: { p_org_id: string };
        Returns: { plan_id: string; status: SubscriptionStatus; trial_ends_at: string | null; days_left: number | null; seats: number }[];
      };
      create_tracking_link: {
        Args: { p_kind: "produto" | "colecao"; p_target: string; p_show: TrackingShow; p_days?: number | null };
        Returns: { id: string; token: string }[];
      };
      revoke_tracking_link: { Args: { p_id: string }; Returns: undefined };
      public_tracking: { Args: { p_token: string }; Returns: unknown };
      touch_tracking: { Args: { p_token: string }; Returns: undefined };
      log_event: { Args: { p_org_id: string; p_action: string; p_entity_id?: string | null }; Returns: undefined };
      onboarding_progress: {
        Args: Record<string, never>;
        Returns: {
          has_profile: boolean;
          has_org: boolean;
          has_pattern: boolean;
          has_prova: boolean;
          has_approval: boolean;
          has_invite: boolean;
        }[];
      };
      org_team: {
        Args: { p_org_id: string };
        Returns: { user_id: string; email: string; role: OrgRole; joined_at: string }[];
      };
      save_pattern_version: {
        Args: {
          p_pattern_id: string;
          p_document: Json;
          p_origin: PatternOrigin;
          p_expected_version: number;
          p_message?: string | null;
        };
        Returns: PatternVersionRow;
      };
      set_base_size: { Args: { p_size_id: string }; Returns: undefined };
      create_approval: {
        Args: {
          p_pattern_id: string;
          p_version: number;
          p_settings: Json;
          /** [{ angle, data: base64 }], de 1 a 4. */
          p_images: Json;
          p_days?: number;
        };
        Returns: { id: string; token: string; expires_at: string }[];
      };
      create_tech_pack: { Args: { p_product_id: string; p_pattern_version: number; p_data: Json }; Returns: TechPackRow };
      reserve_ai_generation: { Args: { p_product_id: string; p_kind?: AiGenerationKind }; Returns: string };
      create_catalog_photo: {
        Args: { p_generation_id: string; p_ext: "jpg" | "png" | "webp"; p_settings?: Json; p_model?: string | null };
        Returns: CatalogPhotoRow;
      };
      finish_ai_generation: {
        Args: { p_id: string; p_ok: boolean; p_model?: string | null; p_input_tokens?: number | null; p_output_tokens?: number | null };
        Returns: undefined;
      };
      production_stage_times: { Args: { p_org_id: string | null }; Returns: StageTimeRow[] };
      platform_orgs: { Args: Record<string, never>; Returns: { id: string; name: string; created_at: string; members: number; products: number }[] };
      am_platform_admin: { Args: Record<string, never>; Returns: boolean };
      my_platform_role: { Args: Record<string, never>; Returns: "dono" | "suporte" | null };
      my_org_creation: { Args: Record<string, never>; Returns: { allowed: boolean; blocked_by: string | null; trial_available: boolean }[] };
      my_notifications: {
        Args: { p_limit?: number };
        Returns: { id: string; title: string; body: string; link: string | null; created_at: string; read: boolean }[];
      };
      mark_notifications_read: { Args: { p_ids?: string[] | null }; Returns: undefined };
      ai_limit_for: { Args: { p_org_id: string; p_kind?: string }; Returns: number | null };
      platform_set_ai_limit: { Args: { p_org_id: string; p_kind: string; p_limit: number | null }; Returns: undefined };
      platform_ai_usage: {
        Args: { p_org_id?: string | null };
        Returns: {
          org_id: string;
          org_name: string;
          kind: "textos_produto" | "foto_catalogo";
          used: number;
          monthly_limit: number;
          custom_limit: boolean;
          errors: number;
          by_claude: number;
          by_openai: number;
          input_tokens: number;
          output_tokens: number;
        }[];
      };
      open_support_thread: { Args: { p_subject: string; p_body: string; p_org_id?: string | null }; Returns: string };
      send_support_message: { Args: { p_thread_id: string; p_body: string }; Returns: string };
      close_support_thread: { Args: { p_thread_id: string }; Returns: undefined };
      platform_support_threads: {
        Args: { p_status?: string | null };
        Returns: {
          id: string;
          subject: string;
          status: "aberta" | "respondida" | "fechada";
          last_message_at: string;
          user_email: string;
          org_id: string | null;
          org_name: string | null;
          last_body: string | null;
          messages: number;
        }[];
      };
      platform_send_notification: {
        Args: { p_title: string; p_body: string; p_link: string | null; p_audience: string; p_value?: string | null };
        Returns: string;
      };
      platform_notifications: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          title: string;
          body: string;
          link: string | null;
          audience: string;
          audience_value: string | null;
          created_at: string;
          reads: number;
        }[];
      };
      platform_save_announcement: {
        Args: { p_id: string | null; p_title: string; p_body: string; p_image_path: string | null; p_video_url: string | null; p_published: boolean };
        Returns: string;
      };
      platform_delete_announcement: { Args: { p_id: string }; Returns: string | null };
      platform_clients: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          created_at: string;
          thumbnail_path: string | null;
          plan_id: string | null;
          status: SubscriptionStatus | null;
          trial_ends_at: string | null;
          full_seats: number;
          stylist_seats: number;
          reader_seats: number;
          last_activity: string | null;
          actions_30d: number;
        }[];
      };
      platform_client: { Args: { p_org_id: string }; Returns: unknown };
      platform_create_invite: { Args: { p_org_id: string; p_email: string; p_role: OrgRole }; Returns: string };
      platform_set_member_role: { Args: { p_org_id: string; p_user_id: string; p_role: OrgRole }; Returns: undefined };
      platform_remove_member: { Args: { p_org_id: string; p_user_id: string }; Returns: undefined };
      platform_set_subscription: {
        Args: { p_org_id: string; p_status: SubscriptionStatus; p_trial_days?: number | null; p_plan_id?: string | null };
        Returns: undefined;
      };
      platform_admins_list: { Args: Record<string, never>; Returns: { user_id: string; email: string; role: "dono" | "suporte"; created_at: string }[] };
      platform_add_admin: { Args: { p_email: string; p_role: "dono" | "suporte" }; Returns: undefined };
      platform_remove_admin: { Args: { p_user_id: string }; Returns: undefined };
      platform_audit_list: {
        Args: { p_limit?: number };
        Returns: {
          id: number;
          admin_email: string | null;
          action: string;
          org_id: string | null;
          org_name: string | null;
          target_email: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        }[];
      };
      log_client_error: { Args: { p_path: string; p_message: string; p_digest?: string | null; p_org_id?: string | null }; Returns: undefined };
      platform_errors: {
        Args: { p_org_id?: string | null; p_limit?: number };
        Returns: {
          id: number;
          user_email: string | null;
          org_id: string | null;
          org_name: string | null;
          path: string;
          message: string;
          digest: string | null;
          created_at: string;
        }[];
      };
      ai_generations_this_month: { Args: { p_org_id: string; p_kind?: AiGenerationKind }; Returns: number };
      create_api_key: { Args: { p_org_id: string; p_name: string }; Returns: { id: string; secret: string; prefix: string }[] };
      revoke_api_key: { Args: { p_id: string }; Returns: undefined };
      create_webhook_endpoint: { Args: { p_org_id: string; p_url: string; p_events: string[] }; Returns: { id: string; secret: string }[] };
      set_webhook_endpoint_active: { Args: { p_id: string; p_active: boolean }; Returns: undefined };
      delete_webhook_endpoint: { Args: { p_id: string }; Returns: undefined };
      send_test_webhook: { Args: { p_id: string }; Returns: string };
      create_marker: {
        Args: {
          p_product_id: string;
          p_pattern_version: number;
          p_fabric_id: string | null;
          p_width_mm: number;
          p_demand: Json;
          p_length_mm: number;
          p_efficiency: number;
          p_layout: Json;
        };
        Returns: MarkerRow;
      };
      enqueue_nest_job: {
        Args: { p_product_id: string; p_width_mm: number; p_demand: Json; p_gap_mm: number; p_one_way: boolean };
        Returns: NestJobRow;
      };
      /** Nada para pegar: null (ou a linha com id nulo). */
      claim_nest_job: { Args: { p_org_id: string }; Returns: NestJobRow | null };
      nest_job_progress: { Args: { p_job_id: string; p_progress: number }; Returns: boolean };
      finish_nest_job: { Args: { p_job_id: string; p_length_mm: number; p_efficiency: number; p_layout: Json }; Returns: MarkerRow };
      fail_nest_job: { Args: { p_job_id: string; p_error: string }; Returns: boolean };
      release_nest_job: { Args: { p_job_id: string }; Returns: boolean };
      retry_nest_job: { Args: { p_job_id: string }; Returns: NestJobRow };
      public_approval: { Args: { p_token: string }; Returns: PublicApproval | null };
      attach_approval_video: { Args: { p_approval_id: string; p_path: string | null }; Returns: undefined };
      decide_approval: {
        Args: { p_token: string; p_status: ApprovalStatus; p_name: string; p_comment?: string | null };
        Returns: ApprovalStatus;
      };
    };
    Enums: {
      org_role: OrgRole;
      pattern_origin: PatternOrigin;
      approval_status: ApprovalStatus;
      product_status: ProductStatus;
      document_type: DocumentType;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
