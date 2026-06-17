-- Create users table for registration and password reset
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (for simple app)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Insert default admin user
INSERT INTO public.users (username, password) 
VALUES ('NEST', 'sardar123')
ON CONFLICT (username) DO NOTHING;
