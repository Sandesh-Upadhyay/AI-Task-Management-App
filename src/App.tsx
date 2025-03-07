import React, { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle2, Circle, Trash2, Sparkles, Github, Linkedin, BarChart, Brain } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Analytics from './components/Analytics';

// Task type definition
interface Task {
  id: string;
  text: string;
  completed: boolean;
  aiGenerated?: boolean;
  createdAt: number;
  completedAt?: number;
}

// Analytics data type
interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  aiGeneratedTasks: number;
  averageCompletionTime: number | null;
  userActivity: {
    date: string;
    count: number;
  }[];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [
      { id: '1', text: 'Create a demo for Subhash', completed: false, createdAt: Date.now() },
      { id: '2', text: 'Show how I use AI tools effectively', completed: false, createdAt: Date.now() },
      { id: '3', text: 'Explain my development process', completed: false, createdAt: Date.now() },
    ];
  });
  
  const [newTask, setNewTask] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalTasks: 0,
    completedTasks: 0,
    aiGeneratedTasks: 0,
    averageCompletionTime: null,
    userActivity: []
  });
  const [aiModel, setAiModel] = useState<'basic' | 'advanced'>('basic');
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Track user session
    const sessionId = localStorage.getItem('sessionId') || uuidv4();
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', sessionId);
      // In a real app, you would send this to your analytics backend
      console.log('New user session started:', sessionId);
    }
    
    // Update analytics data
    updateAnalytics();
  }, [tasks]);
  
  // Update analytics data
  const updateAnalytics = () => {
    const completed = tasks.filter(task => task.completed).length;
    const aiGenerated = tasks.filter(task => task.aiGenerated).length;
    
    // Calculate average completion time for completed tasks
    const completedTasks = tasks.filter(task => task.completed && task.completedAt);
    let avgTime = null;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        return sum + ((task.completedAt || 0) - task.createdAt);
      }, 0);
      avgTime = totalTime / completedTasks.length / (1000 * 60); // in minutes
    }
    
    // Group tasks by date for activity chart
    const activity: Record<string, number> = {};
    tasks.forEach(task => {
      const date = new Date(task.createdAt).toLocaleDateString();
      activity[date] = (activity[date] || 0) + 1;
    });
    
    const userActivity = Object.entries(activity).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setAnalyticsData({
      totalTasks: tasks.length,
      completedTasks: completed,
      aiGeneratedTasks: aiGenerated,
      averageCompletionTime: avgTime,
      userActivity
    });
  };
  
  // Add a new task
  const addTask = () => {
    if (newTask.trim()) {
      setTasks(prevTasks => [...prevTasks, { 
        id: uuidv4(), 
        text: newTask, 
        completed: false,
        createdAt: Date.now()
      }]);
      setNewTask('');
      
      // In a real app, you would track this event
      console.log('Task added manually');
    }
  };
  
  // Toggle task completion
  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        completedAt: !task.completed ? Date.now() : undefined
      } : task
    ));
    
    // In a real app, you would track this event
    console.log('Task toggled:', id);
  };
  
  // Delete a task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    
    // In a real app, you would track this event
    console.log('Task deleted:', id);
  };
  
  // Generate AI tasks with different models
  const generateAITasks = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let aiSuggestions: string[] = [];
      
      if (aiModel === 'basic') {
        aiSuggestions = [
          "Research latest AI development tools",
          "Create a portfolio showcasing AI projects",
          "Practice explaining technical concepts simply",
          "Prepare answers for common interview questions",
          "Set up GitHub profile with impressive projects"
        ];
      } else {
        // Advanced AI model provides more contextual suggestions based on existing tasks
        const existingTopics = new Set(tasks.map(task => task.text.toLowerCase()));
        
        // Contextual suggestions based on existing tasks
        if (existingTopics.has('create a demo for subhash') || existingTopics.has('show how i use ai tools effectively')) {
          aiSuggestions.push("Prepare a live coding session demonstrating AI integration");
          aiSuggestions.push("Create slides explaining your AI-assisted workflow");
          aiSuggestions.push("Document your process with screenshots and annotations");
        }
        
        // Career development suggestions
        aiSuggestions.push("Research companies using AI in their development workflow");
        aiSuggestions.push("Identify specific AI tools that improve your productivity");
        
        // Technical skill suggestions
        aiSuggestions.push("Learn prompt engineering techniques for better AI results");
        aiSuggestions.push("Practice integrating OpenAI API into a real project");
        
        // Randomize and limit suggestions
        aiSuggestions = aiSuggestions.sort(() => 0.5 - Math.random()).slice(0, 5);
      }
      
      const newAITasks = aiSuggestions.map((text) => ({
        id: uuidv4(),
        text,
        completed: false,
        aiGenerated: true,
        createdAt: Date.now()
      }));
      
      setTasks(prevTasks => [...prevTasks, ...newAITasks]);
      setIsGenerating(false);
      
      // In a real app, you would track this event
      console.log('AI tasks generated with model:', aiModel);
    }, 1500);
  };
  
  // Handle key press for adding tasks
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };
  
  // Toggle AI model
  const toggleAiModel = () => {
    setAiModel(prev => prev === 'basic' ? 'advanced' : 'basic');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Task Manager</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Show Analytics"
              >
                <BarChart size={20} className="text-purple-600" />
              </button>
            </div>
          </div>
          <p className="text-gray-600 mb-6">Built with React + AI assistance</p>
          
          {showAnalytics ? (
            <Analytics data={analyticsData} onClose={() => setShowAnalytics(false)} />
          ) : (
            <>
              <div className="flex mb-6">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  onClick={addTask}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg transition-colors"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={generateAITasks}
                  disabled={isGenerating}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    isGenerating 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  }`}
                >
                  <Sparkles size={18} />
                  {isGenerating ? 'Generating...' : 'Generate AI Tasks'}
                </button>
                
                <button
                  onClick={toggleAiModel}
                  className="ml-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title={`Current: ${aiModel === 'basic' ? 'Basic AI' : 'Advanced AI'}`}
                >
                  <Brain size={20} className={aiModel === 'basic' ? 'text-gray-600' : 'text-purple-600'} />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mb-6 flex items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded font-medium ${
                  aiModel === 'basic' 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {aiModel === 'basic' ? 'Basic AI' : 'Advanced AI'} model
                </span>
                <span className="ml-2">
                  {aiModel === 'basic' 
                    ? 'Generic suggestions' 
                    : 'Context-aware, personalized suggestions'}
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No tasks yet. Add some!</p>
                ) : (
                  tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center p-3 rounded-lg transition-all ${
                        task.completed ? 'bg-gray-100 text-gray-500' : 'bg-white'
                      } ${task.aiGenerated ? 'border border-purple-200' : ''}`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="mr-3 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} />}
                      </button>
                      
                      <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>
                        {task.text}
                        {task.aiGenerated && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <Sparkles size={12} className="mr-1" /> 
                            {aiModel === 'advanced' && task.aiGenerated ? 'AI+' : 'AI'}
                          </span>
                        )}
                      </span>
                      
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Built by Sandesh Upadhyay
            </p>
            <div className="flex space-x-2">
              <a href="https://github.com/Sandesh-Upadhyay" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Github size={20} />
              </a>
              <a href="https://www.linkedin.com/in/sandesh-upadhyay-671bb8253/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 max-w-md text-white text-center">
        <h2 className="text-xl font-bold mb-2">About This Demo</h2>
        <p className="mb-4">
          This task manager demonstrates how I leverage AI tools to rapidly build functional applications.
          The "AI Task Suggestions" feature simulates how I use AI to generate ideas and content.
        </p>
        <p>
          In a real project, I would connect to OpenAI's API for truly intelligent suggestions based on existing tasks and project context.
        </p>
      </div>
    </div>
  );
}

export default App;