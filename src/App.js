import React, { useState } from 'react';
import { Search, Briefcase, Settings, User, Zap, Clock, CheckCircle, TrendingUp, Filter, Bell, Play, Pause, DollarSign, MapPin, Calendar } from 'lucide-react';
import './App.css';

export default function RemoteDollarsApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSalary, setFilterSalary] = useState('all');
  
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
      posted: '3 hours ago',
      matched: 85,
      applied: false,
      tags: ['Java', 'Spring', 'MySQL']
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      company: 'CloudTech Inc',
      location: 'Remote Worldwide',
      salary: '$40/hr',
      experience: '3+ years',
      posted: '6 hours ago',
      matched: 90,
      applied: false,
      tags: ['AWS', 'Docker', 'Kubernetes']
    }
  ]);

  const [preferences, setPreferences] = useState({
    minSalary: 25,
    maxSalary: 50,
    jobTypes: ['Full-time', 'Contract'],
    skills: ['React', 'Node.js', 'Python']
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
    <div>
      <div className="header-flex">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Track your job application progress</p>
        </div>
        <button
          onClick={toggleAutoApply}
          className={`auto-apply-btn ${isAutoApplying ? 'paused' : 'active'}`}
        >
          {isAutoApplying ? <Pause size={20} /> : <Play size={20} />}
          {isAutoApplying ? 'Pause Auto-Apply' : 'Start Auto-Apply'}
        </button>
      </div>

      {isAutoApplying && (
        <div className="alert">
          <div className="spinner"></div>
          <div>
            <p className="alert-title">Auto-Apply Active</p>
            <p className="alert-text">AI is searching and applying to matching jobs...</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Total Applied</p>
              <p className="stat-value">{stats.applied}</p>
            </div>
            <div className="stat-icon blue">
              <Briefcase size={24} />
            </div>
          </div>
          <p className="stat-trend">
            <TrendingUp size={16} /> +12% this week
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value">{stats.pending}</p>
            </div>
            <div className="stat-icon yellow">
              <Clock size={24} />
            </div>
          </div>
          <p className="stat-info">Awaiting response</p>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Interviews</p>
              <p className="stat-value">{stats.interviews}</p>
            </div>
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="stat-trend">Scheduled</p>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <p className="stat-label">Responses</p>
              <p className="stat-value">{stats.responses}</p>
            </div>
            <div className="stat-icon purple">
              <Bell size={24} />
            </div>
          </div>
          <p className="stat-info">Total received</p>
        </div>
      </div>

      <div className="card">
        <h2>Recent Activity</h2>
        {[
          { action: 'Applied to', job: 'Full Stack Developer at StartupXYZ', time: '2 hours ago', status: 'success' },
          { action: 'Interview scheduled', job: 'Frontend Engineer at Creative Apps', time: '5 hours ago', status: 'interview' },
          { action: 'Applied to', job: 'Backend Developer at DataTech', time: '1 day ago', status: 'success' },
          { action: 'Response received', job: 'Software Developer at Tech Innovators', time: '2 days ago', status: 'response' }
        ].map((activity, idx) => (
          <div key={idx} className="activity-item">
            <div className={`activity-icon ${activity.status}`}>
              {activity.status === 'success' && <CheckCircle size={20} />}
              {activity.status === 'interview' && <Calendar size={20} />}
              {activity.status === 'response' && <Bell size={20} />}
            </div>
            <div className="activity-content">
              <p className="activity-title">{activity.action}</p>
              <p className="activity-job">{activity.job}</p>
            </div>
            <p className="activity-time">{activity.time}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const JobsView = () => (
    <div>
      <div className="header">
        <h1>Available Jobs</h1>
        <p className="subtitle">Browse and apply to remote opportunities</p>
      </div>

      <div className="card search-bar">
        <div className="search-flex">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterSalary}
            onChange={(e) => setFilterSalary(e.target.value)}
            className="select"
          >
            <option value="all">All Salaries</option>
            <option value="high">$30+/hr</option>
            <option value="medium">$20-30/hr</option>
            <option value="low">Under $20/hr</option>
          </select>
          <button className="filter-btn">
            <Filter size={20} />
            More Filters
          </button>
        </div>
      </div>

      <div className="jobs-list">
        {filteredJobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <div className="job-content">
                <div className="job-title-row">
                  <h3>{job.title}</h3>
                  <span className={`match-badge ${job.matched >= 90 ? 'high' : job.matched >= 80 ? 'medium' : 'low'}`}>
                    {job.matched}% Match
                  </span>
                </div>
                <p className="job-company">{job.company}</p>
                
                <div className="job-details">
                  <span className="job-detail">
                    <MapPin size={16} />
                    {job.location}
                  </span>
                  <span className="job-detail">
                    <DollarSign size={16} />
                    {job.salary}
                  </span>
                  <span className="job-detail">
                    <Briefcase size={16} />
                    {job.experience}
                  </span>
                  <span className="job-detail">
                    <Clock size={16} />
                    {job.posted}
                  </span>
                </div>

                <div className="tags">
                  {job.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => applyToJob(job.id)}
                disabled={job.applied}
                className={`apply-btn ${job.applied ? 'applied' : ''}`}
              >
                {job.applied ? (
                  <>
                    <CheckCircle size={20} />
                    Applied
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Quick Apply
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PreferencesView = () => (
    <div>
      <div className="header">
        <h1>Job Preferences</h1>
        <p className="subtitle">Customize your auto-apply settings</p>
      </div>

      <div className="card mb-24">
        <h2>Salary Range</h2>
        <div className="form-group">
          <label>Minimum Hourly Rate ($)</label>
          <input
            type="number"
            value={preferences.minSalary}
            onChange={(e) => setPreferences({...preferences, minSalary: parseInt(e.target.value)})}
            className="input-full"
          />
        </div>
        <div className="form-group">
          <label>Maximum Hourly Rate ($)</label>
          <input
            type="number"
            value={preferences.maxSalary}
            onChange={(e) => setPreferences({...preferences, maxSalary: parseInt(e.target.value)})}
            className="input-full"
          />
        </div>
      </div>

      <div className="card mb-24">
        <h2>Job Types</h2>
        <div className="checkbox-grid">
          {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
            <label key={type} className="checkbox-label">
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
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card mb-24">
        <h2>Skills</h2>
        <div className="skills-container">
          {preferences.skills.map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
              <button
                onClick={() => setPreferences({...preferences, skills: preferences.skills.filter((_, i) => i !== idx)})}
                className="remove-btn"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add a skill and press Enter..."
          className="input-full"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              setPreferences({...preferences, skills: [...preferences.skills, e.target.value.trim()]});
              e.target.value = '';
            }
          }}
        />
      </div>

      <button className="save-btn">Save Preferences</button>
    </div>
  );

  const ProfileView = () => (
    <div>
      <div className="header">
        <h1>Profile</h1>
        <p className="subtitle">Manage your account and resume</p>
      </div>

      <div className="card mb-24">
        <h2>Personal Information</h2>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="John Doe" className="input-full" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="john@example.com" className="input-full" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" placeholder="+1 (555) 000-0000" className="input-full" />
        </div>
      </div>

      <div className="card mb-24">
        <h2>Resume</h2>
        <div className="upload-box">
          <div className="upload-icon">
            <Briefcase size={32} color="#3b82f6" />
          </div>
          <div>
            <p className="upload-title">Upload your resume</p>
            <p className="upload-text">PDF, DOC, or DOCX (Max 5MB)</p>
          </div>
          <button className="upload-btn">Choose File</button>
        </div>
      </div>

      <button className="save-btn">Save Changes</button>
    </div>
  );

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">
              <Zap size={24} color="white" />
            </div>
            <span className="logo-text">Remote Dollars</span>
          </div>
          
          <div className="nav-buttons">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <TrendingUp size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            >
              <Briefcase size={20} />
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            >
              <Settings size={20} />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User size={20} />
              Profile
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'jobs' && <JobsView />}
        {activeTab === 'preferences' && <PreferencesView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>
    </div>
  );
}