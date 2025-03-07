/*
  # Initial Schema Setup for Task Manager

  1. New Tables
    - `profiles` - User profile information
    - `tasks` - Main tasks table with all task information
    - `categories` - Task categories
    - `attachments` - Files attached to tasks
    - `task_collaborators` - Junction table for task sharing

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'archived')) DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create task collaborators table
CREATE TABLE IF NOT EXISTS task_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'edit', 'admin')) DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (task_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM task_collaborators 
      WHERE task_collaborators.task_id = tasks.id 
      AND task_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM task_collaborators 
      WHERE task_collaborators.task_id = tasks.id 
      AND task_collaborators.user_id = auth.uid()
      AND task_collaborators.permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM task_collaborators 
      WHERE task_collaborators.task_id = tasks.id 
      AND task_collaborators.user_id = auth.uid()
      AND task_collaborators.permission = 'admin'
    )
  );

-- Attachments policies
CREATE POLICY "Users can view task attachments"
  ON attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND (
        tasks.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM task_collaborators
          WHERE task_collaborators.task_id = tasks.id
          AND task_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create task attachments"
  ON attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND (
        tasks.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM task_collaborators
          WHERE task_collaborators.task_id = tasks.id
          AND task_collaborators.user_id = auth.uid()
          AND task_collaborators.permission IN ('edit', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can delete task attachments"
  ON attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND (
        tasks.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM task_collaborators
          WHERE task_collaborators.task_id = tasks.id
          AND task_collaborators.user_id = auth.uid()
          AND task_collaborators.permission IN ('edit', 'admin')
        )
      )
    )
  );

-- Task collaborators policies
CREATE POLICY "Users can view task collaborators"
  ON task_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_collaborators.task_id
      AND (tasks.user_id = auth.uid() OR task_collaborators.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add task collaborators"
  ON task_collaborators
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_collaborators.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update task collaborators"
  ON task_collaborators
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_collaborators.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task collaborators"
  ON task_collaborators
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_collaborators.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color)
  VALUES 
    (NEW.id, 'Work', '#3B82F6'),
    (NEW.id, 'Personal', '#10B981'),
    (NEW.id, 'Health', '#EF4444'),
    (NEW.id, 'Finance', '#F59E0B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE create_default_categories();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();