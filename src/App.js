import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Settings, User, Zap, Clock, CheckCircle, TrendingUp, Filter, Bell, Play, Pause, DollarSign, MapPin, Calendar, LogOut } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchJobsWithDirectLinks } from './services/multiJobService';
import Auth from './Auth';
import './App.css';

export default function RemoteDollarsApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSalary, setFilterSalary] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('all');
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const [stats, setStats] = useState({
    applied: 0,
    pending: 0,
    interviews: 0,
    responses: 0
  });

  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMoreJobs, setHasMoreJobs] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [preferences, setPreferences] = useState({
    minSalary: 25,
    maxSalary: 50,
    jobTypes: ['Full-time', 'Contract'],
    skills: ['React', 'Node.js', 'Python']
  });

  const [uploadedResume, setUploadedResume] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [applications, setApplications] = useState([]);
  const [autoApplyProgress, setAutoApplyProgress] = useState({ current: 0, total: 0 });
  
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [selectedJobForForm, setSelectedJobForForm] = useState(null);
  const [formQuestions, setFormQuestions] = useState([
    { question: 'Why do you want to work here?', answer: '' },
    { question: 'What makes you a good fit?', answer: '' },
    { question: 'Years of experience', answer: '' },
    { question: 'Expected salary', answer: '' },
    { question: 'Are you willing to relocate?', answer: '' }
  ]);
  const [generatingAnswers, setGeneratingAnswers] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser.uid);
        loadJobs();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorialCompleted');
    if (!hasSeenTutorial && user) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, [user]);

  useEffect(() => {
    if (user && preferences.skills.length > 0) {
      loadJobs();
    }
  }, [preferences.skills]);

  const loadJobs = async (page = 1) => {
    setLoadingJobs(true);
    try {
      const result = await fetchJobsWithDirectLinks({
        ...preferences,
        searchTerm: searchTerm,
        location: locationFilter,
        locationType: locationTypeFilter
      }, page);
      
      if (page === 1) {
        setJobs(result.jobs);
      } else {
        setJobs(prev => [...prev, ...result.jobs]);
      }
      
      setTotalJobs(result.total);
      setHasMoreJobs(result.hasMore);
      setCurrentPage(page);

      if (applications.length > 0) {
        const appliedJobIds = applications.map(app => app.jobId);
        setJobs(prevJobs => prevJobs.map(job => ({
          ...job,
          applied: appliedJobIds.includes(job.id)
        })));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadMoreJobs = () => {
    loadJobs(currentPage + 1);
  };

  const loadUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        if (data.resumeUrl) {
          setUploadedResume({ name: data.resumeName || 'Resume.pdf' });
        }
      } else {
        await setDoc(doc(db, 'users', userId), {
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          phone: '',
          preferences: preferences,
          createdAt: new Date()
        });
        setProfileData({
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          phone: ''
        });
      }

      const appsQuery = query(collection(db, 'applications'), where('userId', '==', userId));
      const appsSnapshot = await getDocs(appsQuery);
      const userApps = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(userApps);

      const appliedCount = userApps.length;
      const pendingCount = userApps.filter(app => app.status === 'pending').length;
      const interviewsCount = userApps.filter(app => app.status === 'interview').length;
      const responsesCount = userApps.filter(app => app.status === 'response').length;

      setStats({
        applied: appliedCount,
        pending: pendingCount,
        interviews: interviewsCount,
        responses: responsesCount
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStats({ applied: 0, pending: 0, interviews: 0, responses: 0 });
      setApplications([]);
      setProfileData({ name: '', email: '', phone: '' });
      setJobs([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleAutoApply = async () => {
    if (isAutoApplying) {
      setIsAutoApplying(false);
      setAutoApplyProgress({ current: 0, total: 0 });
      return;
    }

    setIsAutoApplying(true);
    
    const jobsToApply = filteredJobs.filter(job => 
      !job.applied && job.matched >= 60
    );

    if (jobsToApply.length === 0) {
      alert('No eligible jobs to apply to. Try adjusting your filters or loading more jobs.');
      setIsAutoApplying(false);
      return;
    }

    setAutoApplyProgress({ current: 0, total: jobsToApply.length });

    for (let i = 0; i < jobsToApply.length; i++) {
      if (!isAutoApplying) break;
      
      const job = jobsToApply[i];
      setAutoApplyProgress({ current: i + 1, total: jobsToApply.length });
      
      try {
        await applyToJob(job);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error auto-applying:', error);
      }
    }

    setIsAutoApplying(false);
    setAutoApplyProgress({ current: 0, total: 0 });
    alert(`Auto-apply completed! Applied to ${jobsToApply.length} jobs.`);
  };

  const applyToJob = async (job) => {
    if (!user) return;

    try {
      const existingApp = applications.find(app => app.jobId === job.id);
      if (existingApp) {
        return;
      }

      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        status: 'pending',
        appliedAt: new Date()
      });

      setJobs(jobs.map(j => 
        j.id === job.id ? { ...j, applied: true } : j
      ));
      
      setStats(prev => ({
        ...prev,
        applied: prev.applied + 1,
        pending: prev.pending + 1
      }));

      if (!isAutoApplying) {
        alert(`Successfully applied to ${job.title} at ${job.company}!`);
      }
      
      await loadUserData(user.uid);
    } catch (error) {
      console.error('Error applying to job:', error);
      if (!isAutoApplying) {
        alert('Failed to apply. Please try again.');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      alert('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    try {
      const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.uid), {
        resumeUrl: downloadURL,
        resumeName: file.name
      });

      setUploadedResume(file);
      alert(`Resume "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        updatedAt: new Date()
      });
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handlePreferencesSave = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferences: preferences,
        updatedAt: new Date()
      });
      alert('Preferences saved successfully! Reloading jobs...');
      loadJobs();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  const generateCoverLetter = async (job) => {
    setSelectedJobForCoverLetter(job);
    setGeneratingCoverLetter(true);
    setGeneratedCoverLetter('');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Write a professional cover letter for this job application:

Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}

Candidate Profile:
Name: ${profileData.name || 'Candidate'}
Skills: ${preferences.skills.join(', ')}
Experience Level: ${job.experience || 'Mid-level'}

Requirements:
- Keep it concise (250-300 words)
- Professional and enthusiastic tone
- Highlight relevant skills from the candidate's profile
- Explain why they're a good fit
- Include a strong closing statement
- Format with proper paragraphs

Do not include address or date. Start with "Dear Hiring Manager,"`
          }]
        })
      });

      const data = await response.json();
      const coverLetter = data.content[0].text;
      setGeneratedCoverLetter(coverLetter);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    if (!user) return;

    try {
      const appRef = doc(db, 'applications', applicationId);
      await updateDoc(appRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      await loadUserData(user.uid);
      alert('Application status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const addApplicationNote = async (applicationId, note) => {
    if (!user || !note.trim()) return;

    try {
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      const existingNotes = appDoc.data().notes || [];
      
      await updateDoc(appRef, {
        notes: [...existingNotes, {
          text: note,
          timestamp: new Date()
        }],
        updatedAt: new Date()
      });

      await loadUserData(user.uid);
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    }
  };

  const generateFormAnswers = async (job) => {
    setGeneratingAnswers(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are filling out a job application form. Generate professional, concise answers for these questions:

Job: ${job.title} at ${job.company}
Location: ${job.location}
Candidate Skills: ${preferences.skills.join(', ')}
Candidate Name: ${profileData.name || 'Candidate'}
Experience Level: ${job.experience || 'Mid-level'}

Questions to answer:
1. Why do you want to work here? (2-3 sentences, be specific about the company)
2. What makes you a good fit for this role? (2-3 sentences, highlight relevant skills)
3. Years of experience: (Answer with a number like "3-5 years" based on experience level)
4. Expected salary: (Answer: "$${preferences.minSalary * 2000}-${preferences.maxSalary * 2000} per year" or "Negotiable based on total compensation")
5. Are you willing to relocate? (Answer: "Yes, open to relocation" or "Prefer remote work")

IMPORTANT: Return ONLY valid JSON, no other text. Format:
{
  "answers": [
    "answer to question 1",
    "answer to question 2", 
    "answer to question 3",
    "answer to question 4",
    "answer to question 5"
  ]
}`
          }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text;
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        setFormQuestions(prev => prev.map((q, idx) => ({
          ...q,
          answer: parsed.answers[idx] || ''
        })));
      }
    } catch (error) {
      console.error('Error generating answers:', error);
      alert('Failed to generate answers. Please try again.');
    } finally {
      setGeneratingAnswers(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSalary = filterSalary === 'all' || 
                         (filterSalary === 'high' && job.matched >= 80) ||
                         (filterSalary === 'medium' && job.matched >= 60 && job.matched < 80) ||
                         (filterSalary === 'low' && job.matched < 60);
    return matchesSalary;
  });

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Loading Remote Dollars...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  const ApplicationCard = ({ app, updateApplicationStatus }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [newNote, setNewNote] = useState('');

    const statusColors = {
      pending: { bg: '#fef3c7', text: '#92400e', icon: Clock },
      viewed: { bg: '#dbeafe', text: '#1e40af', icon: CheckCircle },
      interview: { bg: '#d1fae5', text: '#065f46', icon: Calendar },
      rejected: { bg: '#fee2e2', text: '#991b1b', icon: Briefcase },
      offer: { bg: '#dcfce7', text: '#166534', icon: CheckCircle }
    };

    const currentStatus = statusColors[app.status] || statusColors.pending;
    const StatusIcon = currentStatus.icon;

    return (
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        background: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#111827' }}>{app.jobTitle}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>{app.company}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Applied: {app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleDateString() : 'Recently'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={app.status || 'pending'}
              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
              style={{
                padding: '6px 12px',
                background: currentStatus.bg,
                color: currentStatus.text,
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="pending">📋 Pending</option>
              <option value="viewed">👀 Viewed</option>
              <option value="interview">📅 Interview</option>
              <option value="offer">🎉 Offer</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            {showNotes ? '▼' : '▶'} Notes ({app.notes?.length || 0})
          </button>
        </div>

        {showNotes && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            {app.notes && app.notes.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {app.notes.map((note, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', fontSize: '13px', color: '#4b5563' }}>
                    <p style={{ margin: 0 }}>{note.text}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                      {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleString() : 'Recently'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={async () => {
                  const success = await addApplicationNote(app.id, newNote);
                  if (success) setNewNote('');
                }}
                style={{
                  padding: '6px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <div style={{ flex: 1 }}>
            <p className="alert-title">Auto-Apply Active</p>
            <p className="alert-text">
              AI is applying to matching jobs... ({autoApplyProgress.current} of {autoApplyProgress.total})
            </p>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                width: `${(autoApplyProgress.current / autoApplyProgress.total) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
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
            <TrendingUp size={16} /> Your applications
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Application Tracker</h2>
        </div>
        
        {applications.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
            No applications yet. Start applying to jobs!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {applications.slice(0, 5).map((app, idx) => (
              <ApplicationCard key={idx} app={app} updateApplicationStatus={updateApplicationStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const JobsViewContent = ({ 
    totalJobs, 
    searchTerm, 
    setSearchTerm,
    locationFilter, 
    setLocationFilter,
    locationTypeFilter, 
    setLocationTypeFilter,
    filterSalary,
    setFilterSalary,
    loadJobs,
    loadingJobs,
    currentPage,
    filteredJobs,
    applyToJob,
    hasMoreJobs,
    loadMoreJobs
  }) => {
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const [localLocation, setLocalLocation] = useState(locationFilter);

    return (
      <div>
        <div className="header">
          <h1>Available Jobs</h1>
          <p className="subtitle">
            {totalJobs > 0 
              ? `Browse ${totalJobs.toLocaleString()}+ opportunities worldwide` 
              : 'Browse opportunities worldwide'}
          </p>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={toggleAutoApply}
            disabled={loadingJobs}
            className={`auto-apply-btn ${isAutoApplying ? 'paused' : 'active'}`}
            style={{ margin: 0 }}
          >
            {isAutoApplying ? <Pause size={20} /> : <Zap size={20} />}
            {isAutoApplying ? 'Stop Auto-Apply' : 'Auto-Apply to All Visible Jobs'}
          </button>
          
          {!isAutoApplying && filteredJobs.length > 0 && (
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Will apply to {filteredJobs.filter(j => !j.applied && j.matched >= 60).length} eligible jobs (60%+ match)
            </p>
          )}
        </div>

        {isAutoApplying && (
          <div className="alert" style={{ marginBottom: '20px' }}>
            <div className="spinner"></div>
            <div style={{ flex: 1 }}>
              <p className="alert-title">Auto-Apply in Progress</p>
              <p className="alert-text">
                Applying to job {autoApplyProgress.current} of {autoApplyProgress.total}
              </p>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                marginTop: '8px',


overflow: 'hidden'
}}>
<div
  style={{
    height: '100%',
    background: 'linear-gradient(to right, #10b981, #059669)',
    width: `${(autoApplyProgress.current / autoApplyProgress.total) * 100}%`,
    transition: 'width 0.3s ease',
  }}
/>

</div>
<p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
Please don't close this page. Applications are being submitted every 2 seconds.
</p>
</div>
</div>
)}
<div className="card search-bar">
      <div className="search-flex">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search: 'JP Morgan', 'software engineer'..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setSearchTerm(localSearch);
                loadJobs(1);
              }
            }}
            className="search-input"
          />
        </div>
        
        <input
          type="text"
          placeholder="Location: 'New York', 'Mumbai'..."
          value={localLocation}
          onChange={(e) => setLocalLocation(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              setLocationFilter(localLocation);
              loadJobs(1);
            }
          }}
          className="search-input"
          style={{ minWidth: '200px' }}
        />
        
        <select
          value={locationTypeFilter}
          onChange={(e) => {
            setLocationTypeFilter(e.target.value);
            setTimeout(() => loadJobs(1), 100);
          }}
          className="select"
        >
          <option value="all">All Types</option>
          <option value="remote">Remote Only</option>
          <option value="onsite">On-site Only</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <select
          value={filterSalary}
          onChange={(e) => setFilterSalary(e.target.value)}
          className="select"
        >
          <option value="all">All Matches</option>
          <option value="high">80%+ Match</option>
          <option value="medium">60-80% Match</option>
          <option value="low">Below 60%</option>
        </select>
        
        <button className="filter-btn" onClick={() => {
          setSearchTerm(localSearch);
          setLocationFilter(localLocation);
          loadJobs(1);
        }}>
          <Filter size={20} />
          Search
        </button>
      </div>
    </div>

    {loadingJobs && currentPage === 1 ? (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>Searching millions of jobs...</p>
      </div>
    ) : filteredJobs.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '16px' }}>
          No jobs found. Try:
        </p>
        <ul style={{ color: '#6b7280', textAlign: 'left', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.8' }}>
          <li>Searching for 'JP Morgan' or 'Goldman Sachs'</li>
          <li>Trying 'software engineer' or 'developer'</li>
          <li>Changing location or job type filters</li>
        </ul>
        <button 
          className="filter-btn" 
          onClick={() => {
            setLocalSearch('');
            setLocalLocation('');
            setSearchTerm('');
            setLocationFilter('');
            setLocationTypeFilter('all');
            loadJobs(1);
          }}
        >
          Clear All Filters
        </button>
      </div>
    ) : (
      <>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px', 
          marginBottom: '16px',
          padding: '0 8px'
        }}>
          Showing <strong>{filteredJobs.length}</strong> of <strong>{totalJobs.toLocaleString()}</strong> jobs
          {searchTerm && ` for "${searchTerm}"`}
          {locationFilter && ` in ${locationFilter}`}
          {locationTypeFilter !== 'all' && ` (${locationTypeFilter})`}
        </p>

        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-content">
                  <div className="job-title-row">
                    <h3>{job.title}</h3>
                    <span className={`match-badge ${job.matched >= 80 ? 'high' : job.matched >= 60 ? 'medium' : 'low'}`}>
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
                    {job.tags && job.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                  <button
                    onClick={() => {
                      setSelectedJobForForm(job);
                      setShowFormFiller(true);
                    }}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(to right, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="9" y1="9" x2="15" y2="9"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    AI Form Fill
                  </button>
                  
                  <button
                    onClick={() => generateCoverLetter(job)}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    Cover Letter
                  </button>
                  
                  <button
                    onClick={() => applyToJob(job)}
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
                  
                  {job.displayURL && (
                    <>
                      <a 
                        href={job.displayURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          padding: '10px 16px',
                          textAlign: 'center',
                          background: job.hasDirectURL ? 'linear-gradient(to right, #10b981, #059669)' : 'white',
                          border: job.hasDirectURL ? 'none' : '2px solid #3b82f6',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: job.hasDirectURL ? 'white' : '#3b82f6',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          if (job.hasDirectURL) {
                            e.target.style.background = 'linear-gradient(to right, #059669, #047857)';
                            e.target.style.transform = 'translateY(-1px)';
                          } else {
                            e.target.style.background = '#3b82f6';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (job.hasDirectURL) {
                            e.target.style.background = 'linear-gradient(to right, #10b981, #059669)';
                            e.target.style.transform = 'translateY(0)';
                          } else {
                            e.target.style.background = 'white';
                            e.target.style.color = '#3b82f6';
                          }
                        }}
                      >
                        {job.hasDirectURL ? (
                          <>
                            <CheckCircle size={16} />
                            Apply Direct
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View Details
                          </>
                        )}
                      </a>
                      
                      <p style={{ 
                        fontSize: '11px', 
                        color: job.hasDirectURL ? '#10b981' : '#9ca3af',
                        textAlign: 'center',
                        margin: '2px 0 0 0',
                        fontWeight: job.hasDirectURL ? '600' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}>
                        {job.hasDirectURL ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Direct Link
                          </>
                        ) : (
                          <>Via Adzuna</>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMoreJobs && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              onClick={loadMoreJobs}
              disabled={loadingJobs}
              style={{
                padding: '14px 32px',
                background: loadingJobs ? '#e5e7eb' : 'linear-gradient(to right, #3b82f6, #9333ea)',
                color: loadingJobs ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loadingJobs ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingJobs ? 'Loading...' : `Load More Jobs`}
            </button>
          </div>
        )}
      </>
    )}
  </div>
);
};
const JobsView = () => {
return (
<JobsViewContent
     totalJobs={totalJobs}
     searchTerm={searchTerm}
     setSearchTerm={setSearchTerm}
     locationFilter={locationFilter}
     setLocationFilter={setLocationFilter}
     locationTypeFilter={locationTypeFilter}
     setLocationTypeFilter={setLocationTypeFilter}
     filterSalary={filterSalary}
     setFilterSalary={setFilterSalary}
     loadJobs={loadJobs}
     loadingJobs={loadingJobs}
     currentPage={currentPage}
     filteredJobs={filteredJobs}
     applyToJob={applyToJob}
     hasMoreJobs={hasMoreJobs}
     loadMoreJobs={loadMoreJobs}
   />
);
};
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
        onChange={(e) => setPreferences({...preferences, minSalary: parseInt(e.target.value) || 0})}
        className="input-full"
      />
    </div>
    <div className="form-group">
      <label>Maximum Hourly Rate ($)</label>
      <input
        type="number"
        value={preferences.maxSalary}
        onChange={(e) => setPreferences({...preferences, maxSalary: parseInt(e.target.value) || 0})}
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
    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
      Add skills to help match you with relevant jobs. Jobs will be filtered based on these skills.
    </p>
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

  <button className="save-btn" onClick={handlePreferencesSave}>Save Preferences & Reload Jobs</button>
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
      <input
        type="text"
        placeholder="John Doe"
        value={profileData.name}
        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
        className="input-full"
      />
    </div>
    <div className="form-group">
      <label>Email</label>
      <input
        type="email"
        placeholder="john@example.com"
        value={profileData.email}
        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
        className="input-full"
      />
    </div>
    <div className="form-group">
      <label>Phone</label>
      <input
        type="tel"
        placeholder="+91 12345 67890"
        value={profileData.phone}
        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
        className="input-full"
      />
    </div>
  </div>

  <div className="card mb-24">
    <h2>Resume</h2>
    <div className="upload-box">
      <div className="upload-icon">
        <Briefcase size={32} color="#3b82f6" />
      </div>
      <div>
        <p className="upload-title">
          {uploadedResume ? `✓ ${uploadedResume.name}` : 'Upload your resume'}
        </p>
        <p className="upload-text">PDF, DOC, or DOCX (Max 5MB)</p>
      </div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="resume-upload"
      />
      <label htmlFor="resume-upload" className="upload-btn">
        {uploadedResume ? 'Change File' : 'Choose File'}
      </label>
    </div>
  </div>

  <button className="save-btn" onClick={handleProfileSave}>Save Changes</button>
</div>
);
const AboutView = () => (
<div>
<div className="header">
<h1>About Remote Dollars</h1>
<p className="subtitle">AI-powered job application automation platform</p>
</div>
<div className="card mb-24">
    <h2>🚀 What We Do</h2>
    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563', marginBottom: '16px' }}>
      Remote Dollars is an intelligent job application platform that helps you find and apply to remote 
      opportunities worldwide. Our AI-powered system matches you with the best jobs based on your skills 
      and preferences, saving you hours of manual searching.
    </p>
  </div>

  <div className="card mb-24">
    <h2>✨ Key Features</h2>
    <div style={{ display: 'grid', gap: '16px' }}>
      {[
        {
          icon: '🎯',
          title: 'Smart Job Matching',
          description: 'Our AI analyzes millions of jobs and shows you positions that match your skills and preferences with a match percentage.'
        },
        {
          icon: '⚡',
          title: 'Auto-Apply Feature',
          description: 'Let AI apply to all matching jobs automatically with one click. Save hours of manual applications. Applies to jobs with 60%+ match.'
        },
        {
          icon: '📝',
          title: 'AI Cover Letter Generator',
          description: 'Generate personalized, professional cover letters for each job in seconds using AI. Edit and customize before applying.'
        },
        {
          icon: '🤖',
          title: 'AI Form Filler',
          description: 'Let AI answer common application questions like "Why do you want to work here?" Save time on repetitive form filling.'
        },
        {
          icon: '📊',
          title: 'Enhanced Application Tracker',
          description: 'Track status (Pending, Viewed, Interview, Offer, Rejected), add notes, and set reminders for each application.'
        },
        {
          icon: '🔗',
          title: 'Direct Company Links',
          description: 'For major companies like Google, Amazon, and JP Morgan, we provide direct links to their career pages for maximum trust.'
        },
        {
          icon: '🌍',
          title: 'Global Opportunities',
          description: 'Access jobs from the US, India, UK, Canada, and more. Filter by location, remote/on-site, and job type.'
        }
      ].map((feature, idx) => (
        <div key={idx} style={{ 
          display: 'flex', 
          gap: '16px', 
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '32px' }}>{feature.icon}</div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111827' }}>{feature.title}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="card mb-24">
    <h2>🎓 How It Works</h2>
    <div style={{ display: 'grid', gap: '20px' }}>
      {[
        { step: '1', title: 'Set Your Preferences', desc: 'Add your skills, salary expectations, and job preferences in the Preferences tab.' },
        { step: '2', title: 'Browse Jobs', desc: 'Our AI scans millions of jobs and shows you the best matches with percentage scores.' },
        { step: '3', title: 'Use AI Tools', desc: 'Generate cover letters and form answers with AI. Click orange/purple buttons on any job.' },
        { step: '4', title: 'Auto-Apply', desc: 'Click "Auto-Apply to All Visible Jobs" and let AI apply to all matching positions (60%+ match) automatically.' },
        { step: '5', title: 'Track Progress', desc: 'Monitor all your applications in the Dashboard with status updates, notes, and analytics.' }
      ].map((item) => (
        <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
          <div style={{
            minWidth: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(to right, #3b82f6, #9333ea)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            {item.step}
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#111827' }}>{item.title}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="card mb-24">
    <h2>💼 Job Sources</h2>
    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563', marginBottom: '16px' }}>
      We aggregate jobs from <strong>Adzuna</strong>, one of the world's largest job search engines with 
      access to millions of positions worldwide. For major companies, we provide direct career page links 
      to ensure authenticity and trust.
    </p>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
      {['Google', 'Amazon', 'Microsoft', 'JP Morgan', 'TCS', 'Infosys', 'Goldman Sachs', '100+ more'].map((company, idx) => (
        <span key={idx} style={{
          padding: '6px 12px',
          background: '#dbeafe',
          color: '#1e40af',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {company}
        </span>
      ))}
    </div>
  </div>

  <div className="card mb-24">
    <h2>🔖 Browser Bookmarklet</h2>
    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563', marginBottom: '16px' }}>
      Save jobs from ANY website (LinkedIn, Indeed, company pages) with one click!
    </p>
    <a 
      href="/bookmarklet.html" 
      target="_blank"
      style={{
        padding: '12px 24px',
        background: 'linear-gradient(to right, #f59e0b, #d97706)',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        display: 'inline-block'
      }}
    >
      🔖 Get Browser Bookmarklet
    </a>
  </div>

  <div className="card">
    <h2>📧 Contact & Support</h2>
    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#4b5563', marginBottom: '16px' }}>
      Have questions or need help? We're here to assist you on your job search journey.
    </p>
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <a href="mailto:support@remotedollars.in" style={{
        padding: '12px 24px',
        background: 'linear-gradient(to right, #3b82f6, #9333ea)',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600'
      }}>
        Email Support
      </a>
    </div>
    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '16px' }}>
      Version 2.0.0 | Built with ❤️ for job seekers worldwide
    </p>
  </div>
</div>
);
const CoverLetterModal = () => {
if (!selectedJobForCoverLetter) return null;
return (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }} onClick={() => setSelectedJobForCoverLetter(null)}>
    <div style={{
      background: 'white',
      borderRadius: '16px',
      maxWidth: '700px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      padding: '32px'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>Cover Letter</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            {selectedJobForCoverLetter.title} at {selectedJobForCoverLetter.company}
          </p>
        </div>
<button
          onClick={() => setSelectedJobForCoverLetter(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '0',
            width: '32px',
            height: '32px'
          }}
        >
          ×
        </button>
      </div>

      {generatingCoverLetter ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Generating your cover letter...</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
            Our AI is crafting a personalized cover letter for you
          </p>
        </div>
      ) : generatedCoverLetter ? (
        <>
          <textarea
            value={generatedCoverLetter}
            onChange={(e) => setGeneratedCoverLetter(e.target.value)}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '20px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCoverLetter);
                alert('Cover letter copied to clipboard!');
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={() => {
                const blob = new Blob([generatedCoverLetter], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cover-letter-${selectedJobForCoverLetter.company}.txt`;
                a.click();
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              💾 Download
            </button>
            <button
              onClick={() => generateCoverLetter(selectedJobForCoverLetter)}
              style={{
                padding: '12px 20px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Regenerate
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#6b7280' }}>Click "Generate" to create your cover letter</p>
          <button
            onClick={() => generateCoverLetter(selectedJobForCoverLetter)}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✨ Generate Cover Letter
          </button>
        </div>
      )}
    </div>
  </div>
);
};
const AIFormFillerModal = () => {
if (!showFormFiller) return null;
return (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }} onClick={() => setShowFormFiller(false)}>
    <div style={{
      background: 'white',
      borderRadius: '16px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      padding: '32px'
    }} onClick={(e) => e.stopPropagation()}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>
            🤖 AI Form Filler
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            {selectedJobForForm ? `${selectedJobForForm.title} at ${selectedJobForForm.company}` : 'Common application questions'}
          </p>
        </div>
        <button
          onClick={() => setShowFormFiller(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '0',
            width: '32px',
            height: '32px'
          }}
        >
          ×
        </button>
      </div>

      {generatingAnswers ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Generating intelligent answers...</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
            Our AI is crafting personalized responses based on your profile
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px', padding: '16px', background: '#dbeafe', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
              💡 <strong>Pro Tip:</strong> Review and edit the AI-generated answers before using them. 
              You can copy-paste these into job application forms.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
            {formQuestions.map((item, idx) => (
              <div key={idx} style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  Question {idx + 1}: {item.question}
                </label>
                <textarea
                  value={item.answer}
                  onChange={(e) => {
                    setFormQuestions(prev => prev.map((q, i) => 
                      i === idx ? { ...q, answer: e.target.value } : q
                    ));
                  }}
                  placeholder="AI will generate answer here..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                {item.answer && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.answer);
                      alert('Answer copied to clipboard!');
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy Answer
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (selectedJobForForm) {
                  generateFormAnswers(selectedJobForForm);
                } else {
                  alert('Please select a job first!');
                }
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(to right, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ✨ Generate All Answers
            </button>
            
            <button
              onClick={() => {
                const allAnswers = formQuestions.map((q, idx) => 
                  `Q${idx + 1}: ${q.question}\nA: ${q.answer}\n`
                ).join('\n');
                navigator.clipboard.writeText(allAnswers);
                alert('All answers copied to clipboard!');
              }}
              style={{
                padding: '14px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copy All
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#fef3c7', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
              ⚠️ <strong>Note:</strong> These AI-generated answers are suggestions. 
              Always review and customize them to match your experience and the specific job requirements.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);
};
const TutorialOverlay = () => {
if (!showTutorial) return null;
const steps = [
  {
    target: 'preferences-tab',
    title: '1️⃣ Start Here: Set Your Preferences',
    description: 'Click on "Preferences" to add your skills, salary range, and job types. This helps us find the perfect jobs for you!',
    position: 'bottom',
    highlight: 'preferences'
  },
  {
    target: 'jobs-tab',
    title: '2️⃣ Browse Matching Jobs',
    description: 'Head to "Jobs" to see thousands of opportunities matched to your skills. Each job shows a match percentage!',
    position: 'bottom',
    highlight: 'jobs'
  },
  {
    target: 'dashboard-tab',
    title: '3️⃣ Track Your Progress',
    description: 'View all your applications, stats, and activity in the Dashboard. Stay organized and never miss an opportunity!',
    position: 'bottom',
    highlight: 'dashboard'
  },
  {
    target: 'profile-tab',
    title: '4️⃣ Upload Your Resume',
    description: 'Go to Profile to upload your resume and complete your information for quick applications.',
    position: 'bottom',
    highlight: 'profile'
  }
];

const currentStep = steps[tutorialStep];

const getArrowStyle = () => {
  const button = document.querySelector(`[data-tutorial="${currentStep.highlight}"]`);
  if (!button) return {};
  
  const rect = button.getBoundingClientRect();
  return {
    position: 'fixed',
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 10}px`,
    transform: 'translateX(-50%)'
  };
};

return (
  <>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9998,
      animation: 'fadeIn 0.3s ease-in'
    }} onClick={() => {
      setShowTutorial(false);
      setTutorialStep(0);
    }} />

    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        50% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
      }
      [data-tutorial="${currentStep.highlight}"] {
        position: relative;
        z-index: 9999;
        box-shadow: 0 0 0 4px #3b82f6, 0 0 0 8px rgba(59, 130, 246, 0.3) !important;
        borderRadius: 8px !important;
        animation: pulse 2s infinite;
      }
    `}</style>

    <div style={{
      ...getArrowStyle(),
      zIndex: 10000,
      animation: 'slideUp 0.4s ease-out'
    }}>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '15px solid transparent',
        borderRight: '15px solid transparent',
        borderBottom: '15px solid white',
        margin: '0 auto 0',
        animation: 'bounce 1.5s ease-in-out infinite'
      }} />
      
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        minWidth: '320px',
        maxWidth: '400px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'start', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}>
            {tutorialStep + 1}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: '#111827',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {currentStep.title}
            </h3>
            <p style={{ 
              margin: 0, 
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {currentStep.description}
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {steps.map((_, idx) => (
            <div key={idx} style={{
              width: idx === tutorialStep ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === tutorialStep ? '#3b82f6' : '#e5e7eb',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {tutorialStep > 0 && (
            <button
              onClick={() => setTutorialStep(tutorialStep - 1)}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 1
              }}
            >
              ← Back
            </button>
          )}
          
          {tutorialStep < steps.length - 1 ? (
            <button
              onClick={() => setTutorialStep(tutorialStep + 1)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 2
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => {
                setShowTutorial(false);
                setTutorialStep(0);
                localStorage.setItem('tutorialCompleted', 'true');
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: 2
              }}
            >
              ✓ Got it!
            </button>
          )}
          
          <button
            onClick={() => {
              setShowTutorial(false);
              setTutorialStep(0);
            }}
            style={{
              padding: '10px',
              background: 'transparent',
              color: '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </>
);
};
return (
<div className="app">
<nav className="navbar">
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
<div className="logo" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
<div className="logo-icon">
<Zap size={24} color="white" />
</div>
<span className="logo-text">Remote Dollars</span>
</div>
<button
        onClick={() => setShowTutorial(true)}
        style={{
          padding: '8px 16px',
          background: '#f3f4f6',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#3b82f6';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f3f4f6';
          e.target.style.color = '#6b7280';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
        Tutorial
      </button>
    </div>
    
    <div className="nav-buttons">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        data-tutorial="dashboard"
      >
        <TrendingUp size={20} />
        Dashboard
      </button>
      <button
        onClick={() => setActiveTab('jobs')}
        className={`nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
        data-tutorial="jobs"
      >
        <Briefcase size={20} />
        Jobs
      </button>
      <button
        onClick={() => setActiveTab('preferences')}
        className={`nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
        data-tutorial="preferences"
      >
        <Settings size={20} />
        Preferences
      </button>
      <button
        onClick={() => setActiveTab('profile')}
        className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
        data-tutorial="profile"
      >
        <User size={20} />
        Profile
      </button>
      <button
        onClick={() => setActiveTab('about')}
        className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        About
      </button>
      <button
        onClick={handleLogout}
        className="nav-btn"
        style={{ color: '#ef4444' }}
      >
        <LogOut size={20} />
        Logout
      </button>
    </div>
  </nav>

  <main className="main-content">
    <TutorialOverlay />
    <CoverLetterModal />
    <AIFormFillerModal />
    {activeTab === 'dashboard' && <DashboardView />}
    {activeTab === 'jobs' && <JobsView />}
    {activeTab === 'preferences' && <PreferencesView />}
    {activeTab === 'profile' && <ProfileView />}
    {activeTab === 'about' && <AboutView />}
  </main>
</div>
);
}