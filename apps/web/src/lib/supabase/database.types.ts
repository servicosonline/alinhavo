/**
 * Tipos do banco, no formato do `supabase gen types typescript`.
 *
 * PROVISÓRIO: escrito à mão a partir de supabase/migrations/ enquanto não há
 * projeto Supabase para gerar. Assim que houver, substitua por:
 *   npx supabase gen types typescript --project-id <id> > apps/web/src/lib/supabase/database.types.ts
 * Até lá, toda migração nova precisa atualizar este arquivo.
 */

type OrgRole = "owner" | "admin" | "modelista" | "estilista" | "leitura";

type OrgRow = {
  id: string;
  name: string;
  plan: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type OrgMemberRow = {
  org_id: string;
  user_id: string;
  role: OrgRole;
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
  created_at: string;
  updated_at: string;
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type PatternOrigin = "editor" | "prova" | "scan" | "importacao";

type Timestamps = { created_at: string; updated_at: string };
type ClientRow = { id: string; org_id: string; name: string } & Timestamps;
type SizeChartRow = { id: string; org_id: string; client_id: string | null; name: string } & Timestamps;
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
type AiGenerationRow = {
  id: string;
  org_id: string;
  product_id: string;
  kind: "textos_produto";
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

export type FabricPreset = "malha" | "planoLeve" | "jeans";
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
} & Timestamps;
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
        Update: { name?: string };
        Relationships: [];
      };
      org_members: {
        Row: OrgMemberRow;
        Insert: never;
        Update: { role?: OrgRole };
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
        Insert: { org_id: string; email: string; role: OrgRole; created_by?: string; expires_at?: string };
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
        Insert: { org_id: string; name: string; client_id?: string | null };
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
        };
        Update: {
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
        };
        Update: {
          name?: string;
          composition?: string | null;
          width_mm?: number | null;
          weight_gsm?: number | null;
          price_cents?: number | null;
          preset?: FabricPreset | null;
        };
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
      reserve_ai_generation: { Args: { p_product_id: string; p_kind?: string }; Returns: string };
      finish_ai_generation: {
        Args: { p_id: string; p_ok: boolean; p_model?: string | null; p_input_tokens?: number | null; p_output_tokens?: number | null };
        Returns: undefined;
      };
      ai_generations_this_month: { Args: { p_org_id: string }; Returns: number };
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
    Enums: { org_role: OrgRole; pattern_origin: PatternOrigin; approval_status: ApprovalStatus; product_status: ProductStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
