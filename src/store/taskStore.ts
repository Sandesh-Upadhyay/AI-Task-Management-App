import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  category_id: string | null;
  is_ai_generated: boolean;
  ai_metadata: any | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  
  // Joined data
  category?: {
    id: string;
    name: string;
    color: string;
  };
  attachments?: Attachment[];
  collaborators?: Collaborator[];
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  id: string;
  task_id: string;
  user_id: string;
  permission: 'view' | 'edit' | 'admin';
  created_at: string;
  profile?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface TaskState {
  tasks: Task[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  activeTaskId: string | null;
  filters: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    categoryId: string | 'all';
    searchQuery: string;
  };
  
  // Task actions
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  
  // Category actions
  fetchCategories: () => Promise<void>;
  createCategory: (category: Partial<Category>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Attachment actions
  uploadAttachment: (taskId: string, file: File) => Promise<Attachment | null>;
  deleteAttachment: (id: string) => Promise<void>;
  
  // Collaborator actions
  addCollaborator: (taskId: string, email: string, permission: 'view' | 'edit' | 'admin') => Promise<void>;
  updateCollaboratorPermission: (id: string, permission: 'view' | 'edit' | 'admin') => Promise<void>;
  removeCollaborator: (id: string) => Promise<void>;
  
  // AI actions
  generateAITasks: () => Promise<void>;
  prioritizeTasksWithAI: () => Promise<void>;
  
  // Filter actions
  setFilter: (filter: Partial<TaskState['filters']>) => void;
  resetFilters: () => void;
  
  // UI actions
  setActiveTask: (id: string | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  categories: [],
  isLoading: false,
  error: null,
  activeTaskId: null,
  filters: {
    status: 'all',
    priority: 'all',
    categoryId: 'all',
    searchQuery: '',
  },
  
  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { filters } = get();
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          attachments(*),
          collaborators:task_collaborators(
            *,
            profile:profiles(email, full_name, avatar_url)
          )
        `);
      
      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      } else {
        // By default, don't show archived tasks unless specifically filtered
        query = query.neq('status', 'archived');
      }
      
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId);
      }
      
      if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ tasks: data as Task[], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchTaskById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          attachments(*),
          collaborators:task_collaborators(
            *,
            profile:profiles(email, full_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ isLoading: false });
      return data as Task;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  createTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      await get().fetchTasks();
      
      set({ isLoading: false });
      return data[0] as Task;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  updateTask: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  deleteTask: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  completeTask: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      set({ categories: data as Category[], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  createCategory: async (category) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      await get().fetchCategories();
      
      set({ isLoading: false });
      return data[0] as Category;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  updateCategory: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchCategories();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  deleteCategory: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  uploadAttachment: async (taskId, file) => {
    try {
      set({ isLoading: true, error: null });
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `attachments/${taskId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Create attachment record
      const { data, error } = await supabase
        .from('attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      // Refresh task to get updated attachments
      await get().fetchTaskById(taskId);
      
      set({ isLoading: false });
      return data[0] as Attachment;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  deleteAttachment: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get attachment to find file path
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path]);
      
      if (storageError) throw storageError;
      
      // Delete attachment record
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh tasks to update UI
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addCollaborator: async (taskId, email, permission) => {
    try {
      set({ isLoading: true, error: null });
      
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError) throw new Error('User not found');
      
      // Add collaborator
      const { error } = await supabase
        .from('task_collaborators')
        .insert({
          task_id: taskId,
          user_id: user.id,
          permission,
          created_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Refresh task to get updated collaborators
      await get().fetchTaskById(taskId);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateCollaboratorPermission: async (id, permission) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('task_collaborators')
        .update({ permission })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh tasks to update UI
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  removeCollaborator: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('task_collaborators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh tasks to update UI
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  generateAITasks: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // In a real app, this would call an AI service
      // For demo purposes, we'll create some mock AI-generated tasks
      const { user } = await supabase.auth.getUser();
      
      if (!user.data.user) throw new Error('User not authenticated');
      
      const userId = user.data.user.id;
      
      // Get existing tasks to analyze patterns
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('title, description, priority, category_id')
        .eq('user_id', userId)
        .limit(10);
      
      // Mock AI-generated tasks based on existing tasks
      const aiTasks = [
        {
          user_id: userId,
          title: 'Review project documentation',
          description: 'Ensure all documentation is up-to-date and comprehensive',
          priority: 'medium',
          status: 'todo',
          due_date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
          is_ai_generated: true,
          ai_metadata: {
            confidence: 0.92,
            reasoning: 'Based on your work patterns and recent project tasks',
          },
        },
        {
          user_id: userId,
          title: 'Prepare weekly progress report',
          description: 'Compile key metrics and achievements from the past week',
          priority: 'high',
          status: 'todo',
          due_date: format(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
          is_ai_generated: true,
          ai_metadata: {
            confidence: 0.89,
            reasoning: 'Regular weekly task based on your calendar patterns',
          },
        },
        {
          user_id: userId,
          title: 'Research new productivity tools',
          description: 'Explore tools that could improve team workflow and efficiency',
          priority: 'low',
          status: 'todo',
          due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
          is_ai_generated: true,
          ai_metadata: {
            confidence: 0.78,
            reasoning: 'Based on your interest in productivity improvements',
          },
        },
      ];
      
      // Insert AI tasks
      const { error } = await supabase
        .from('tasks')
        .insert(aiTasks.map(task => ({
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })));
      
      if (error) throw error;
      
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  prioritizeTasksWithAI: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // In a real app, this would call an AI service to analyze and prioritize tasks
      // For demo purposes, we'll simulate AI prioritization
      
      const { tasks } = get();
      
      // Only prioritize non-completed tasks
      const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'archived');
      
      // Simulate AI prioritization logic
      const prioritizedTasks = activeTasks.map(task => {
        // Simple prioritization logic - in a real app this would be done by an AI model
        let newPriority: TaskPriority = 'medium';
        
        // Tasks due soon get higher priority
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          const now = new Date();
          const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 1) {
            newPriority = 'urgent';
          } else if (daysUntilDue <= 3) {
            newPriority = 'high';
          } else if (daysUntilDue <= 7) {
            newPriority = 'medium';
          } else {
            newPriority = 'low';
          }
        }
        
        return {
          id: task.id,
          priority: newPriority,
          ai_metadata: {
            ...task.ai_metadata,
            last_prioritized: new Date().toISOString(),
            prioritization_reason: `Prioritized based on due date and task importance`,
          },
        };
      });
      
      // Update tasks with new priorities
      for (const task of prioritizedTasks) {
        await supabase
          .from('tasks')
          .update({
            priority: task.priority,
            ai_metadata: task.ai_metadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);
      }
      
      await get().fetchTasks();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  setFilter: (filter) => {
    set(state => ({
      filters: {
        ...state.filters,
        ...filter,
      },
    }));
    
    // Fetch tasks with new filters
    get().fetchTasks();
  },
  
  resetFilters: () => {
    set({
      filters: {
        status: 'all',
        priority: 'all',
        categoryId: 'all',
        searchQuery: '',
      },
    });
    
    // Fetch tasks with reset filters
    get().fetchTasks();
  },
  
  setActiveTask: (id) => {
    set({ activeTaskId: id });
  },
}));

// Set up realtime subscriptions
export const setupTaskSubscriptions = () => {
  const taskStore = useTaskStore.getState();
  
  // Subscribe to tasks table changes
  const tasksSubscription = supabase
    .channel('tasks-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
    }, () => {
      // Refresh tasks when changes occur
      taskStore.fetchTasks();
    })
    .subscribe();
  
  // Subscribe to categories table changes
  const categoriesSubscription = supabase
    .channel('categories-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'categories',
    }, () => {
      // Refresh categories when changes occur
      taskStore.fetchCategories();
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(tasksSubscription);
    supabase.removeChannel(categoriesSubscription);
  };
};