import React, { useState, useEffect } from 'react';
import { format, isToday, isPast, addDays } from 'date-fns';
import { useTaskStore, Task, TaskStatus, TaskPriority } from '../../store/taskStore';
import { 
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Sparkles,
  Paperclip,
  Users,
  AlertCircle
} from 'lucide-react';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

const TaskList: React.FC = () => {
  const { 
    tasks, 
    categories,
    filters,
    fetchTasks, 
    fetchCategories,
    deleteTask, 
    completeTask,
    setFilter,
    resetFilters,
    generateAITasks,
    prioritizeTasksWithAI,
    isLoading,
    error
  } = useTaskStore();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);
  
  const handleEditTask = (taskId: string) => {
    setEditTaskId(taskId);
    setShowTaskForm(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };
  
  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };
  
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetail(true);
  };
  
  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditTaskId(null);
  };
  
  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTaskId(null);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ searchQuery: e.target.value });
  };
  
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <Clock size={14} className="mr-1" />
          Today, {format(date, 'h:mm a')}
        </span>
      );
    } else if (isPast(date)) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <AlertCircle size={14} className="mr-1" />
          Overdue: {format(date, 'MMM d')}
        </span>
      );
    } else if (isToday(addDays(date, -1))) {
      return (
        <span className="flex items-center text-orange-600 text-sm font-medium">
          <Clock size={14} className="mr-1" />
          Tomorrow, {format(date, 'h:mm a')}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-gray-600 text-sm">
          <Calendar size={14} className="mr-1" />
          {format(date, 'MMM d, h:mm a')}
        </span>
      );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">My Tasks</h2>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter size={18} className="mr-2 text-gray-600" />
            Filters
            {showFilters ? (
              <ChevronUp size={18} className="ml-2 text-gray-600" />
            ) : (
              <ChevronDown size={18} className="ml-2 text-gray-600" />
            )}
          </button>
          
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            New Task
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilter({ status: e.target.value as TaskStatus | 'all' })}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                value={filters.priority}
                onChange={(e) => setFilter({ priority: e.target.value as TaskPriority | 'all' })}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={filters.categoryId}
                onChange={(e) => setFilter({ categoryId: e.target.value })}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              onClick={generateAITasks}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={18} className="mr-2" />
              Generate AI Tasks
            </button>
            
            <button
              onClick={prioritizeTasksWithAI}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={18} className="mr-2" />
              Prioritize with AI
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tasks found</p>
          <button
            onClick={() => setShowTaskForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                task.status === 'completed' ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className="mt-1 mr-3 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>
                
                <div className="flex-1 min-w-0" onClick={() => handleViewTask(task.id)}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className={`text-lg font-medium ${
                      task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.is_ai_generated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        <Sparkles size={12} className="mr-1" />
                        AI Generated
                      </span>
                    )}
                    
                    {task.category && (
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${task.category.color}20`, 
                          color: task.category.color 
                        }}
                      >
                        {task.category.name}
                      </span>
                    )}
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <Tag size={12} className="mr-1" />
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'todo' ? 'To Do' : 
                       task.status === 'in_progress' ? 'In Progress' : 
                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className={`text-sm mb-2 ${
                      task.status === 'completed' ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {task.description.length > 150 
                        ? `${task.description.substring(0, 150)}...` 
                        : task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {getDueDateDisplay(task.due_date)}
                    
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="flex items-center">
                        <Paperclip size={14} className="mr-1" />
                        {task.attachments.length} {task.attachments.length === 1 ? 'attachment' : 'attachments'}
                      </span>
                    )}
                    
                    {task.collaborators && task.collaborators.length > 0 && (
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {task.collaborators.length} {task.collaborators.length === 1 ? 'collaborator' : 'collaborators'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditTask(task.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TaskForm taskId={editTaskId || undefined} onClose={handleCloseTaskForm} />
          </div>
        </div>
      )}
      
      {showTaskDetail && selectedTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <TaskDetail taskId={selectedTaskId} onClose={handleCloseTaskDetail} onEdit={handleEditTask} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;