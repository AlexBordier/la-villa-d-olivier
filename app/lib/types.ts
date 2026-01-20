export type User = {
  id: string;
  username: string;
  created_at: string;
};

export type House = {
  id: string;
  created_at: string;
  created_by: string;
  title: string;
  address: string;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  link: string | null;
  price: number | null;
  bedrooms: number | null;
  beds: number | null;
  distance_sea_min: number | null;
  has_pool: boolean;
  has_jacuzzi: boolean;
  has_bbq: boolean;
  has_big_kitchen: boolean;
  pros: string | null;
  cons: string | null;
  other_equip: string | null;
  details: string | null;
};

export type Vote = {
  id: string;
  house_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  app_users?: User;
};

export type HouseWithVotes = House & {
  votes: Vote[];
  avg_rating: number;
  vote_count: number;
};
