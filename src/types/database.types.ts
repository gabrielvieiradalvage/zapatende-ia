// =============================================================
//  ZapAtende AI — Tipos do banco de dados
//  Gerado manualmente — substitua pelo output do Supabase CLI:
//  npm run db:types
// =============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          full_name:  string | null
          avatar_url: string | null
          role:       'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id:         string
          full_name?: string | null
          avatar_url?: string | null
          role?:      'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?:      'owner' | 'admin' | 'member'
          updated_at?: string
        }
      }

      plans: {
        Row: {
          id:                string
          name:              string
          stripe_price_id:   string | null
          monthly_messages:  number
          price_brl:         number
          features:          Json
          is_active:         boolean
          sort_order:        number
          created_at:        string
        }
        Insert: {
          id?:               string
          name:              string
          stripe_price_id?:  string | null
          monthly_messages?: number
          price_brl:         number
          features?:         Json
          is_active?:        boolean
          sort_order?:       number
          created_at?:       string
        }
        Update: {
          name?:             string
          stripe_price_id?:  string | null
          monthly_messages?: number
          price_brl?:        number
          features?:         Json
          is_active?:        boolean
          sort_order?:       number
        }
      }

      organizations: {
        Row: {
          id:                   string
          owner_id:             string
          name:                 string
          slug:                 string
          whatsapp_number:      string | null
          whatsapp_instance:    string | null
          business_description: string | null
          ai_persona:           string
          welcome_message:      string | null
          away_message:         string | null
          working_hours:        Json | null
          timezone:             string
          is_active:            boolean
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                   string
          owner_id:              string
          name:                  string
          slug:                  string
          whatsapp_number?:      string | null
          whatsapp_instance?:    string | null
          business_description?: string | null
          ai_persona?:           string
          welcome_message?:      string | null
          away_message?:         string | null
          working_hours?:        Json | null
          timezone?:             string
          is_active?:            boolean
          created_at?:           string
          updated_at?:           string
        }
        Update: {
          name?:                 string
          slug?:                 string
          whatsapp_number?:      string | null
          whatsapp_instance?:    string | null
          business_description?: string | null
          ai_persona?:           string
          welcome_message?:      string | null
          away_message?:         string | null
          working_hours?:        Json | null
          timezone?:             string
          is_active?:            boolean
          updated_at?:           string
        }
      }

      subscriptions: {
        Row: {
          id:                     string
          organization_id:        string
          plan_id:                string
          stripe_subscription_id: string | null
          stripe_customer_id:     string | null
          status:                 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start:   string | null
          current_period_end:     string | null
          cancel_at_period_end:   boolean
          messages_used:          number
          created_at:             string
          updated_at:             string
        }
        Insert: {
          id?:                     string
          organization_id:         string
          plan_id:                 string
          stripe_subscription_id?: string | null
          stripe_customer_id?:     string | null
          status?:                 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?:   string | null
          current_period_end?:     string | null
          cancel_at_period_end?:   boolean
          messages_used?:          number
          created_at?:             string
          updated_at?:             string
        }
        Update: {
          plan_id?:                string
          stripe_subscription_id?: string | null
          stripe_customer_id?:     string | null
          status?:                 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?:   string | null
          current_period_end?:     string | null
          cancel_at_period_end?:   boolean
          messages_used?:          number
          updated_at?:             string
        }
      }

      knowledge_base: {
        Row: {
          id:              string
          organization_id: string
          question:        string
          answer:          string
          category:        string | null
          embedding:       number[] | null
          usage_count:     number
          is_active:       boolean
          created_at:      string
          updated_at:      string
        }
        Insert: {
          id?:              string
          organization_id:  string
          question:         string
          answer:           string
          category?:        string | null
          embedding?:       number[] | null
          usage_count?:     number
          is_active?:       boolean
          created_at?:      string
          updated_at?:      string
        }
        Update: {
          question?:        string
          answer?:          string
          category?:        string | null
          embedding?:       number[] | null
          usage_count?:     number
          is_active?:       boolean
          updated_at?:      string
        }
      }

      conversations: {
        Row: {
          id:              string
          organization_id: string
          contact_phone:   string
          contact_name:    string | null
          status:          'open' | 'resolved' | 'waiting'
          message_count:   number
          last_message_at: string | null
          metadata:        Json | null
          created_at:      string
          updated_at:      string
        }
        Insert: {
          id?:              string
          organization_id:  string
          contact_phone:    string
          contact_name?:    string | null
          status?:          'open' | 'resolved' | 'waiting'
          message_count?:   number
          last_message_at?: string | null
          metadata?:        Json | null
          created_at?:      string
          updated_at?:      string
        }
        Update: {
          contact_name?:    string | null
          status?:          'open' | 'resolved' | 'waiting'
          message_count?:   number
          last_message_at?: string | null
          metadata?:        Json | null
          updated_at?:      string
        }
      }

      messages: {
        Row: {
          id:                   string
          conversation_id:      string
          role:                 'user' | 'assistant' | 'system'
          content:              string
          whatsapp_message_id:  string | null
          was_ai_response:      boolean
          knowledge_base_id:    string | null
          ai_confidence:        number | null
          created_at:           string
        }
        Insert: {
          id?:                   string
          conversation_id:       string
          role:                  'user' | 'assistant' | 'system'
          content:               string
          whatsapp_message_id?:  string | null
          was_ai_response?:      boolean
          knowledge_base_id?:    string | null
          ai_confidence?:        number | null
          created_at?:           string
        }
        Update: {
          whatsapp_message_id?:  string | null
          knowledge_base_id?:    string | null
          ai_confidence?:        number | null
        }
      }

      usage_logs: {
        Row: {
          id:              string
          organization_id: string
          message_id:      string | null
          tokens_input:    number
          tokens_output:   number
          tokens_total:    number
          model:           string
          cost_usd:        number | null
          created_at:      string
        }
        Insert: {
          id?:              string
          organization_id:  string
          message_id?:      string | null
          tokens_input?:    number
          tokens_output?:   number
          tokens_total?:    number
          model?:           string
          cost_usd?:        number | null
          created_at?:      string
        }
        Update: {
          cost_usd?: number | null
        }
      }
    }

    Functions: {
      match_knowledge_base: {
        Args: {
          p_organization_id: string
          p_embedding:       number[]
          p_match_threshold?: number
          p_match_count?:    number
        }
        Returns: Array<{
          id:         string
          question:   string
          answer:     string
          category:   string | null
          similarity: number
        }>
      }
    }

    Enums: {
      user_role:           'owner' | 'admin' | 'member'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
      conversation_status: 'open' | 'resolved' | 'waiting'
      message_role:        'user' | 'assistant' | 'system'
    }
  }
}

// Atalhos de tipo para uso nos componentes e server actions
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Tipos concretos das tabelas
export type Profile      = Tables<'profiles'>
export type Plan         = Tables<'plans'>
export type Organization = Tables<'organizations'>
export type Subscription = Tables<'subscriptions'>
export type KnowledgeBase = Tables<'knowledge_base'>
export type Conversation = Tables<'conversations'>
export type Message      = Tables<'messages'>
export type UsageLog     = Tables<'usage_logs'>

// Tipos de retorno da função RPC
export type KnowledgeMatch = Database['public']['Functions']['match_knowledge_base']['Returns'][number]
