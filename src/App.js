import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Settings, User, Zap, Clock, CheckCircle, TrendingUp, Filter, Bell, Play, Pause, DollarSign, MapPin, Calendar } from 'lucide-react';

export default function RemoteDollarsApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSalary, setFilterSalary] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  
  const [stats, setStats] = useState({
    applied: 24,
    pending: 8,
    interviews: 3,
    responses: 5
  });

  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Remote Software Developer',
      company: 'Tech Innovators',
      location: 'Remote Worldwide',
      salary: '$30/hr',
      experience: '2+ years',
      type: 'Full-time',
      posted: '2 hours ago',
      matched: 95,
      applied: false,
      tags: ['React', 'Node.js', 'AWS']
    },
    {
      id: 2,
      title: 'Frontend Engineer (React)',
      company: 'Creative Apps',
      location: 'Remote',
      salary: '$25/hr',
      experience: '3+ years',
      type: 'Contract',
      posted: '5 hours ago',
      matched: 88,
      applied: false,
      tags: ['React', 'TypeScript', 'CSS']
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'Remote - US Only',
      salary: '$35/hr',
      experience: '4+ years',
      type: 'Full-time',
      posted: '1 day ago',
      matched: 92,
      applied: true,
      tags: ['Python', 'Django', 'React']
    },
    {
      id: 4,
      title: 'Backend Developer',
      company: 'DataTech Solutions',
      location: 'Remote Worldwide',
      salary: '$28/hr',
      experience: '2+ years',
      type: 'Full-time',
      posted: '3 hours ago',
      matched: 85,
      applied: false,
      tags: ['Java', 'Spring', 'MySQL']
    }
  ]);

  const [preferences, setPreferences] = useState({
    minSalary: 25,
    maxSalary: 50,
    experience: '2+',
    jobTypes: ['Full-time', 'Contract'],
    skills: ['React', 'Node.js', 'Python'],
    locations: ['Remote Worldwide', 'Remote - US Only']
  });

  const toggleAutoApply = () => {
    setIsAutoApplying(!isAutoApplying);
    if (!isAutoApplying) {
      setTimeout(() => {
        setStats(prev => ({
          ...prev,
          applied: prev.applied + 1,
          pending: prev.pending + 1
        }));
      }, 2000);
    }
  };

  const applyToJob = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, applied: true } : job
    ));
    setStats(prev => ({
      ...prev,
      applied: prev.applied + 1,
      pending: prev.pending + 1
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSalary = filterSalary === 'all' || 
                         (filterSalary === 'high' && parseInt(job.salary.replace(/\D/g, '')) >= 30) ||
                         (filterSalary === 'medium' && parseInt(job.salary.replace(/\D/g, '')) >= 20 && parseInt(job.salary.replace(/\D/g, '')) < 30) ||
                         (filterSalary === 'low' && parseInt(job.salary.replace(/\D/g, '')) < 20);
    return matchesSearch && matchesSalary;
  });

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your job application progress</p>
        </div>
        <button
          onClick={toggleAutoApply}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isAutoApplying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
          }`}
        >
          {isAutoApplying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isAutoApplying ? 'Pause Auto-Apply' : 'Start Auto-Apply'}
        </button>
      </div>

      {isAutoApplying && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-semibold text-gray-900">Auto-Apply Active</p>
              <p className="text-sm text-gray-600">AI is searching and applying to matching jobs...</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Applied</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.applied}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +12% this week
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Awaiting response</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Interviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.interviews}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-3">Scheduled</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Responses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.responses}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Total received</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'Applied to', job: 'Full Stack Developer at StartupXYZ', time: '2 hours ago', status: 'success' },
            { action: 'Interview scheduled', job: 'Frontend Engineer at Creative Apps', time: '5 hours ago', status: 'interview' },
            { action: 'Applied to', job: 'Backend Developer at DataTech', time: '1 day ago', status: 'success' },
            { action: 'Response received', job: 'Software Developer at Tech Innovators', time: '2 days ago', status: 'response' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`p-2 rounded-full ${
                activity.status === 'success' ? 'bg-blue-100' :
                activity.status === 'interview' ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                {activity.status === 'success' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                {activity.status === 'interview' && <Calendar className="w-5 h-5 text-green-600" />}
                {activity.status === 'response' && <Bell className="w-5 h-5 text-purple-600" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.job}</p>
              </div>
              <p className="text-sm text-gray-500">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const JobsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Jobs</h1>
        <p className="text-gray-600 mt-1">Browse and apply to remote opportunities</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSalary}
            onChange={(e) => setFilterSalary(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Salaries</option>
            <option value="high">$30+/hr</option>
            <option value="medium">$20-30/hr</option>
            <option value="low">Under $20/hr</option>
          </select>
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            <Filter className="w-5 h-5" />
            More Filters
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    job.matched >= 90 ? 'bg-green-100 text-green-700' :
                    job.matched >= 80 ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {job.matched}% Match
                  </span>
                </div>
                <p className="text-gray-700 font-medium mb-3">{job.company}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.posted}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {job.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => applyToJob(job.id)}
                disabled={job.applied}
                className={`ml-4 px-6 py-3 rounded-lg font-semibold transition-all ${
                  job.applied
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {job.applied ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Applied
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Apply
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PreferencesView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Preferences</h1>
        <p className="text-gray-600 mt-1">Customize your auto-apply settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Salary Range</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Hourly Rate ($)</label>
            <input
              type="number"
              value={preferences.minSalary}
              onChange={(e) => setPreferences({...preferences, minSalary: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Hourly Rate ($)</label>
            <input
              type="number"
              value={preferences.maxSalary}
              onChange={(e) => setPreferences({...preferences, maxSalary: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Job Types</h2>
        <div className="grid grid-cols-2 gap-4">
          {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
            <label key={type} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.jobTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPreferences({...preferences, jobTypes: [...preferences.jobTypes, type]});
                  } else {
                    setPreferences({...preferences, jobTypes: preferences.jobTypes.filter(t => t !== type)});
                  }
                }}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {preferences.skills.map((skill, idx) => (
            <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">
              {skill}
              <button
                onClick={() => setPreferences({...preferences, skills: preferences.skills.filter((_, i) => i !== idx)})}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a skill and press Enter..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              setPreferences({...preferences, skills: [...preferences.skills, e.target.value.trim()]});
              e.target.value = '';
            }
          }}
        />
      </div>

      <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all">
        Save Preferences
      </button>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account and resume</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Resume</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="bg-blue-100 p-4 rounded-full">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload your resume</p>
              <p className="text-sm text-gray-600 mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
            </div>
            <button className="mt-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
              Choose File
            </button>
          </div>
        </div>
      </div>

      <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all">
        Save Changes
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Remote Dollars
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'jobs'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                Jobs
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'preferences'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'jobs' && <JobsView />}
        {activeTab === 'preferences' && <PreferencesView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>
    </div>
  );
}

