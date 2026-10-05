export const MOCK_DELAY = 800;

export const RANDOM_FAILURE_RATE = 0.05;

export const APPLICATION_STATUSES = [
  { value: 'applied', label: 'Applied', description: 'Application submitted' },
  { value: 'screening', label: 'Screening', description: 'Under initial review' },
  { value: 'shortlisted', label: 'Shortlisted', description: 'Selected for next steps' },
  { value: 'interview', label: 'Interview', description: 'Interview scheduled or in progress' },
  { value: 'selected', label: 'Selected', description: 'Offer extended or accepted' },
  { value: 'rejected', label: 'Rejected', description: 'Application not successful' },
];

export const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone Screen', icon: 'Phone' },
  { value: 'video', label: 'Video Call', icon: 'Video' },
  { value: 'onsite', label: 'On-Site', icon: 'MapPin' },
  { value: 'technical', label: 'Technical Interview', icon: 'Code' },
  { value: 'hr', label: 'HR Round', icon: 'Users' },
  { value: 'final', label: 'Final Interview', icon: 'Trophy' },
];

export const INTERVIEW_STATUS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export const ROLES = [
  { value: 'candidate', label: 'Candidate', description: 'Search and apply for jobs' },
  { value: 'recruiter', label: 'Recruiter', description: 'Post jobs and manage candidates' },
];

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-Time', short: 'FT' },
  { value: 'part-time', label: 'Part-Time', short: 'PT' },
  { value: 'contract', label: 'Contract', short: 'CT' },
  { value: 'internship', label: 'Internship', short: 'IN' },
  { value: 'freelance', label: 'Freelance', short: 'FL' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', min: 0, max: 1 },
  { value: 'mid', label: 'Mid Level', min: 1, max: 4 },
  { value: 'senior', label: 'Senior Level', min: 4, max: 8 },
  { value: 'lead', label: 'Lead', min: 8, max: 12 },
  { value: 'executive', label: 'Executive', min: 12, max: 30 },
];

export const LOCATIONS = [
  { value: 'mumbai', label: 'Mumbai, Maharashtra' },
  { value: 'bangalore', label: 'Bangalore, Karnataka' },
  { value: 'pune', label: 'Pune, Maharashtra' },
  { value: 'delhi', label: 'Delhi NCR' },
  { value: 'hyderabad', label: 'Hyderabad, Telangana' },
  { value: 'chennai', label: 'Chennai, Tamil Nadu' },
  { value: 'kolkata', label: 'Kolkata, West Bengal' },
  { value: 'ahmedabad', label: 'Ahmedabad, Gujarat' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const EMPLOYMENT_TYPES = JOB_TYPES;

export const WORK_MODES = [
  { value: 'remote', label: 'Remote', icon: 'Home' },
  { value: 'hybrid', label: 'Hybrid', icon: 'Building2' },
  { value: 'onsite', label: 'On-Site', icon: 'Office' },
];

export const NOTIFICATION_TYPES = [
  { value: 'application', label: 'Application Update' },
  { value: 'interview', label: 'Interview Update' },
  { value: 'message', label: 'New Message' },
  { value: 'job', label: 'Job Alert' },
  { value: 'system', label: 'System' },
];

export const STORAGE_KEYS = {
  THEME: 'hiremind_theme',
  USER: 'hiremind_user',
  TOKEN: 'hiremind_token',
  JOBS: 'hiremind_jobs',
  APPLICATIONS: 'hiremind_applications',
  INTERVIEWS: 'hiremind_interviews',
  PROFILE: 'hiremind_profile',
  RESUMES: 'hiremind_resumes',
  CHAT_HISTORY: 'hiremind_chat_history',
};

export const SKILL_CATEGORIES = [
  {
    category: 'Frontend Development',
    skills: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
  },
  {
    category: 'Backend Development',
    skills: ['Node.js', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'Go', 'Rust', 'GraphQL', 'REST API'],
  },
  {
    category: 'Database',
    skills: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'DynamoDB', 'SQLite', 'Cassandra'],
  },
  {
    category: 'DevOps & Cloud',
    skills: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'Linux', 'Nginx'],
  },
  {
    category: 'Data & AI',
    skills: ['Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'SQL', 'Python', 'Spark', 'Kafka', 'NLP', 'Computer Vision'],
  },
  {
    category: 'Mobile Development',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  },
  {
    category: 'Design & Product',
    skills: ['Figma', 'UI/UX Design', 'Product Management', 'Agile', 'Scrum', 'Prototyping'],
  },
  {
    category: 'Business & Operations',
    skills: ['Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Business Analysis', 'Excel', 'Power BI'],
  },
];

export const ALL_SKILLS = SKILL_CATEGORIES.flatMap(cat => cat.skills);

export const DEPARTMENTS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'legal', label: 'Legal' },
  { value: 'customer_support', label: 'Customer Support' },
];
