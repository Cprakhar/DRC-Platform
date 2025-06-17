export interface Disaster {
  id: string;
  title: string;
  location_name: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  audit_trail: Array<{
    action: string;
    user_id: string;
    timestamp: string;
  }>;
}

// In-memory mock DB for disasters
export const disasters: Disaster[] = [];
