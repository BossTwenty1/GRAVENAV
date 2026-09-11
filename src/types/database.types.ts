export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_reference: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          occurred_at: string
        }
        Insert: {
          action: string
          actor_reference?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_reference?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          occurred_at?: string
        }
        Relationships: []
      }
      cemetery_areas: {
        Row: {
          cemetery_site_id: string
          code: string | null
          created_at: string
          geometry: unknown
          id: string
          is_active: boolean
          is_synthetic: boolean
          name: string
          source_code: string | null
          source_label: string | null
          updated_at: string
        }
        Insert: {
          cemetery_site_id: string
          code?: string | null
          created_at?: string
          geometry?: unknown
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name: string
          source_code?: string | null
          source_label?: string | null
          updated_at?: string
        }
        Update: {
          cemetery_site_id?: string
          code?: string | null
          created_at?: string
          geometry?: unknown
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name?: string
          source_code?: string | null
          source_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cemetery_areas_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cemetery_sites: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_synthetic: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coordinate_collection_sessions: {
        Row: {
          collector_reference: string | null
          created_at: string
          device_label: string | null
          ended_at: string | null
          id: string
          is_synthetic: boolean
          method: string | null
          notes: string | null
          session_identifier: string
          started_at: string | null
          updated_at: string
        }
        Insert: {
          collector_reference?: string | null
          created_at?: string
          device_label?: string | null
          ended_at?: string | null
          id?: string
          is_synthetic?: boolean
          method?: string | null
          notes?: string | null
          session_identifier: string
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          collector_reference?: string | null
          created_at?: string
          device_label?: string | null
          ended_at?: string | null
          id?: string
          is_synthetic?: boolean
          method?: string | null
          notes?: string | null
          session_identifier?: string
          started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coordinate_observations: {
        Row: {
          capture_method: string
          captured_at: string
          collection_session_id: string | null
          collector_reference: string | null
          created_at: string
          device_label: string | null
          horizontal_accuracy_meters: number | null
          id: string
          is_synthetic: boolean
          latitude: number
          longitude: number
          map_control_point_id: string | null
          notes: string | null
          plot_id: string | null
          position: unknown
          updated_at: string
        }
        Insert: {
          capture_method: string
          captured_at: string
          collection_session_id?: string | null
          collector_reference?: string | null
          created_at?: string
          device_label?: string | null
          horizontal_accuracy_meters?: number | null
          id?: string
          is_synthetic?: boolean
          latitude: number
          longitude: number
          map_control_point_id?: string | null
          notes?: string | null
          plot_id?: string | null
          position?: unknown
          updated_at?: string
        }
        Update: {
          capture_method?: string
          captured_at?: string
          collection_session_id?: string | null
          collector_reference?: string | null
          created_at?: string
          device_label?: string | null
          horizontal_accuracy_meters?: number | null
          id?: string
          is_synthetic?: boolean
          latitude?: number
          longitude?: number
          map_control_point_id?: string | null
          notes?: string | null
          plot_id?: string | null
          position?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordinate_observations_collection_session_id_fkey"
            columns: ["collection_session_id"]
            isOneToOne: false
            referencedRelation: "coordinate_collection_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordinate_observations_map_control_point_id_fkey"
            columns: ["map_control_point_id"]
            isOneToOne: false
            referencedRelation: "map_control_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordinate_observations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_occupancy"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "coordinate_observations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinate_verifications: {
        Row: {
          created_at: string
          gravesite_coordinate_id: string
          id: string
          is_synthetic: boolean
          notes: string | null
          result: Database["public"]["Enums"]["verification_result"]
          reviewer_reference: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          gravesite_coordinate_id: string
          id?: string
          is_synthetic?: boolean
          notes?: string | null
          result: Database["public"]["Enums"]["verification_result"]
          reviewer_reference?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          gravesite_coordinate_id?: string
          id?: string
          is_synthetic?: boolean
          notes?: string | null
          result?: Database["public"]["Enums"]["verification_result"]
          reviewer_reference?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coordinate_verifications_gravesite_coordinate_id_fkey"
            columns: ["gravesite_coordinate_id"]
            isOneToOne: false
            referencedRelation: "gravesite_coordinates"
            referencedColumns: ["id"]
          },
        ]
      }
      deceased_persons: {
        Row: {
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          display_name: string | null
          family_name: string | null
          given_name: string | null
          id: string
          is_synthetic: boolean
          middle_name: string | null
          normalized_search_name: string | null
          source_display_name: string | null
          state: Database["public"]["Enums"]["record_state"]
          suffix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          display_name?: string | null
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_synthetic?: boolean
          middle_name?: string | null
          normalized_search_name?: string | null
          source_display_name?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          suffix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          display_name?: string | null
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_synthetic?: boolean
          middle_name?: string | null
          normalized_search_name?: string | null
          source_display_name?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          suffix?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gravesite_coordinates: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          is_synthetic: boolean
          latitude: number
          longitude: number
          notes: string | null
          plot_id: string
          position: unknown
          recorded_at: string
          source_observation_id: string | null
          status: Database["public"]["Enums"]["coordinate_status"]
          superseded_at: string | null
          supersedes_coordinate_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_synthetic?: boolean
          latitude: number
          longitude: number
          notes?: string | null
          plot_id: string
          position?: unknown
          recorded_at?: string
          source_observation_id?: string | null
          status?: Database["public"]["Enums"]["coordinate_status"]
          superseded_at?: string | null
          supersedes_coordinate_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_synthetic?: boolean
          latitude?: number
          longitude?: number
          notes?: string | null
          plot_id?: string
          position?: unknown
          recorded_at?: string
          source_observation_id?: string | null
          status?: Database["public"]["Enums"]["coordinate_status"]
          superseded_at?: string | null
          supersedes_coordinate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravesite_coordinates_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_occupancy"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "gravesite_coordinates_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravesite_coordinates_source_observation_id_fkey"
            columns: ["source_observation_id"]
            isOneToOne: false
            referencedRelation: "coordinate_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravesite_coordinates_supersedes_coordinate_id_fkey"
            columns: ["supersedes_coordinate_id"]
            isOneToOne: false
            referencedRelation: "gravesite_coordinates"
            referencedColumns: ["id"]
          },
        ]
      }
      gravesite_photos: {
        Row: {
          caption: string | null
          created_at: string
          description: string | null
          id: string
          interment_id: string | null
          is_publicly_visible: boolean
          is_synthetic: boolean
          plot_id: string | null
          state: Database["public"]["Enums"]["record_state"]
          storage_bucket: string
          storage_object_path: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interment_id?: string | null
          is_publicly_visible?: boolean
          is_synthetic?: boolean
          plot_id?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          storage_bucket?: string
          storage_object_path: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interment_id?: string | null
          is_publicly_visible?: boolean
          is_synthetic?: boolean
          plot_id?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          storage_bucket?: string
          storage_object_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravesite_photos_interment_id_fkey"
            columns: ["interment_id"]
            isOneToOne: false
            referencedRelation: "interments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravesite_photos_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_occupancy"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "gravesite_photos_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          import_type: string
          notes: string | null
          records_imported: number | null
          records_rejected: number | null
          records_seen: number | null
          source_file_reference: string | null
          source_label: string
          source_sheet: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["import_batch_status"]
          updated_at: string
          validated_records: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          import_type: string
          notes?: string | null
          records_imported?: number | null
          records_rejected?: number | null
          records_seen?: number | null
          source_file_reference?: string | null
          source_label: string
          source_sheet?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_batch_status"]
          updated_at?: string
          validated_records?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          import_type?: string
          notes?: string | null
          records_imported?: number | null
          records_rejected?: number | null
          records_seen?: number | null
          source_file_reference?: string | null
          source_label?: string
          source_sheet?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_batch_status"]
          updated_at?: string
          validated_records?: Json
        }
        Relationships: []
      }
      import_issues: {
        Row: {
          created_at: string
          description: string
          field_name: string | null
          id: string
          import_batch_id: string
          issue_code: string
          raw_value: string | null
          resolution_status: Database["public"]["Enums"]["import_issue_status"]
          severity: Database["public"]["Enums"]["import_issue_severity"]
          source_row_reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          field_name?: string | null
          id?: string
          import_batch_id: string
          issue_code: string
          raw_value?: string | null
          resolution_status?: Database["public"]["Enums"]["import_issue_status"]
          severity: Database["public"]["Enums"]["import_issue_severity"]
          source_row_reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          field_name?: string | null
          id?: string
          import_batch_id?: string
          issue_code?: string
          raw_value?: string | null
          resolution_status?: Database["public"]["Enums"]["import_issue_status"]
          severity?: Database["public"]["Enums"]["import_issue_severity"]
          source_row_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_issues_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      interments: {
        Row: {
          created_at: string
          deceased_person_id: string
          id: string
          import_batch_id: string | null
          interment_date: string | null
          interment_type: string | null
          is_publicly_visible: boolean
          is_synthetic: boolean
          notes: string | null
          permanence_status: string | null
          plot_id: string
          position_sequence: number | null
          source_reference: string | null
          state: Database["public"]["Enums"]["record_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deceased_person_id: string
          id?: string
          import_batch_id?: string | null
          interment_date?: string | null
          interment_type?: string | null
          is_publicly_visible?: boolean
          is_synthetic?: boolean
          notes?: string | null
          permanence_status?: string | null
          plot_id: string
          position_sequence?: number | null
          source_reference?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deceased_person_id?: string
          id?: string
          import_batch_id?: string | null
          interment_date?: string | null
          interment_type?: string | null
          is_publicly_visible?: boolean
          is_synthetic?: boolean
          notes?: string | null
          permanence_status?: string | null
          plot_id?: string
          position_sequence?: number | null
          source_reference?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interments_deceased_person_id_fkey"
            columns: ["deceased_person_id"]
            isOneToOne: false
            referencedRelation: "deceased_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interments_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interments_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plot_occupancy"
            referencedColumns: ["plot_id"]
          },
          {
            foreignKeyName: "interments_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      map_control_points: {
        Row: {
          cemetery_site_id: string
          control_point_label: string
          coordinate_status: Database["public"]["Enums"]["coordinate_status"]
          created_at: string
          id: string
          is_synthetic: boolean
          latitude: number | null
          longitude: number | null
          notes: string | null
          physical_feature_description: string | null
          position: unknown
          source_plan_reference: string | null
          updated_at: string
        }
        Insert: {
          cemetery_site_id: string
          control_point_label: string
          coordinate_status?: Database["public"]["Enums"]["coordinate_status"]
          created_at?: string
          id?: string
          is_synthetic?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          physical_feature_description?: string | null
          position?: unknown
          source_plan_reference?: string | null
          updated_at?: string
        }
        Update: {
          cemetery_site_id?: string
          control_point_label?: string
          coordinate_status?: Database["public"]["Enums"]["coordinate_status"]
          created_at?: string
          id?: string
          is_synthetic?: boolean
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          physical_feature_description?: string | null
          position?: unknown
          source_plan_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_control_points_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      map_features: {
        Row: {
          cemetery_site_id: string
          created_at: string
          feature_type: string
          geometry: unknown
          id: string
          is_active: boolean
          is_synthetic: boolean
          label: string | null
          provenance_source_type: string | null
          source_reference: string | null
          status: Database["public"]["Enums"]["coordinate_status"]
          updated_at: string
        }
        Insert: {
          cemetery_site_id: string
          created_at?: string
          feature_type: string
          geometry?: unknown
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          label?: string | null
          provenance_source_type?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["coordinate_status"]
          updated_at?: string
        }
        Update: {
          cemetery_site_id?: string
          created_at?: string
          feature_type?: string
          geometry?: unknown
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          label?: string | null
          provenance_source_type?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["coordinate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_features_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_edges: {
        Row: {
          created_at: string
          distance_meters: number | null
          from_node_id: string
          id: string
          is_accessible: boolean | null
          is_active: boolean
          is_bidirectional: boolean
          is_synthetic: boolean
          path: unknown
          to_node_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          from_node_id: string
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean
          is_bidirectional?: boolean
          is_synthetic?: boolean
          path?: unknown
          to_node_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          from_node_id?: string
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean
          is_bidirectional?: boolean
          is_synthetic?: boolean
          path?: unknown
          to_node_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_nodes: {
        Row: {
          cemetery_site_id: string
          created_at: string
          id: string
          is_accessible: boolean | null
          is_active: boolean
          is_synthetic: boolean
          node_type: string | null
          point: unknown
          updated_at: string
        }
        Insert: {
          cemetery_site_id: string
          created_at?: string
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean
          is_synthetic?: boolean
          node_type?: string | null
          point?: unknown
          updated_at?: string
        }
        Update: {
          cemetery_site_id?: string
          created_at?: string
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean
          is_synthetic?: boolean
          node_type?: string | null
          point?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_nodes_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_synthetic: boolean
          name: string
          regular_interment_capacity: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name: string
          regular_interment_capacity?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_synthetic?: boolean
          name?: string
          regular_interment_capacity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      plots: {
        Row: {
          cemetery_area_id: string | null
          cemetery_site_id: string
          created_at: string
          geometry: unknown
          id: string
          is_synthetic: boolean
          navigation_access_node_id: string | null
          normalized_lot_key: string
          normalized_plot_identifier: string
          plot_type_id: string | null
          raw_lot_location: string | null
          sector_id: string | null
          source_commercial_status: string | null
          state: Database["public"]["Enums"]["record_state"]
          unresolved_source_classification: string | null
          updated_at: string
        }
        Insert: {
          cemetery_area_id?: string | null
          cemetery_site_id: string
          created_at?: string
          geometry?: unknown
          id?: string
          is_synthetic?: boolean
          navigation_access_node_id?: string | null
          normalized_lot_key: string
          normalized_plot_identifier: string
          plot_type_id?: string | null
          raw_lot_location?: string | null
          sector_id?: string | null
          source_commercial_status?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          unresolved_source_classification?: string | null
          updated_at?: string
        }
        Update: {
          cemetery_area_id?: string | null
          cemetery_site_id?: string
          created_at?: string
          geometry?: unknown
          id?: string
          is_synthetic?: boolean
          navigation_access_node_id?: string | null
          normalized_lot_key?: string
          normalized_plot_identifier?: string
          plot_type_id?: string | null
          raw_lot_location?: string | null
          sector_id?: string | null
          source_commercial_status?: string | null
          state?: Database["public"]["Enums"]["record_state"]
          unresolved_source_classification?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_cemetery_area_id_fkey"
            columns: ["cemetery_area_id"]
            isOneToOne: false
            referencedRelation: "cemetery_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_navigation_access_node_id_cemetery_site_id_fkey"
            columns: ["navigation_access_node_id", "cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id", "cemetery_site_id"]
          },
          {
            foreignKeyName: "plots_plot_type_id_fkey"
            columns: ["plot_type_id"]
            isOneToOne: false
            referencedRelation: "plot_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          cemetery_area_id: string
          created_at: string
          geometry: unknown
          id: string
          identifier: string
          is_active: boolean
          is_synthetic: boolean
          name: string | null
          source_identifier: string | null
          updated_at: string
        }
        Insert: {
          cemetery_area_id: string
          created_at?: string
          geometry?: unknown
          id?: string
          identifier: string
          is_active?: boolean
          is_synthetic?: boolean
          name?: string | null
          source_identifier?: string | null
          updated_at?: string
        }
        Update: {
          cemetery_area_id?: string
          created_at?: string
          geometry?: unknown
          id?: string
          identifier?: string
          is_active?: boolean
          is_synthetic?: boolean
          name?: string | null
          source_identifier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_cemetery_area_id_fkey"
            columns: ["cemetery_area_id"]
            isOneToOne: false
            referencedRelation: "cemetery_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          application_role: string
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          application_role: string
          created_at?: string
          display_name?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          application_role?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      plot_occupancy: {
        Row: {
          active_interment_count: number | null
          cemetery_site_id: string | null
          derived_occupancy_status: string | null
          normalized_plot_identifier: string | null
          plot_id: string | null
          source_commercial_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_cemetery_site_id_fkey"
            columns: ["cemetery_site_id"]
            isOneToOne: false
            referencedRelation: "cemetery_sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      normalize_person_name: {
        Args: {
          p_family_name: string
          p_given_name: string
          p_middle_name: string
          p_suffix: string
        }
        Returns: string
      }
      persist_import_plan: {
        Args: {
          p_adapter: string
          p_label: string
          p_records: Json
          p_sheet: string
          p_site_id: string
          p_synthetic?: boolean
        }
        Returns: string
      }
      person_display_name: {
        Args: {
          p_family_name: string
          p_given_name: string
          p_middle_name: string
          p_suffix: string
        }
        Returns: string
      }
    }
    Enums: {
      coordinate_status:
        | "recorded"
        | "pending_verification"
        | "verified"
        | "rejected"
      import_batch_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      import_issue_severity: "info" | "warning" | "error"
      import_issue_status: "open" | "resolved" | "ignored"
      record_state: "active" | "archived"
      verification_result: "pending" | "verified" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      coordinate_status: [
        "recorded",
        "pending_verification",
        "verified",
        "rejected",
      ],
      import_batch_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      import_issue_severity: ["info", "warning", "error"],
      import_issue_status: ["open", "resolved", "ignored"],
      record_state: ["active", "archived"],
      verification_result: ["pending", "verified", "rejected"],
    },
  },
} as const
