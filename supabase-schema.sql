-- Create dumps table for storing brain dump sessions
CREATE TABLE IF NOT EXISTS dumps (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  categories JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT,
  reflection_insight TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_dumps_user_id ON dumps(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_dumps_created_at ON dumps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dumps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own dumps
CREATE POLICY "Users can read their own dumps"
  ON dumps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own dumps
CREATE POLICY "Users can insert their own dumps"
  ON dumps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own dumps
CREATE POLICY "Users can update their own dumps"
  ON dumps
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own dumps
CREATE POLICY "Users can delete their own dumps"
  ON dumps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on update
CREATE TRIGGER update_dumps_updated_at
  BEFORE UPDATE ON dumps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (auth.uid() = user_id);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  description TEXT,
  task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lists" ON lists FOR ALL USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- Create time_sessions table for productivity tracking
CREATE TABLE IF NOT EXISTS time_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL DEFAULT 0,
  paused_duration INTEGER DEFAULT 0,
  session_type TEXT NOT NULL CHECK (session_type IN ('pomodoro', 'manual', 'auto'))
);

CREATE INDEX IF NOT EXISTS idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_task_id ON time_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_started_at ON time_sessions(started_at DESC);

ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own time sessions" ON time_sessions FOR ALL USING (auth.uid() = user_id);

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL DEFAULT 1500,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'shortBreak', 'longBreak')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  interrupted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON pomodoro_sessions(started_at DESC);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pomodoro sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);

-- Create productivity_stats table for daily aggregates
CREATE TABLE IF NOT EXISTS productivity_stats (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time_spent INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  pomodoros_completed INTEGER NOT NULL DEFAULT 0,
  focus_score INTEGER NOT NULL DEFAULT 0,
  most_productive_hour INTEGER,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_productivity_stats_user_id ON productivity_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_stats_date ON productivity_stats(date DESC);

ALTER TABLE productivity_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own productivity stats" ON productivity_stats FOR ALL USING (auth.uid() = user_id);
