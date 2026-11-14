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
    };
    Enums: { org_role: OrgRole; pattern_origin: PatternOrigin };
    CompositeTypes: { [_ in never]: never };
  };
};
