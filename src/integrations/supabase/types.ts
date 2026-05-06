export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_stats: {
        Row: {
          ad_id: string
          created_at: string
          date: string
          favorites: number
          id: string
          inquiries: number
          unique_views: number
          updated_at: string
          views: number
        }
        Insert: {
          ad_id: string
          created_at?: string
          date: string
          favorites?: number
          id?: string
          inquiries?: number
          unique_views?: number
          updated_at?: string
          views?: number
        }
        Update: {
          ad_id?: string
          created_at?: string
          date?: string
          favorites?: number
          id?: string
          inquiries?: number
          unique_views?: number
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      ad_videos: {
        Row: {
          ad_id: string
          created_at: string
          duration_seconds: number | null
          error: string | null
          id: string
          size_bytes: number | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          id?: string
          size_bytes?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          id?: string
          size_bytes?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      ad_views: {
        Row: {
          ad_id: string
          created_at: string
          device: string | null
          governorate: string | null
          id: string
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          device?: string | null
          governorate?: string | null
          id?: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          device?: string | null
          governorate?: string | null
          id?: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          boost_package_id: number | null
          boosted_until: string | null
          category_id: number | null
          city: string | null
          condition: Database["public"]["Enums"]["ad_condition"]
          created_at: string
          deleted_at: string | null
          description: string
          embedding: string | null
          embedding_updated_at: string | null
          governorate: string
          id: string
          images_json: Json
          is_boosted: boolean
          latitude: number | null
          longitude: number | null
          moderated_at: string | null
          moderated_by: string | null
          price: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["ad_status"]
          subcategory: string | null
          title: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          boost_package_id?: number | null
          boosted_until?: string | null
          category_id?: number | null
          city?: string | null
          condition?: Database["public"]["Enums"]["ad_condition"]
          created_at?: string
          deleted_at?: string | null
          description: string
          embedding?: string | null
          embedding_updated_at?: string | null
          governorate: string
          id?: string
          images_json?: Json
          is_boosted?: boolean
          latitude?: number | null
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          subcategory?: string | null
          title: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          boost_package_id?: number | null
          boosted_until?: string | null
          category_id?: number | null
          city?: string | null
          condition?: Database["public"]["Enums"]["ad_condition"]
          created_at?: string
          deleted_at?: string | null
          description?: string
          embedding?: string | null
          embedding_updated_at?: string | null
          governorate?: string
          id?: string
          images_json?: Json
          is_boosted?: boolean
          latitude?: number | null
          longitude?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          subcategory?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "ads_boost_package_id_fkey"
            columns: ["boost_package_id"]
            isOneToOne: false
            referencedRelation: "boost_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_log: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          color: string | null
          condition_type: string | null
          condition_value: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: number
          min_points: number
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          min_points?: number
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          min_points?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          clicks: number
          created_at: string
          end_date: string | null
          id: number
          image: string
          is_active: boolean
          link: string | null
          position: string
          sort_order: number
          start_date: string | null
          title: string
          views: number
        }
        Insert: {
          clicks?: number
          created_at?: string
          end_date?: string | null
          id?: number
          image: string
          is_active?: boolean
          link?: string | null
          position?: string
          sort_order?: number
          start_date?: string | null
          title: string
          views?: number
        }
        Update: {
          clicks?: number
          created_at?: string
          end_date?: string | null
          id?: number
          image?: string
          is_active?: boolean
          link?: string | null
          position?: string
          sort_order?: number
          start_date?: string | null
          title?: string
          views?: number
        }
        Relationships: []
      }
      boost_packages: {
        Row: {
          created_at: string
          days: number
          features_json: Json
          id: number
          is_active: boolean
          name: string
          price: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          days: number
          features_json?: Json
          id?: number
          is_active?: boolean
          name: string
          price?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          days?: number
          features_json?: Json
          id?: number
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      boost_transactions: {
        Row: {
          ad_id: string
          amount: number
          created_at: string
          end_date: string | null
          id: string
          is_free_trial: boolean
          package_id: number
          payment_id: string | null
          payment_method: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["boost_status"]
          user_id: string
        }
        Insert: {
          ad_id: string
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_free_trial?: boolean
          package_id: number
          payment_id?: string | null
          payment_method?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["boost_status"]
          user_id: string
        }
        Update: {
          ad_id?: string
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          is_free_trial?: boolean
          package_id?: number
          payment_id?: string | null
          payment_method?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["boost_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boost_transactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "boost_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          brand: string
          created_at: string
          id: number
          models_json: Json
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: number
          models_json?: Json
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: number
          models_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: number
          is_visible: boolean
          name: string
          name_ar: string | null
          slug: string
          sort_order: number
          subcategories_json: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: number
          is_visible?: boolean
          name: string
          name_ar?: string | null
          slug: string
          sort_order?: number
          subcategories_json?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: number
          is_visible?: boolean
          name?: string
          name_ar?: string | null
          slug?: string
          sort_order?: number
          subcategories_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      escrow_disputes: {
        Row: {
          created_at: string
          evidence_json: Json
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_json?: Json
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_json?: Json
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_messages_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          ad_id: string
          amount: number
          buyer_id: string
          cancelled_at: string | null
          commission: number
          commission_rate: number
          completed_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string | null
          refunded_at: string | null
          seller_id: string
          shipped_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
        }
        Insert: {
          ad_id: string
          amount: number
          buyer_id: string
          cancelled_at?: string | null
          commission?: number
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          refunded_at?: string | null
          seller_id: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Update: {
          ad_id?: string
          amount?: number
          buyer_id?: string
          cancelled_at?: string | null
          commission?: number
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          refunded_at?: string | null
          seller_id?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      governorates: {
        Row: {
          cities_json: Json
          created_at: string
          id: number
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          cities_json?: Json
          created_at?: string
          id?: number
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          cities_json?: Json
          created_at?: string
          id?: number
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          ad_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          ad_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          ad_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data_json: Json | null
          id: string
          is_read: boolean
          sent_at: string | null
          sent_via_json: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data_json?: Json | null
          id?: string
          is_read?: boolean
          sent_at?: string | null
          sent_via_json?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data_json?: Json | null
          id?: string
          is_read?: boolean
          sent_at?: string | null
          sent_via_json?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          governorate: string | null
          id: string
          is_active: boolean
          last_seen: string | null
          name: string | null
          notify_chat_enabled: boolean
          notify_listings_enabled: boolean
          notify_sound_muted: boolean
          phone: string | null
          phone_verified_at: string | null
          total_points: number
          updated_at: string
          verification_level: number
        }
        Insert: {
          avatar?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          governorate?: string | null
          id: string
          is_active?: boolean
          last_seen?: string | null
          name?: string | null
          notify_chat_enabled?: boolean
          notify_listings_enabled?: boolean
          notify_sound_muted?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          total_points?: number
          updated_at?: string
          verification_level?: number
        }
        Update: {
          avatar?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          governorate?: string | null
          id?: string
          is_active?: boolean
          last_seen?: string | null
          name?: string | null
          notify_chat_enabled?: boolean
          notify_listings_enabled?: boolean
          notify_sound_muted?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          total_points?: number
          updated_at?: string
          verification_level?: number
        }
        Relationships: []
      }
      ratings: {
        Row: {
          ad_id: string | null
          comment: string | null
          created_at: string
          id: string
          rated_id: string
          rater_id: string
          score: number
        }
        Insert: {
          ad_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rated_id: string
          rater_id: string
          score: number
        }
        Update: {
          ad_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rated_id?: string
          rater_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters_json: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters_json?: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters_json?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string
          id: string
          mode: string
          query: string
          results_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          query: string
          results_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          query?: string
          results_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      search_queue: {
        Row: {
          ad_id: string
          attempts: number
          created_at: string
          error: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          group_name: string
          id: number
          key: string
          type: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          group_name?: string
          id?: number
          key: string
          type?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: number
          key?: string
          type?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_appearance_settings: {
        Row: {
          created_at: string
          dark_mode: string
          density: string
          font_size: string
          high_contrast: boolean
          language: string
          layout_style: string
          reduced_motion: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode?: string
          density?: string
          font_size?: string
          high_contrast?: boolean
          language?: string
          layout_style?: string
          reduced_motion?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode?: string
          density?: string
          font_size?: string
          high_contrast?: boolean
          language?: string
          layout_style?: string
          reduced_motion?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: number
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: number
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: number
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          id: string
          level: number
          lifetime_points: number
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          lifetime_points?: number
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string
          documents_json: Json
          expires_at: string | null
          id: string
          level: number
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          documents_json?: Json
          expires_at?: string | null
          id?: string
          level: number
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          documents_json?: Json
          expires_at?: string | null
          id?: string
          level?: number
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_stats: {
        Args: {
          _ad_id: string
          _favorites?: number
          _inquiries?: number
          _unique_views?: number
          _views?: number
        }
        Returns: undefined
      }
      search_ads: {
        Args: {
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          category_id: number
          city: string
          created_at: string
          governorate: string
          id: string
          images_json: Json
          is_boosted: boolean
          price: number
          similarity: number
          title: string
          views: number
        }[]
      }
    }
    Enums: {
      ad_condition: "new" | "used" | "refurbished"
      ad_status:
        | "draft"
        | "pending"
        | "active"
        | "sold"
        | "expired"
        | "rejected"
        | "flagged"
      app_role: "admin" | "moderator" | "user"
      boost_status: "pending" | "active" | "expired" | "cancelled"
      escrow_status:
        | "pending"
        | "paid"
        | "shipped"
        | "completed"
        | "cancelled"
        | "disputed"
        | "refunded"
      message_status: "sent" | "delivered" | "read"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_condition: ["new", "used", "refurbished"],
      ad_status: [
        "draft",
        "pending",
        "active",
        "sold",
        "expired",
        "rejected",
        "flagged",
      ],
      app_role: ["admin", "moderator", "user"],
      boost_status: ["pending", "active", "expired", "cancelled"],
      escrow_status: [
        "pending",
        "paid",
        "shipped",
        "completed",
        "cancelled",
        "disputed",
        "refunded",
      ],
      message_status: ["sent", "delivered", "read"],
    },
  },
} as const
