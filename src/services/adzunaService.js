// Adzuna API configuration
const ADZUNA_APP_ID = 'aa7f1121';
const ADZUNA_API_KEY = 'ebd2871e8825169a857527583255e2fd';

// Function to determine country based on location filter
const getCountryCode = (locationFilter) => {
  if (!locationFilter) return 'us'; // Default to US
  
  const location = locationFilter.toLowerCase();
  
  // India keywords
  if (location.includes('india') || location.includes('mumbai') || 
      location.includes('bangalore') || location.includes('delhi') || 
      location.includes('hyderabad') || location.includes('pune') ||
      location.includes('chennai') || location.includes('kolkata')) {
    return 'in';
  }
  
  // UK keywords
  if (location.includes('uk') || location.includes('london') || 
      location.includes('manchester') || location.includes('england')) {
    return 'gb';
  }
  
  // Canada keywords
  if (location.includes('canada') || location.includes('toronto') || 
      location.includes('vancouver') || location.includes('montreal')) {
    return 'ca';
  }
  
  // Australia keywords
  if (location.includes('australia') || location.includes('sydney') || 
      location.includes('melbourne')) {
    return 'au';
  }
  
  return 'us'; // Default
};

export const fetchAdzunaJobs = async (filters = {}, page = 1) => {
  try {
    const resultsPerPage = 50;
    
    // Determine country based on location
    const country = getCountryCode(filters.location);
    
    console.log(`🌍 Searching in country: ${country.toUpperCase()}`);
    
    // Build search query
    let searchQuery = filters.searchTerm || 'software engineer developer programmer';
    
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` + 
      `app_id=${ADZUNA_APP_ID}&` +
      `app_key=${ADZUNA_API_KEY}&` +
      `results_per_page=${resultsPerPage}&` +
      `what=${encodeURIComponent(searchQuery)}&` +
      `sort_by=date`;

    console.log('Fetching from Adzuna:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Found ${data.count} total jobs in ${country.toUpperCase()}`);

    if (!data.results || data.results.length === 0) {
      console.warn('No results returned from API');
      return {
        jobs: [],
        total: 0,
        page: 1,
        hasMore: false
      };
    }

    // Transform ALL jobs
    const transformedJobs = data.results.map((job, index) => {
      const isRemote = checkIfRemote(job);
      const isOnsite = checkIfOnsite(job);
      
      return {
        id: job.id || `job-${page}-${index}`,
        title: job.title || 'No Title',
        company: job.company?.display_name || 'Unknown Company',
        location: job.location?.display_name || 'Not specified',
        salary: formatSalary(job.salary_min, job.salary_max, country),
        experience: extractExperience(job.description),
        posted: getTimeAgo(job.created),
        matched: calculateMatch(job, filters, isRemote),
        applied: false,
        tags: extractTags(job, isRemote, isOnsite),
        url: job.redirect_url,
        description: job.description || '',
        category: job.category?.label || 'Other',
        isRemote: isRemote,
        isOnsite: isOnsite,
        locationType: isRemote ? 'remote' : (isOnsite ? 'onsite' : 'hybrid'),
        country: country
      };
    });

    console.log(`✅ Transformed ${transformedJobs.length} jobs`);

    // Apply filters
    let filteredJobs = transformedJobs;

    // Filter by location type (remote/onsite)
    if (filters.locationType && filters.locationType !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.locationType === filters.locationType);
      console.log(`📍 Filtered to ${filteredJobs.length} ${filters.locationType} jobs`);
    }

    // Filter by location (city/state)
    if (filters.location && filters.location.trim()) {
      const locationLower = filters.location.toLowerCase();
      // Don't filter by location if it's a country name (already filtered by API)
      const isCountryName = ['india', 'usa', 'uk', 'canada', 'australia'].some(c => locationLower.includes(c));
      
      if (!isCountryName) {
        filteredJobs = filteredJobs.filter(job => 
          job.location.toLowerCase().includes(locationLower)
        );
      }
    }

    // Sort by match percentage
    filteredJobs.sort((a, b) => b.matched - a.matched);

    return {
      jobs: filteredJobs,
      total: data.count,
      page: page,
      hasMore: data.count > (page * resultsPerPage)
    };
  } catch (error) {
    console.error('❌ Error fetching Adzuna jobs:', error);
    return {
      jobs: [],
      total: 0,
      page: 1,
      hasMore: false
    };
  }
};

// Check if job is remote
const checkIfRemote = (job) => {
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const location = (job.location?.display_name || '').toLowerCase();
  
  return title.includes('remote') || 
         description.includes('remote') || 
         location.includes('remote') ||
         description.includes('work from home') ||
         description.includes('wfh') ||
         title.includes('wfh') ||
         description.includes('work-from-home');
};

// Check if job is onsite
const checkIfOnsite = (job) => {
  const description = (job.description || '').toLowerCase();
  
  return description.includes('on-site') || 
         description.includes('onsite') || 
         description.includes('in-office') ||
         description.includes('office-based') ||
         (!checkIfRemote(job) && !description.includes('hybrid'));
};

const formatSalary = (min, max, country = 'us') => {
  if (!min && !max) return 'Competitive';
  
  // Currency symbols
  const currency = country === 'in' ? '₹' : country === 'gb' ? '£' : '$';
  
  if (min && max) {
    if (country === 'in') {
      // Convert to lakhs for India
      const minL = Math.round(min / 100000);
      const maxL = Math.round(max / 100000);
      return `${currency}${minL}L-${maxL}L/yr`;
    } else {
      const minK = Math.round(min / 1000);
      const maxK = Math.round(max / 1000);
      return `${currency}${minK}k-${maxK}k/yr`;
    }
  } else if (min) {
    if (country === 'in') {
      return `${currency}${Math.round(min / 100000)}L+/yr`;
    }
    return `${currency}${Math.round(min / 1000)}k+/yr`;
  } else {
    if (country === 'in') {
      return `Up to ${currency}${Math.round(max / 100000)}L/yr`;
    }
    return `Up to ${currency}${Math.round(max / 1000)}k/yr`;
  }
};

const extractExperience = (description) => {
  if (!description) return 'Not specified';
  
  const desc = description.toLowerCase();
  
  if (desc.includes('senior') || desc.includes('lead') || desc.includes('principal') || desc.includes('staff')) {
    return '5+ years';
  } else if (desc.includes('mid-level') || desc.includes('intermediate') || desc.includes('mid level')) {
    return '3-5 years';
  } else if (desc.includes('junior') || desc.includes('entry') || desc.includes('graduate') || desc.includes('fresher')) {
    return '0-2 years';
  }
  
  return 'Not specified';
};

const extractTags = (job, isRemote, isOnsite) => {
  const tags = [];
  
  // Add location type tag
  if (isRemote) {
    tags.push('Remote');
  } else if (isOnsite) {
    tags.push('On-site');
  } else {
    tags.push('Hybrid');
  }
  
  // Add category
  if (job.category?.label) {
    tags.push(job.category.label);
  }
  
  const description = (job.description || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const combined = description + ' ' + title;
  
  // Common tech keywords
  const techKeywords = [
    'react', 'javascript', 'js', 'python', 'java', 'node', 'nodejs', 'aws', 
    'docker', 'kubernetes', 'typescript', 'angular', 'vue',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
    'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go',
    'devops', 'frontend', 'backend', 'fullstack', 'full stack', 'full-stack'
  ];
  
  techKeywords.forEach(keyword => {
    if (combined.includes(keyword)) {
      let displayName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (keyword === 'nodejs' || keyword === 'node') displayName = 'Node.js';
      if (keyword === 'js') displayName = 'JavaScript';
      if (keyword === 'fullstack' || keyword === 'full stack' || keyword === 'full-stack') displayName = 'Full Stack';
      
      if (!tags.includes(displayName)) {
        tags.push(displayName);
      }
    }
  });
  
  return [...new Set(tags)].slice(0, 8);
};

const calculateMatch = (job, filters, isRemote) => {
  let matchScore = 50;
  
  // Boost for remote if user prefers remote
  if (isRemote && (!filters.locationType || filters.locationType === 'remote')) {
    matchScore = 75;
  }
  
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const company = (job.company?.display_name || '').toLowerCase();
  const combined = description + ' ' + title + ' ' + company;
  
  // Match based on user skills
  if (filters.skills && filters.skills.length > 0) {
    const matchingSkills = filters.skills.filter(skill => {
      const skillLower = skill.toLowerCase();
      return combined.includes(skillLower);
    });
    
    const skillMatchPercentage = (matchingSkills.length / filters.skills.length) * 25;
    matchScore += skillMatchPercentage;
  }
  
  // Boost for major companies
  const majorCompanies = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'facebook', 
                          'jpmorgan', 'goldman', 'morgan stanley', 'netflix', 'uber',
                          'tcs', 'infosys', 'wipro', 'cognizant', 'hcl'];
  
  if (majorCompanies.some(comp => company.includes(comp))) {
    matchScore += 10;
  }
  
  return Math.min(Math.round(matchScore), 100);
};

const getTimeAgo = (isoDate) => {
  if (!isoDate) return 'Recently';
  
  try {
    const now = new Date();
    const posted = new Date(isoDate);
    const diffMs = now - posted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch (error) {
    return 'Recently';
  }
};