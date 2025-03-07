import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTaskStore, Task, Attachment } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { 
  X, 
  Calendar, 
  Tag, 
  Clock, 
  Edit, 
  Trash2, 
  Download, 
  Paperclip, 
  Upload, 
  Users, 
  UserPlus, 
  Sparkles 
} from 'lucide-react';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
  onEdit: (taskId: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose, onEdit }) => {
  const { user } = useAuthStore();
  const { 
    fetchTaskById, 
    deleteTask, 
    completeTask, 
    uploadAttachment, 
    deleteAttachment,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorPermission,
    isLoading, 
    error 
  } = useTaskStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorPermission, setNewCollaboratorPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
  
  useEffect(() => {
    const loadTask = async () => {
      const taskData = await fetchTaskById(taskId);
      if (taskData) {
        setTask(taskData);
      }
    };
    
    loadTask();
  }, [taskId, fetchTaskById]);
  
  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
      onClose();
    }
  };
  
  const handleCompleteTask = async () => {
    await completeTask(taskId);
    const updatedTask = await fetchTaskById(taskId);
    if (updatedTask) {
      setTask(updatedTask);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await uploadAttachment(taskId, file);
    
    // Refresh task to show new attachment
    const updatedTask = await fetchTaskById(taskId);
    if (updatedTask) {
      setTask(updatedTask);
    }
    
    // Reset file input
    e.target.value = '';
  };
  
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      await deleteAttachment(attachmentId);
      
      // Refresh task to update attachments list
      const updatedTask = await fetchTaskById(taskId);
      if (updatedTask) {
        setTask(updatedTask);
      }
    }
  };
  
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCollaboratorEmail) return;
    
    try {
      await addCollaborator(taskId, newCollaboratorEmail, newCollaboratorPermission);
      
      // Refresh task to show new collaborator
      const updatedTask = await fetchTaskById(taskId);
      if (updatedTask) {
        setTask(updatedTask);
      }
      
      // Reset form
      setNewCollaboratorEmail('');
      setShowCollaboratorForm(false);
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };
  
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (window.confirm('Are you sure you want to remove this collaborator?')) {
      await removeCollaborator(collaboratorId);
      
      // Refresh task to update collaborators list
      const updatedTask = await fetchTaskById(taskId);
      if (updatedTask) {
        setTask(updatedTask);
      }
    }
  };
  
  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'edit':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-500">Task not found</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(taskId)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
            title="Edit Task"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={handleDeleteTask}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"
            title="Delete Task"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mr-3">{task.title}</h1>
          {task.is_ai_generated && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <Sparkles size={14} className="mr-1" />
              AI Generated
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {task.category && (
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${task.category.color}20`, 
                color: task.category.color 
              }}
            >
              {task.category.name}
            </span>
          )}
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Tag size={14} className="mr-1" />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
          
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Clock size={14} className="mr-1" />
            {task.status === 'todo' ? 'To Do' : 
             task.status === 'in_progress' ? 'In Progress' : 
             task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>
        
        {task.due_date && (
          <div className="flex items-center text-gray-700 mb-4">
            <Calendar size={18} className="mr-2" />
            <span>
              Due: {format(new Date(task.due_date), 'MMMM d, yyyy h:mm a')}
            </span>
          </div>
        )}
        
        {task.description && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
        
        {task.status !== 'completed' && (
          <button
            onClick={handleCompleteTask}
            className="mb-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Clock size={16} className="mr-2" />
            Mark as Completed
          </button>
        )}
        
        {task.ai_metadata && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights</h3>
            <div className="bg-purple-50 p-4 rounded-lg">
              {task.ai_metadata.reasoning && (
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Reasoning:</span> {task.ai_metadata.reasoning}
                </p>
              )}
              {task.ai_metadata.confidence && (
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Confidence:</span> {(task.ai_metadata.confidence * 100).toFixed(0)}%
                </p>
              )}
              {task.ai_metadata.prioritization_reason && (
                <p className="text-gray-700">
                  <span className="font-medium">Prioritization:</span> {task.ai_metadata.prioritization_reason}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
          <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
            <Upload size={16} className="mr-2" />
            Add Attachment
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
        
        {task.attachments && task.attachments.length > 0 ? (
          <div className="space-y-3">
            {task.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Paperclip size={18} className="text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.file_size / 1024).toFixed(2)} KB • {attachment.file_type}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // In a real app, this would download the file
                      alert('Download functionality would be implemented here');
                    }}
                    className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No attachments yet</p>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Collaborators</h3>
          <button
            onClick={() => setShowCollaboratorForm(!showCollaboratorForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus size={16} className="mr-2" />
            Add Collaborator
          </button>
        </div>
        
        {showCollaboratorForm && (
          <form onSubmit={handleAddCollaborator} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="collaborator@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="permission" className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <select
                  id="permission"
                  value={newCollaboratorPermission}
                  onChange={(e) => setNewCollaboratorPermission(e.target.value as 'view' | 'edit' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}
        
        {task.collaborators && task.collaborators.length > 0 ? (
          <div className="space-y-3">
            {task.collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium mr-3">
                    {collaborator.profile?.full_name 
                      ? collaborator.profile.full_name.charAt(0).toUpperCase()
                      : collaborator.profile?.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {collaborator.profile?.full_name || collaborator.profile?.email}
                    </p>
                    <p className="text-xs text-gray-500">{collaborator.profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPermissionColor(collaborator.permission)}`}>
                    {collaborator.permission.charAt(0).toUpperCase() + collaborator.permission.slice(1)}
                  </span>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No collaborators yet</p>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-6 mt-6 text-sm text-gray-500">
        <p>Created: {format(new Date(task.created_at), 'MMMM d, yyyy h:mm a')}</p>
        {task.completed_at && (
          <p>Completed: {format(new Date(task.completed_at), 'MMMM d, yyyy h:mm a')}</p>
        )}
        <p>Last updated: {format(new Date(task.updated_at), 'MMMM d, yyyy h:mm a')}</p>
      </div>
    </div>
  );
};

export default TaskDetail;