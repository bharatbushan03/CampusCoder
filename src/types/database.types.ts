export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
      };
    };
  };
}
