-- Create sessions table for grammY session storage
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR PRIMARY KEY NOT NULL,
  session TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS sessions_id_idx ON sessions (id);
