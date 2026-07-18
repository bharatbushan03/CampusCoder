export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: 'student' | 'admin' | 'organizer';
          college: string | null;
          branch: string | null;
          year: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'student' | 'admin' | 'organizer';
          college?: string | null;
          branch?: string | null;
          year?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'student' | 'admin' | 'organizer';
          college?: string | null;
          branch?: string | null;
          year?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string | null;
          full_description: string | null;
          event_type: 'workshop' | 'coding_session' | 'orientation' | 'challenge' | 'webinar';
          mode: 'online' | 'offline' | 'hybrid';
          date: string;
          start_time: string;
          end_time: string;
          meeting_link: string | null;
          registration_deadline: string | null;
          banner_url: string | null;
          status: 'draft' | 'published' | 'completed' | 'cancelled';
          meeting_link_sent_at: string | null;
          summary: string | null;
          recording_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description?: string | null;
          full_description?: string | null;
          event_type?: 'workshop' | 'coding_session' | 'orientation' | 'challenge' | 'webinar';
          mode?: 'online' | 'offline' | 'hybrid';
          date: string;
          start_time: string;
          end_time: string;
          meeting_link?: string | null;
          registration_deadline?: string | null;
          banner_url?: string | null;
          status?: 'draft' | 'published' | 'completed' | 'cancelled';
          meeting_link_sent_at?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string | null;
          full_description?: string | null;
          event_type?: 'workshop' | 'coding_session' | 'orientation' | 'challenge' | 'webinar';
          mode?: 'online' | 'offline' | 'hybrid';
          date?: string;
          start_time?: string;
          end_time?: string;
          meeting_link?: string | null;
          registration_deadline?: string | null;
          banner_url?: string | null;
          status?: 'draft' | 'published' | 'completed' | 'cancelled';
          meeting_link_sent_at?: string | null;
          summary?: string | null;
          recording_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          link: string;
          category: string;
          event_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          link: string;
          category: string;
          event_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          link?: string;
          category?: string;
          event_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      event_owners: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          role: string | null;
          email: string | null;
          bio: string | null;
          profile_image_url: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          role?: string | null;
          email?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          role?: string | null;
          email?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          college: string | null;
          branch: string | null;
          year: string | null;
          coding_level: string | null;
          preferred_language: string | null;
          reason_to_join: string | null;
          registered_at: string;
          attendance_status: 'registered' | 'attended' | 'absent';
        };
        Insert: {
          id?: string;
          event_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          college?: string | null;
          branch?: string | null;
          year?: string | null;
          coding_level?: string | null;
          preferred_language?: string | null;
          reason_to_join?: string | null;
          registered_at?: string;
          attendance_status?: 'registered' | 'attended' | 'absent';
        };
        Update: {
          id?: string;
          event_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          college?: string | null;
          branch?: string | null;
          year?: string | null;
          coding_level?: string | null;
          preferred_language?: string | null;
          reason_to_join?: string | null;
          registered_at?: string;
          attendance_status?: 'registered' | 'attended' | 'absent';
        };
        Relationships: [];
      };
      community_links: {
        Row: {
          id: string;
          platform: string;
          url: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          platform: string;
          url: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          platform?: string;
          url?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          event_id: string | null;
          is_active: boolean;
          publish_date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          event_id?: string | null;
          is_active?: boolean;
          publish_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          event_id?: string | null;
          is_active?: boolean;
          publish_date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          last_attempt: string;
        };
        Insert: {
          key: string;
          last_attempt?: string;
        };
        Update: {
          key?: string;
          last_attempt?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};