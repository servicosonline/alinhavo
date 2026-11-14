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
    };
    Views: { [_ in never]: never };
    Functions: {
      create_org: { Args: { p_name: string }; Returns: OrgRow };
      accept_invite: { Args: { p_token: string }; Returns: OrgMemberRow };
      org_team: {
        Args: { p_org_id: string };
        Returns: { user_id: string; email: string; role: OrgRole; joined_at: string }[];
      };
    };
    Enums: { org_role: OrgRole };
    CompositeTypes: { [_ in never]: never };
  };
};
