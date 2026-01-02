import { fetchAdzunaJobs } from './adzunaService';

// Function to try to find direct company URL
const extractDirectURL = (job) => {
  const company = (job.company || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  // Map of major companies to their career pages
  const companyCareerPages = {
    // Tech Giants
    'google': 'https://careers.google.com',
    'alphabet': 'https://careers.google.com',
    'amazon': 'https://www.amazon.jobs',
    'microsoft': 'https://careers.microsoft.com',
    'apple': 'https://jobs.apple.com',
    'meta': 'https://www.metacareers.com',
    'facebook': 'https://www.metacareers.com',
    'netflix': 'https://jobs.netflix.com',
    'uber': 'https://www.uber.com/careers',
    'lyft': 'https://www.lyft.com/careers',
    'airbnb': 'https://careers.airbnb.com',
    'tesla': 'https://www.tesla.com/careers',
    'spacex': 'https://www.spacex.com/careers',
    'nvidia': 'https://www.nvidia.com/en-us/about-nvidia/careers',
    'intel': 'https://jobs.intel.com',
    'amd': 'https://jobs.amd.com',
    'adobe': 'https://adobe.wd5.myworkdayjobs.com/external_experienced',
    'salesforce': 'https://salesforce.wd1.myworkdayjobs.com/External_Career_Site',
    'oracle': 'https://www.oracle.com/corporate/careers',
    'ibm': 'https://www.ibm.com/employment',
    'vmware': 'https://careers.vmware.com',
    'cisco': 'https://jobs.cisco.com',
    'dell': 'https://jobs.dell.com',
    'hp': 'https://jobs.hp.com',
    'lenovo': 'https://jobs.lenovo.com',
    
    // Finance
    'jpmorgan': 'https://careers.jpmorgan.com',
    'jpmorganchase': 'https://careers.jpmorgan.com',
    'goldmansachs': 'https://www.goldmansachs.com/careers',
    'morganstanley': 'https://www.morganstanley.com/careers',
    'bankofamerica': 'https://careers.bankofamerica.com',
    'wellsfargo': 'https://www.wellsfargojobs.com',
    'citigroup': 'https://jobs.citi.com',
    'hsbc': 'https://www.hsbc.com/careers',
    'barclays': 'https://joinus.barclays',
    'deutschebank': 'https://careers.db.com',
    'creditsuisse': 'https://www.credit-suisse.com/careers',
    'ubs': 'https://www.ubs.com/careers',
    'blackrock': 'https://careers.blackrock.com',
    'visa': 'https://usa.visa.com/careers.html',
    'mastercard': 'https://careers.mastercard.com',
    'paypal': 'https://jobsearch.paypal-corp.com',
    'stripe': 'https://stripe.com/jobs',
    'square': 'https://careers.squareup.com',
    
    // Indian IT Companies
    'tcs': 'https://www.tcs.com/careers',
    'tataConsultancy': 'https://www.tcs.com/careers',
    'infosys': 'https://www.infosys.com/careers',
    'wipro': 'https://careers.wipro.com',
    'hcl': 'https://www.hcltech.com/careers',
    'hcltech': 'https://www.hcltech.com/careers',
    'techMahindra': 'https://www.techmahindra.com/careers',
    'cognizant': 'https://careers.cognizant.com',
    'ltimindtree': 'https://www.ltimindtree.com/careers',
    'mindtree': 'https://www.ltimindtree.com/careers',
    
    // Consulting
    'mckinsey': 'https://www.mckinsey.com/careers',
    'bain': 'https://www.bain.com/careers',
    'bcg': 'https://careers.bcg.com',
    'deloitte': 'https://www2.deloitte.com/us/en/pages/careers/topics/careers.html',
    'pwc': 'https://www.pwc.com/us/en/careers.html',
    'ey': 'https://www.ey.com/en_us/careers',
    'kpmg': 'https://home.kpmg/xx/en/home/careers.html',
    'accenture': 'https://www.accenture.com/us-en/careers',
    
    // E-commerce & Retail
    'walmart': 'https://careers.walmart.com',
    'target': 'https://corporate.target.com/careers',
    'ebay': 'https://careers.ebayinc.com',
    'shopify': 'https://www.shopify.com/careers',
    'alibaba': 'https://careers.alibaba.com',
    
    // Social Media & Entertainment
    'twitter': 'https://careers.twitter.com',
    'x': 'https://careers.twitter.com',
    'linkedin': 'https://careers.linkedin.com',
    'snapchat': 'https://careers.snap.com',
    'snap': 'https://careers.snap.com',
    'tiktok': 'https://careers.tiktok.com',
    'bytedance': 'https://jobs.bytedance.com',
    'spotify': 'https://www.lifeatspotify.com',
    'twitch': 'https://www.twitch.tv/jobs',
    'reddit': 'https://www.redditinc.com/careers',
    'pinterest': 'https://www.pinterestcareers.com',
    
    // Gaming
    'ea': 'https://www.ea.com/careers',
    'electronicarts': 'https://www.ea.com/careers',
    'activision': 'https://careers.activisionblizzard.com',
    'blizzard': 'https://careers.activisionblizzard.com',
    'riotgames': 'https://www.riotgames.com/en/work-with-us',
    'epicgames': 'https://www.epicgames.com/site/en-US/careers',
    'valve': 'https://www.valvesoftware.com/en/jobs',
    'unity': 'https://careers.unity.com',
    
    // Cloud & Infrastructure
    'digitalocean': 'https://www.digitalocean.com/careers',
    'linode': 'https://www.linode.com/company/careers',
    'cloudflare': 'https://www.cloudflare.com/careers',
    'mongodb': 'https://www.mongodb.com/careers',
    'redis': 'https://redis.com/company/careers',
    'elastic': 'https://www.elastic.co/about/careers',
    'databricks': 'https://databricks.com/company/careers',
    'snowflake': 'https://careers.snowflake.com',
    
    // Other Tech
    'slack': 'https://slack.com/careers',
    'zoom': 'https://careers.zoom.us',
    'atlassian': 'https://www.atlassian.com/company/careers',
    'gitlab': 'https://about.gitlab.com/jobs',
    'github': 'https://github.com/about/careers',
    'dropbox': 'https://www.dropbox.com/jobs',
    'box': 'https://www.box.com/careers',
    'asana': 'https://asana.com/jobs',
    'notion': 'https://www.notion.so/careers',
    'figma': 'https://www.figma.com/careers',
    'canva': 'https://www.canva.com/careers',
    
    // Automotive
    'ford': 'https://corporate.ford.com/careers.html',
    'gm': 'https://search-careers.gm.com',
    'generalmotors': 'https://search-careers.gm.com',
    'toyota': 'https://www.toyota.com/usa/operations/map/careers',
    'bmw': 'https://www.bmwgroup.jobs',
    'volkswagen': 'https://www.volkswagenag.com/en/careers.html',
    'mercedes': 'https://www.mercedes-benz.com/en/careers',
    'audi': 'https://www.audi.com/en/company/careers.html',
    
    // Healthcare & Pharma
    'pfizer': 'https://www.pfizer.com/careers',
    'moderna': 'https://modernatx.com/careers',
    'jnj': 'https://jobs.jnj.com',
    'johnson': 'https://jobs.jnj.com',
    'abbvie': 'https://careers.abbvie.com',
    'merck': 'https://jobs.merck.com',
    'novartis': 'https://www.novartis.com/careers',
    'roche': 'https://careers.roche.com',
    
    // Telecommunications
    'att': 'https://www.att.jobs',
    'verizon': 'https://www.verizon.com/about/careers',
    'tmobile': 'https://www.t-mobile.com/careers',
    'sprint': 'https://www.t-mobile.com/careers',
    'vodafone': 'https://careers.vodafone.com',
    'orange': 'https://jobs.orange.com',
    
    // Food & Beverage
    'mcdonalds': 'https://careers.mcdonalds.com',
    'starbucks': 'https://www.starbucks.com/careers',
    'cocacola': 'https://www.coca-colacompany.com/careers',
    'pepsi': 'https://www.pepsicojobs.com',
    'pepsico': 'https://www.pepsicojobs.com',
    'nestle': 'https://www.nestle.com/jobs',
    'unilever': 'https://careers.unilever.com',
    
    // Aerospace & Defense
    'boeing': 'https://jobs.boeing.com',
    'lockheedmartin': 'https://www.lockheedmartinjobs.com',
    'northropgrumman': 'https://www.northropgrumman.com/careers',
    'raytheon': 'https://jobs.rtx.com',
    'gd': 'https://gdcareers.com',
    
    // Energy
    'shell': 'https://www.shell.com/careers.html',
    'bp': 'https://www.bp.com/en/global/corporate/careers.html',
    'exxon': 'https://corporate.exxonmobil.com/careers',
    'chevron': 'https://www.chevron.com/careers',
    'total': 'https://www.totalenergies.com/careers'
  };
  
  // Check if we have a direct career page
  for (const [key, url] of Object.entries(companyCareerPages)) {
    if (company.includes(key)) {
      return {
        hasDirectURL: true,
        directURL: url,
        source: 'Company Career Page'
      };
    }
  }
  
  return {
    hasDirectURL: false,
    directURL: null,
    source: 'Adzuna'
  };
};

export const fetchJobsWithDirectLinks = async (filters = {}, page = 1) => {
  const result = await fetchAdzunaJobs(filters, page);
  
  // Enhance jobs with direct URLs where possible
  const enhancedJobs = result.jobs.map(job => {
    const directInfo = extractDirectURL(job);
    return {
      ...job,
      ...directInfo,
      displayURL: directInfo.hasDirectURL ? directInfo.directURL : job.url
    };
  });
  
  // Log how many direct links we found
  const directCount = enhancedJobs.filter(j => j.hasDirectURL).length;
  console.log(`✅ Enhanced ${enhancedJobs.length} jobs (${directCount} with direct links)`);
  
  return {
    ...result,
    jobs: enhancedJobs
  };
};