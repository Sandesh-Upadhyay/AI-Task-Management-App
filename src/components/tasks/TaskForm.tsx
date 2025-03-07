import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useTaskStore, Task, TaskPriority, TaskStatus } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Clock, Tag, AlignLeft, Bookmark } from 'lucide-react';

// Form validation schema
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'completed', 'archived']),
  due_date: z.string().optional(),
  category_id: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  taskId?: string;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ taskId, onClose }) => {
  const { user } = useAuthStore();
  const { 
    tasks, 
    categories, 
    fetchTaskById, 
    createTask, 
    updateTask, 
    fetchCategories,
    isLoading 
  } = useTaskStore();
  
  const isEditMode = !!taskId;
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      category_id: '',
    },
  });
  
  useEffect(() => {
    fetchCategories();
    
    if (isEditMode && taskId) {
      const loadTask = async () => {
        const task = await fetchTaskById(taskId);
        if (task) {
          reset({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
            category_id: task.category_id || '',
          });
        }
      };
      
      loadTask();
    }
  }, [isEditMode, taskId, fetchTaskById, reset, fetchCategories]);
  
  const onSubmit = async (data: TaskFormValues) => {
    if (!user) return;
    
    try {
      if (isEditMode && taskId) {
        await updateTask(taskId, {
          ...data,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        });
      } else {
        await createTask({
          ...data,
          user_id: user.id,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
          is_ai_generated: false,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Task' : 'Create New Task'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Task title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center">
              <AlignLeft size={16} className="mr-1" />
              Description
            </div>
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Task description (optional)"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Tag size={16} className="mr-1" />
                Priority
              </div>
            </label>
            <select
              id="priority"
              {...register('priority')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                Status
              </div>
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                Due Date
              </div>
            </label>
            <input
              id="due_date"
              type="datetime-local"
              {...register('due_date')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Bookmark size={16} className="mr-1" />
                Category
              </div>
            </label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;