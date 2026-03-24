export interface Log {
  id?: number;
  user_id?: string;
  user_name?: string;
  action_type: string;
  details?: string;
  created_at?: string;
}
