

const COMPANIES = [
  { id: 'c1', name: 'Tata Consultancy Services', logo: 'TCS', industry: 'IT Services' },
  { id: 'c2', name: 'Infosys', logo: 'INF', industry: 'IT Services' },
  { id: 'c3', name: 'Wipro', logo: 'WPR', industry: 'IT Services' },
  { id: 'c4', name: 'Reliance Industries', logo: 'RIL', industry: 'Conglomerate' },
  { id: 'c5', name: 'Flipkart', logo: 'FLK', industry: 'E-Commerce' },
  { id: 'c6', name: 'Swiggy', logo: 'SWG', industry: 'Food Tech' },
  { id: 'c7', name: 'Zomato', logo: 'ZMT', industry: 'Food Tech' },
  { id: 'c8', name: 'Paytm', logo: 'PYT', industry: 'FinTech' },
  { id: 'c9', name: 'PhonePe', logo: 'PHP', industry: 'FinTech' },
  { id: 'c10', name: 'Razorpay', logo: 'RZP', industry: 'FinTech' },
  { id: 'c11', name: 'Meesho', logo: 'MSH', industry: 'E-Commerce' },
  { id: 'c12', name: 'Dream11', logo: 'DRM', industry: 'Gaming' },
  { id: 'c13', name: 'Cred', logo: 'CRD', industry: 'FinTech' },
  { id: 'c14', name: 'Groww', logo: 'GRW', industry: 'FinTech' },
  { id: 'c15', name: 'Upstox', logo: 'UPS', industry: 'FinTech' },
  { id: 'c16', name: 'Zepto', logo: 'ZPT', industry: 'Quick Commerce' },
  { id: 'c17', name: 'Blinkit', logo: 'BLK', industry: 'Quick Commerce' },
  { id: 'c18', name: 'BigBasket', logo: 'BBK', industry: 'Grocery' },
  { id: 'c19', name: 'Freshworks', logo: 'FRS', industry: 'SaaS' },
  { id: 'c20', name: 'Zoho', logo: 'ZHO', industry: 'SaaS' },
  { id: 'c21', name: 'HDFC Bank', logo: 'HDF', industry: 'Banking' },
  { id: 'c22', name: 'ICICI Bank', logo: 'ICI', industry: 'Banking' },
  { id: 'c23', name: 'Axis Bank', logo: 'AXB', industry: 'Banking' },
  { id: 'c24', name: 'Accenture', logo: 'ACC', industry: 'Consulting' },
  { id: 'c25', name: 'Deloitte', logo: 'DEL', industry: 'Consulting' },
  { id: 'c26', name: 'PwC', logo: 'PWC', industry: 'Consulting' },
  { id: 'c27', name: 'EY', logo: 'EY', industry: 'Consulting' },
  { id: 'c28', name: 'KPMG', logo: 'KPM', industry: 'Consulting' },
  { id: 'c29', name: 'Microsoft India', logo: 'MSF', industry: 'Technology' },
  { id: 'c30', name: 'Google India', logo: 'GGL', industry: 'Technology' },
  { id: 'c31', name: 'Amazon India', logo: 'AMZ', industry: 'E-Commerce' },
  { id: 'c32', name: 'Meta India', logo: 'MTA', industry: 'Technology' },
  { id: 'c33', name: 'Apple India', logo: 'APL', industry: 'Technology' },
  { id: 'c34', name: 'Netflix India', logo: 'NFX', industry: 'Entertainment' },
  { id: 'c35', name: 'Hotstar', logo: 'HST', industry: 'Entertainment' },
  { id: 'c36', name: "BYJU's", logo: 'BYJ', industry: 'EdTech' },
  { id: 'c37', name: 'Unacademy', logo: 'UNC', industry: 'EdTech' },
  { id: 'c38', name: 'UpGrad', logo: 'UPG', industry: 'EdTech' },
  { id: 'c39', name: 'Cult.fit', logo: 'CLT', industry: 'Fitness' },
  { id: 'c40', name: 'Nykaa', logo: 'NYK', industry: 'Beauty' },
];

const JOB_TEMPLATES = [
  { title: 'Senior React Developer', dept: 'engineering', skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'JavaScript'], expMin: 4, expMax: 8, salaryMin: 12, salaryMax: 22 },
  { title: 'Full Stack Developer', dept: 'engineering', skills: ['Node.js', 'React', 'MongoDB', 'Express', 'TypeScript'], expMin: 2, expMax: 6, salaryMin: 8, salaryMax: 18 },
  { title: 'Backend Engineer - Node.js', dept: 'engineering', skills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'AWS'], expMin: 3, expMax: 7, salaryMin: 10, salaryMax: 20 },
  { title: 'Python Developer', dept: 'engineering', skills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'Celery'], expMin: 2, expMax: 5, salaryMin: 7, salaryMax: 15 },
  { title: 'Data Scientist', dept: 'data', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas'], expMin: 2, expMax: 6, salaryMin: 10, salaryMax: 25 },
  { title: 'Machine Learning Engineer', dept: 'data', skills: ['Python', 'PyTorch', 'TensorFlow', 'ML Ops', 'Docker'], expMin: 3, expMax: 7, salaryMin: 12, salaryMax: 28 },
  { title: 'DevOps Engineer', dept: 'engineering', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'], expMin: 3, expMax: 8, salaryMin: 10, salaryMax: 22 },
  { title: 'Cloud Architect - AWS', dept: 'engineering', skills: ['AWS', 'Kubernetes', 'Terraform', 'Python', 'Architecture'], expMin: 6, expMax: 12, salaryMin: 18, salaryMax: 35 },
  { title: 'Frontend Engineer', dept: 'engineering', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL'], expMin: 1, expMax: 4, salaryMin: 6, salaryMax: 14 },
  { title: 'UI/UX Designer', dept: 'design', skills: ['Figma', 'UI/UX Design', 'Prototyping', 'User Research', 'Design Systems'], expMin: 2, expMax: 6, salaryMin: 7, salaryMax: 18 },
  { title: 'Product Manager', dept: 'product', skills: ['Product Management', 'Agile', 'Scrum', 'Analytics', 'SQL'], expMin: 3, expMax: 7, salaryMin: 12, salaryMax: 28 },
  { title: 'Associate Product Manager', dept: 'product', skills: ['Product Management', 'Analytics', 'SQL', 'Agile', 'Communication'], expMin: 1, expMax: 3, salaryMin: 7, salaryMax: 14 },
  { title: 'QA Automation Engineer', dept: 'engineering', skills: ['Selenium', 'Python', 'Jest', 'CI/CD', 'API Testing'], expMin: 2, expMax: 5, salaryMin: 6, salaryMax: 14 },
  { title: 'Database Administrator', dept: 'engineering', skills: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Backup & Recovery'], expMin: 3, expMax: 8, salaryMin: 9, salaryMax: 18 },
  { title: 'Marketing Manager', dept: 'marketing', skills: ['Digital Marketing', 'SEO', 'Analytics', 'Content Strategy', 'Social Media'], expMin: 3, expMax: 7, salaryMin: 8, salaryMax: 18 },
  { title: 'Sales Executive', dept: 'sales', skills: ['Sales', 'CRM', 'B2B', 'Negotiation', 'Lead Generation'], expMin: 0, expMax: 3, salaryMin: 4, salaryMax: 10 },
  { title: 'Business Analyst', dept: 'operations', skills: ['Business Analysis', 'SQL', 'Excel', 'Tableau', 'Requirements Gathering'], expMin: 1, expMax: 4, salaryMin: 5, salaryMax: 12 },
  { title: 'HR Recruiter', dept: 'hr', skills: ['Recruiting', 'ATS', 'Interviews', 'Sourcing', 'Employee Relations'], expMin: 1, expMax: 5, salaryMin: 4, salaryMax: 10 },
  { title: 'Financial Analyst', dept: 'finance', skills: ['Excel', 'Financial Modeling', 'SQL', 'Power BI', 'Forecasting'], expMin: 1, expMax: 4, salaryMin: 5, salaryMax: 12 },
  { title: 'Customer Support Specialist', dept: 'customer_support', skills: ['Customer Service', 'Communication', 'CRM', 'Troubleshooting', 'Zendesk'], expMin: 0, expMax: 2, salaryMin: 3, salaryMax: 7 },
  { title: 'Content Writer', dept: 'marketing', skills: ['Content Writing', 'SEO', 'Copywriting', 'Blogging', 'Social Media'], expMin: 0, expMax: 3, salaryMin: 3, salaryMax: 8 },
  { title: 'Data Analyst', dept: 'data', skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics'], expMin: 1, expMax: 4, salaryMin: 5, salaryMax: 12 },
  { title: 'Android Developer', dept: 'engineering', skills: ['Kotlin', 'Android', 'Firebase', 'Retrofit', 'Room'], expMin: 2, expMax: 6, salaryMin: 7, salaryMax: 16 },
  { title: 'iOS Developer', dept: 'engineering', skills: ['Swift', 'iOS', 'Objective-C', 'Core Data', 'UIKit'], expMin: 2, expMax: 6, salaryMin: 8, salaryMax: 18 },
  { title: 'React Native Developer', dept: 'engineering', skills: ['React Native', 'TypeScript', 'Redux', 'Expo', 'Firebase'], expMin: 2, expMax: 5, salaryMin: 7, salaryMax: 15 },
  { title: 'SRE - Site Reliability Engineer', dept: 'engineering', skills: ['AWS', 'GCP', 'Prometheus', 'Grafana', 'Kubernetes'], expMin: 3, expMax: 8, salaryMin: 12, salaryMax: 25 },
  { title: 'Security Engineer', dept: 'engineering', skills: ['OWASP', 'Penetration Testing', 'Python', 'Network Security', 'SIEM'], expMin: 3, expMax: 7, salaryMin: 12, salaryMax: 26 },
  { title: 'Go Developer', dept: 'engineering', skills: ['Go', 'Microservices', 'gRPC', 'Docker', 'PostgreSQL'], expMin: 2, expMax: 6, salaryMin: 10, salaryMax: 22 },
  { title: 'Rust Engineer', dept: 'engineering', skills: ['Rust', 'Systems Programming', 'Tokio', 'C++', 'Linux'], expMin: 3, expMax: 7, salaryMin: 14, salaryMax: 30 },
  { title: 'Legal Counsel', dept: 'legal', skills: ['Contract Law', 'Compliance', 'Legal Research', 'Litigation', 'Corporate Law'], expMin: 3, expMax: 8, salaryMin: 10, salaryMax: 25 },
];

const CITIES = ['Mumbai', 'Bangalore', 'Pune', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Remote', 'Hybrid'];

const JOB_WORK_MODES = ['remote', 'hybrid', 'onsite'];
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickRandom(arr, seed = Date.now()) {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function generateJobs() {
  const jobs = [];
  let idCounter = 1;
  for (let i = 0; i < 55; i++) {
    const template = pickRandom(JOB_TEMPLATES, i * 17 + 3);
    const company = pickRandom(COMPANIES, i * 7 + 11);
    const city = pickRandom(CITIES, i * 3 + 5);
    const workMode = pickRandom(JOB_WORK_MODES, i * 5 + 1);
    const jobType = pickRandom(JOB_TYPES, i * 11 + 19);
    const salaryAdjust = jobType === 'internship' ? 0.4 : jobType === 'contract' ? 1.15 : 1;
    const daysAgo = Math.floor(seededRandom(i * 9 + 7) * 60);
    const views = Math.floor(seededRandom(i * 13 + 3) * 5000) + 100;
    const applicants = Math.floor(seededRandom(i * 19 + 29) * 200) + 5;
    const jobId = 'job_' + (1000 + idCounter++);
    const minExpBonus = Math.floor(seededRandom(i * 23) * 2);
    const maxExpBonus = Math.floor(seededRandom(i * 29) * 3);
    jobs.push({
      id: jobId,
      title: template.title,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo,
      companyIndustry: company.industry,
      location: city,
      workMode,
      type: jobType === 'internship' ? 'internship' : Math.random() > 0.85 ? jobType : 'full-time',
      department: template.dept,
      salaryMin: Math.round(template.salaryMin * salaryAdjust),
      salaryMax: Math.round(template.salaryMax * salaryAdjust),
      experienceMin: Math.max(0, template.expMin + minExpBonus - 1),
      experienceMax: template.expMax + maxExpBonus,
      skills: template.skills,
      description: `We are hiring a ${template.title} to join our ${template.dept} team in ${city}. You will be responsible for building high-quality, scalable applications and working with cross-functional teams. This is an excellent opportunity to work with cutting-edge technology at ${company.name}.`,
      responsibilities: [
        `Design and develop features for our core product using ${template.skills.slice(0, 3).join(', ')}`,
        'Collaborate with product managers, designers, and other engineers to ship great features',
        'Write clean, maintainable code with proper test coverage',
        'Participate in code reviews and mentor junior developers',
        'Troubleshoot and debug production issues',
      ],
      requirements: [
        `${template.expMin} to ${template.expMax} years of experience as a ${template.title}`,
        `Strong proficiency in ${template.skills.slice(0, Math.min(4, template.skills.length)).join(', ')}`,
        'Excellent problem-solving skills and attention to detail',
        'Good communication skills and ability to work in a team',
        `Bachelor's degree in Engineering or related field (preferred)`,
      ],
      benefits: [
        'Competitive salary with performance bonuses',
        'Comprehensive health insurance for you and your family',
        'Flexible work hours and remote-first culture',
        'Unlimited learning budget for courses and conferences',
        '25 days paid leave + 10 public holidays',
        'Employee stock options',
        'Free meals and snacks at office',
        'Wellness programs and gym membership',
      ],
      postedBy: 'rec_' + (Math.floor(seededRandom(i * 31) * 10) + 1),
      postedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      isActive: seededRandom(i * 2 + 1) > 0.12,
      isFeatured: seededRandom(i * 37) > 0.7,
      views,
      applicants,
      questions: [
        'How many years of experience do you have with React?',
        'What is your notice period?',
        'What is your current CTC?',
      ],
    });
  }
  return jobs;
}

const CANDIDATE_FIRST_NAMES = [
  'Rahul', 'Amit', 'Priya', 'Sneha', 'Vikram', 'Neha', 'Rohit', 'Anjali',
  'Kunal', 'Shreya', 'Aditya', 'Pooja', 'Rohan', 'Divya', 'Arjun', 'Nisha',
  'Karan', 'Tanya', 'Siddharth', 'Aishwarya', 'Manish', 'Kavita', 'Abhishek',
  'Smriti', 'Harsh', 'Ritika', 'Deepak', 'Swati', 'Varun', 'Megha',
];

const CANDIDATE_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Shah',
  'Desai', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Chopra', 'Kapoor', 'Khanna',
  'Malhotra', 'Agarwal', 'Chauhan', 'Yadav', 'Tiwari', 'Pandey', 'Das',
  'Srivastava', 'Bose', 'Banerjee', 'Menon', 'Krishnan', 'Shetty', 'Sinha',
];

const CANDIDATE_COLLEGES = [
  { name: 'Indian Institute of Technology, Bombay', tier: 1 },
  { name: 'Indian Institute of Technology, Delhi', tier: 1 },
  { name: 'Indian Institute of Technology, Madras', tier: 1 },
  { name: 'Indian Institute of Technology, Kanpur', tier: 1 },
  { name: 'Indian Institute of Technology, Kharagpur', tier: 1 },
  { name: 'Birla Institute of Technology and Science, Pilani', tier: 1 },
  { name: 'National Institute of Technology, Trichy', tier: 2 },
  { name: 'National Institute of Technology, Surathkal', tier: 2 },
  { name: 'Vellore Institute of Technology', tier: 2 },
  { name: 'Manipal Institute of Technology', tier: 2 },
  { name: 'Delhi Technological University', tier: 2 },
  { name: 'College of Engineering, Pune', tier: 2 },
  { name: 'Mumbai University', tier: 3 },
  { name: 'Bangalore University', tier: 3 },
  { name: 'Pune University', tier: 3 },
  { name: 'Amity University', tier: 3 },
];

const CANDIDATE_DEGREES = [
  'B.Tech in Computer Science', 'B.E. in Information Technology',
  'B.Tech in Electronics & Communication', 'M.Tech in Computer Science',
  'MCA', 'B.Sc in Computer Science', 'MBA', 'B.Com', 'BBA',
  'M.Sc in Data Science', 'B.Tech in Mechanical', 'B.Tech in Electrical',
];

const CANDIDATE_CITIES = ['Mumbai', 'Bangalore', 'Pune', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

function generateCandidates() {
  const candidates = [];
  for (let i = 0; i < 28; i++) {
    const firstName = CANDIDATE_FIRST_NAMES[i % CANDIDATE_FIRST_NAMES.length];
    const lastName = pickRandom(CANDIDATE_LAST_NAMES, i * 7 + 3);
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 10 ? i : ''}@email.com`;
    const yearsExp = Math.floor(seededRandom(i * 3 + 2) * 13);
    const college = pickRandom(CANDIDATE_COLLEGES, i * 5 + 7);
    const degree = pickRandom(CANDIDATE_DEGREES, i * 11 + 5);
    const city = pickRandom(CANDIDATE_CITIES, i * 4 + 9);
    const gradYear = 2025 - yearsExp - (Math.floor(seededRandom(i * 13) * 3) + 4);
    const skills = [];
    const allSkills = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Django', 'Express', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Redux', 'Next.js', 'CSS3', 'HTML5', 'Tailwind CSS', 'GraphQL', 'REST API', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'NumPy', 'Java', 'Spring Boot', 'Go', 'Rust', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'Figma', 'UI/UX Design', 'Product Management', 'Agile', 'Scrum', 'Excel', 'Tableau', 'Power BI', 'SEO', 'Digital Marketing', 'Sales', 'CRM', 'HR', 'Recruiting'];
    const numSkills = 5 + Math.floor(seededRandom(i * 17) * 8);
    for (let j = 0; j < numSkills; j++) {
      const skill = pickRandom(allSkills, i * 100 + j * 23 + 1);
      if (!skills.includes(skill)) skills.push(skill);
    }
    const avatarColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500', 'bg-cyan-500', 'bg-violet-500'];
    const candidateId = 'cand_' + (2000 + i + 1);
    candidates.push({
      id: candidateId,
      name: fullName,
      email,
      phone: '+91 9' + (Math.floor(seededRandom(i * 19 + 3) * 100000000) + 10000000).toString().padStart(8, '0'),
      avatar: avatarColors[i % avatarColors.length],
      title: yearsExp === 0
        ? 'Fresher'
        : yearsExp < 2
          ? pickRandom(['Junior Developer', 'Software Engineer Trainee', 'Associate Engineer', 'Frontend Developer Trainee'], i * 2)
          : yearsExp < 5
            ? pickRandom(['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Product Analyst'], i * 3)
            : yearsExp < 8
              ? pickRandom(['Senior Software Engineer', 'Senior Frontend Engineer', 'Senior Backend Engineer', 'Tech Lead', 'Product Manager'], i * 4)
              : yearsExp < 12
                ? pickRandom(['Staff Engineer', 'Engineering Manager', 'Principal Engineer', 'Senior Product Manager'], i * 5)
                : pickRandom(['Engineering Director', 'VP of Engineering', 'Principal Architect'], i * 6),
      headline: pickRandom([
        'Passionate about building scalable web applications',
        'Full stack developer | Clean code enthusiast',
        'Building products that users love',
        'Curious engineer solving hard problems',
        'Open source contributor | Tech blogger',
        'Love building great teams and great products',
      ], i * 29 + 1),
      yearsOfExperience: yearsExp,
      currentCompany: i % 5 === 0 ? null : pickRandom(COMPANIES.map(c => c.name), i * 41 + 7),
      currentSalary: yearsExp * 1.8 + Math.floor(seededRandom(i * 37) * 5),
      expectedSalary: yearsExp * 2.2 + Math.floor(seededRandom(i * 43) * 6),
      location: city,
      preferredLocations: [city, pickRandom(CANDIDATE_CITIES.filter(c => c !== city), i * 7 + 11)],
      willingToRelocate: seededRandom(i * 47) > 0.35,
      remote: seededRandom(i * 53) > 0.4,
      education: {
        degree,
        college: college.name,
        collegeTier: college.tier,
        graduationYear: gradYear,
        cgpa: (6.5 + seededRandom(i * 59) * 3.5).toFixed(1),
      },
      skills,
      certifications: seededRandom(i * 61) > 0.4 ? [
        pickRandom(['AWS Certified Solutions Architect', 'Google Cloud Associate', 'Microsoft Azure Fundamentals', 'Certified Kubernetes Administrator', 'Scrum Master Certified', 'MongoDB Certified Developer'], i * 67),
      ] : [],
      projects: [
        {
          name: pickRandom(['E-Commerce Platform', 'Task Management App', 'Social Media Dashboard', 'AI Chatbot', 'Analytics Platform'], i * 71 + 3),
          description: pickRandom(['Built end-to-end with microservices architecture', 'Led frontend development using React and TypeScript', 'Designed and implemented database schema optimized for scale'], i * 73),
          tech: skills.slice(0, Math.min(5, skills.length)),
          link: `https://github.com/${firstName.toLowerCase()}/project-${i + 1}`,
        },
      ],
      experience: yearsExp > 0 ? [
        {
          company: pickRandom(COMPANIES.map(c => c.name), i * 79 + 5),
          title: yearsExp < 2 ? 'Junior Developer' : yearsExp < 5 ? 'Software Engineer' : 'Senior Engineer',
          startDate: new Date(2020 + Math.floor(seededRandom(i * 83) * 3), Math.floor(seededRandom(i * 89) * 12), 1).toISOString(),
          endDate: i % 3 === 0 ? null : new Date(2023 + Math.floor(seededRandom(i * 97) * 2), Math.floor(seededRandom(i * 101) * 12), 1).toISOString(),
          description: pickRandom(['Worked on core product features serving 10M+ users', 'Led team of 5 engineers to deliver projects on time', 'Improved system performance by 40%'], i * 103),
        },
      ] : [],
      languages: ['English', pickRandom(['Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'], i * 107)].filter(Boolean),
      noticePeriod: pickRandom(['Immediate', '15 days', '30 days', '60 days', '90 days'], i * 109),
      resumeUrl: `/resumes/${candidateId}.pdf`,
      score: Math.floor((college.tier === 1 ? 20 : college.tier === 2 ? 14 : 8) + (yearsExp * 3) + (skills.length * 1.2) + (seededRandom(i * 113) * 20)),
      hasWorkAuthorization: true,
      dateOfBirth: new Date(1990 + Math.floor(seededRandom(i * 127) * 15), Math.floor(seededRandom(i * 131) * 12), Math.floor(seededRandom(i * 137) * 27) + 1).toISOString(),
      gender: pickRandom(['Male', 'Female', 'Other'], i * 139),
      createdAt: new Date(Date.now() - Math.floor(seededRandom(i * 149) * 365) * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.floor(seededRandom(i * 151) * 30) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return candidates;
}

function generateApplications(jobs, candidates) {
  const applications = [];
  const statuses = ['applied', 'screening', 'shortlisted', 'interview', 'selected', 'rejected'];
  let idCounter = 1;
  for (let i = 0; i < 180; i++) {
    const job = pickRandom(jobs, i * 17 + 3);
    const candidate = pickRandom(candidates, i * 19 + 7);
    const appliedDaysAgo = Math.floor(seededRandom(i * 23 + 5) * 45) + 1;
    const statusIndex = Math.floor(seededRandom(i * 29) * statuses.length);
    const status = statuses[statusIndex];
    const screeningDate = statusIndex >= 1 ? new Date(Date.now() - (appliedDaysAgo - Math.floor(seededRandom(i * 31) * 5) - 1) * 24 * 60 * 60 * 1000).toISOString() : null;
    const shortlistedDate = statusIndex >= 2 ? new Date(Date.now() - (appliedDaysAgo - Math.floor(seededRandom(i * 37) * 10) - 2) * 24 * 60 * 60 * 1000).toISOString() : null;
    applications.push({
      id: 'app_' + (3000 + idCounter++),
      jobId: job.id,
      jobTitle: job.title,
      jobLocation: job.location,
      jobType: job.type,
      companyId: job.companyId,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateTitle: candidate.title,
      candidateAvatar: candidate.avatar,
      candidateSkills: candidate.skills.slice(0, 6),
      candidateExperience: candidate.yearsOfExperience,
      candidateScore: candidate.score,
      candidateLocation: candidate.location,
      status,
      appliedAt: new Date(Date.now() - appliedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      screeningAt: screeningDate,
      shortlistedAt: shortlistedDate,
      interviewAt: statusIndex >= 3 ? new Date(Date.now() - Math.floor(seededRandom(i * 41) * 15) * 24 * 60 * 60 * 1000).toISOString() : null,
      selectedAt: statusIndex >= 4 ? new Date(Date.now() - Math.floor(seededRandom(i * 43) * 7) * 24 * 60 * 60 * 1000).toISOString() : null,
      rejectedAt: statusIndex === 5 ? new Date(Date.now() - Math.floor(seededRandom(i * 47) * 15) * 24 * 60 * 60 * 1000).toISOString() : null,
      resumeMatchScore: Math.floor(55 + seededRandom(i * 53) * 45),
      skillMatchScore: Math.floor(50 + seededRandom(i * 59) * 50),
      experienceMatch: Math.floor(40 + seededRandom(i * 61) * 60),
      cultureFitScore: Math.floor(50 + seededRandom(i * 67) * 50),
      overallScore: Math.floor(50 + seededRandom(i * 71) * 50),
      answers: [
        { question: 'How many years of experience do you have with React?', answer: `${candidate.yearsOfExperience} years` },
        { question: 'What is your notice period?', answer: candidate.noticePeriod },
        { question: 'What is your current CTC?', answer: `${candidate.currentSalary} LPA` },
      ],
      notes: statusIndex > 0 ? pickRandom([
        'Strong technical background, good communication skills',
        'Excellent fit for the role based on past experience',
        'Relevant project experience, scheduled for tech round',
        'Great cultural fit, recommended for hire',
      ], i * 73) : null,
      reviewedBy: statusIndex > 0 ? 'rec_' + (Math.floor(seededRandom(i * 79) * 10) + 1) : null,
      bookmarked: seededRandom(i * 83) > 0.8,
      flagged: seededRandom(i * 89) > 0.95,
    });
  }
  return applications;
}

function generateInterviews(jobs, candidates, applications) {
  const interviews = [];
  const interviewTypes = ['phone', 'video', 'technical', 'hr', 'final', 'onsite'];
  const statuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
  let idCounter = 1;
  const interviewApps = applications.filter(a => ['interview', 'selected'].includes(a.status));
  for (let i = 0; i < Math.min(45, interviewApps.length * 3); i++) {
    const app = pickRandom(interviewApps, i * 13 + 7);
    const type = pickRandom(interviewTypes, i * 17 + 5);
    const status = pickRandom(statuses, i * 19 + 11);
    const daysFromNow = Math.floor(seededRandom(i * 23) * 30) - 10;
    const startTime = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000 + (9 + Math.floor(seededRandom(i * 29) * 8)) * 60 * 60 * 1000);
    const duration = [30, 45, 60, 90, 120][Math.floor(seededRandom(i * 31) * 5)];
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    interviews.push({
      id: 'int_' + (4000 + idCounter++),
      applicationId: app.id,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      companyLogo: app.companyLogo,
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      candidateAvatar: app.candidateAvatar,
      candidateTitle: app.candidateTitle,
      type,
      status,
      round: type === 'phone' ? 1 : type === 'technical' ? 2 : type === 'hr' ? 3 : type === 'final' ? 4 : 2,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      location: type === 'onsite' ? pickRandom(['Bangalore - Koramangala Office', 'Mumbai - BKC Office', 'Pune - Hinjewadi Office'], i * 37) : null,
      meetingLink: type !== 'onsite' ? `https://meet.google.com/hiremind-${100 + i}` : null,
      interviewer: {
        id: 'rec_' + (Math.floor(seededRandom(i * 41) * 10) + 1),
        name: pickRandom(['Ajay Mehta', 'Sunita Rao', 'Ravi Kapoor', 'Priya Menon', 'Karan Shah', 'Neha Gupta'], i * 43),
        role: pickRandom(['Senior Engineer', 'Engineering Manager', 'HR Business Partner', 'Tech Lead', 'VP Engineering'], i * 47),
        email: `interviewer${i + 1}@hiremind.ai`,
      },
      notes: status === 'completed' ? pickRandom([
        'Candidates demonstrated strong problem-solving skills. Good communication. Recommend moving forward.',
        'Solid technical foundation. Answered 80% of questions correctly. Cultural fit is good.',
        'Average performance. Some gaps in system design knowledge. May need further evaluation.',
        'Excellent interview! Strong across all areas. Highly recommended for offer.',
      ], i * 53) : null,
      rating: status === 'completed' ? Math.floor(2 + seededRandom(i * 59) * 4) : null,
      feedback: status === 'completed' ? {
        technicalSkill: Math.floor(2 + seededRandom(i * 61) * 4),
        communication: Math.floor(2 + seededRandom(i * 67) * 4),
        problemSolving: Math.floor(2 + seededRandom(i * 71) * 4),
        culturalFit: Math.floor(2 + seededRandom(i * 73) * 4),
        overall: Math.floor(2 + seededRandom(i * 79) * 4),
        comments: pickRandom(['Strong fundamentals, would fit well with the team.', 'Needs improvement in system design but great coding skills.', 'Excellent communication and leadership qualities.'], i * 83),
      } : null,
      createdBy: 'rec_' + (Math.floor(seededRandom(i * 89) * 10) + 1),
      createdAt: new Date(Date.now() - Math.floor(seededRandom(i * 97) * 20) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return interviews;
}

const RECRUITER_DASHBOARD_STATS = {
  overview: {
    totalJobs: 42,
    activeJobs: 31,
    totalCandidates: 1247,
    newCandidatesThisWeek: 87,
    totalApplications: 3256,
    applicationsThisWeek: 234,
    interviewsScheduled: 28,
    interviewsThisWeek: 12,
    hiresThisMonth: 7,
    avgTimeToHire: 24,
    avgCostPerHire: 85000,
    offerAcceptanceRate: 82,
  },
  applicationStatusBreakdown: [
    { status: 'applied', count: 1240, color: '#3b82f6' },
    { status: 'screening', count: 678, color: '#eab308' },
    { status: 'shortlisted', count: 412, color: '#a855f7' },
    { status: 'interview', count: 287, color: '#6366f1' },
    { status: 'selected', count: 89, color: '#22c55e' },
    { status: 'rejected', count: 550, color: '#ef4444' },
  ],
  departmentHiring: [
    { department: 'Engineering', openPositions: 18, candidates: 742, hires: 4 },
    { department: 'Product', openPositions: 5, candidates: 186, hires: 1 },
    { department: 'Design', openPositions: 3, candidates: 97, hires: 1 },
    { department: 'Data & Analytics', openPositions: 4, candidates: 128, hires: 1 },
    { department: 'Marketing', openPositions: 2, candidates: 56, hires: 0 },
    { department: 'Sales', openPositions: 6, candidates: 87, hires: 0 },
  ],
  topRecruiters: [
    { id: 'rec_1', name: 'Meera Nair', role: 'Senior Recruiter', hires: 3, avgDays: 18, rating: 4.8 },
    { id: 'rec_2', name: 'Rahul Sharma', role: 'Tech Recruiter', hires: 2, avgDays: 22, rating: 4.6 },
    { id: 'rec_3', name: 'Priya Iyer', role: 'Lead Recruiter', hires: 2, avgDays: 20, rating: 4.9 },
  ],
  sourceOfHire: [
    { source: 'LinkedIn', count: 145, percentage: 32 },
    { source: 'Employee Referral', count: 112, percentage: 25 },
    { source: 'Job Portals', count: 98, percentage: 22 },
    { source: 'Company Website', count: 67, percentage: 15 },
    { source: 'Campus Hiring', count: 34, percentage: 8 },
  ],
  applicationsTrend: Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2025, 0 + i, 1);
    return {
      month: month.toLocaleString('default', { month: 'short' }),
      applications: 180 + Math.floor(Math.sin(i) * 80 + Math.random() * 150),
      shortlisted: 45 + Math.floor(Math.sin(i + 0.5) * 20 + Math.random() * 40),
    };
  }),
  skillDemand: [
    { skill: 'React', demand: 98, candidates: 245 },
    { skill: 'Node.js', demand: 87, candidates: 198 },
    { skill: 'Python', demand: 82, candidates: 267 },
    { skill: 'AWS', demand: 76, candidates: 134 },
    { skill: 'TypeScript', demand: 72, candidates: 156 },
    { skill: 'Machine Learning', demand: 65, candidates: 98 },
    { skill: 'Kubernetes', demand: 58, candidates: 67 },
    { skill: 'SQL', demand: 54, candidates: 312 },
  ],
};

const CANDIDATE_DASHBOARD_STATS = {
  overview: {
    totalApplications: 12,
    applicationsThisMonth: 3,
    interviewsAttended: 5,
    interviewsScheduled: 2,
    offersReceived: 1,
    profileViews: 147,
    profileScore: 82,
    avgResponseTime: 3,
  },
  applicationStatusBreakdown: [
    { status: 'applied', count: 4, color: '#3b82f6' },
    { status: 'screening', count: 2, color: '#eab308' },
    { status: 'shortlisted', count: 2, color: '#a855f7' },
    { status: 'interview', count: 2, color: '#6366f1' },
    { status: 'selected', count: 1, color: '#22c55e' },
    { status: 'rejected', count: 1, color: '#ef4444' },
  ],
  upcomingInterviews: [],
  skillsAssessment: [],
};

function generateChatHistory() {
  return [
    {
      id: 'chat_1',
      title: 'Resume Optimization Tips',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'How can I improve my resume for a Senior React Developer role?',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Great question! Based on my analysis of 500+ Senior React job descriptions [Source: Internal Job Analytics, Oct 2025], here are key improvements:\n\n1. **Quantify your impact**: Instead of "Built features", say "Led development of checkout feature that improved conversion by 22% and reduced cart abandonment by 15%"\n\n2. **Highlight specific skills explicitly**: 89% of job descriptions mention TypeScript, 76% mention Next.js, and 68% mention testing [Source: Tech Hiring Trends Report Q3 2025]\n\n3. **Use action verbs**: Architected, Implemented, Optimized, Led, Mentored\n\n4. **Keep it to 2 pages max** — recruiters spend 7.4 seconds on initial review [Source: SHRM Study]\n\nWould you like me to review your uploaded resume?',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString(),
          sources: [
            { title: 'Internal Job Analytics', url: '#' },
            { title: 'Tech Hiring Trends Report Q3 2025', url: '#' },
            { title: 'SHRM Resume Study', url: '#' },
          ],
        },
      ],
    },
    {
      id: 'chat_2',
      title: 'Salary Negotiation for Bangalore',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_3',
          role: 'user',
          content: 'What is the expected salary range for 5 years React experience in Bangalore?',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'msg_4',
          role: 'assistant',
          content: 'Based on our salary data from 3,200+ candidates who accepted offers in the last 6 months [Source: HireMind Compensation Benchmarks]:\n\n**Bangalore — 5 years React experience:**\n\n| Company Tier | Min (LPA) | Median (LPA) | Max (LPA) |\n|---|---|---|---|\n| FAANG/Top MNC | 28 | 35 | 48 |\n| Series C+ Startups | 22 | 28 | 40 |\n| Service Based | 14 | 18 | 24 |\n\n**Additional variables that affect pay:**\n- TypeScript proficiency: +15-20% [Skill premium analysis]\n- Next.js experience: +10-15%\n- System design ability: +25% for higher bands\n\nKey negotiating leverage: Companies currently have 1.8 open positions per qualified React developer in Bangalore [Source: Naukri Job Market Report].',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4500).toISOString(),
          sources: [
            { title: 'HireMind Compensation Benchmarks', url: '#' },
            { title: 'Naukri Job Market Report', url: '#' },
          ],
        },
      ],
    },
  ];
}

const MOCK_JOBS = generateJobs();
const MOCK_CANDIDATES = generateCandidates();
const MOCK_APPLICATIONS = generateApplications(MOCK_JOBS, MOCK_CANDIDATES);
const MOCK_INTERVIEWS = generateInterviews(MOCK_JOBS, MOCK_CANDIDATES, MOCK_APPLICATIONS);
const MOCK_CHAT_HISTORY = generateChatHistory();

export {
  COMPANIES,
  MOCK_JOBS,
  MOCK_CANDIDATES,
  MOCK_APPLICATIONS,
  MOCK_INTERVIEWS,
  MOCK_CHAT_HISTORY,
  RECRUITER_DASHBOARD_STATS,
  CANDIDATE_DASHBOARD_STATS,
};
