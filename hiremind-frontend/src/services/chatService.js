import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import { MOCK_CHAT_HISTORY } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return MOCK_CHAT_HISTORY;
}

function saveStoredChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chats));
  } catch {
  }
}

const AI_RESPONSE_TEMPLATES = [
  {
    keywords: ['resume', 'cv', 'curriculum vitae'],
    response: `Great question about resumes! Based on our analysis of 10,000+ successful job applications in the Indian tech market [Source: HireMind Internal Data, Q3 2025]:

**Key findings that make resumes shortlisted:**
1. **Quantify everything**: Numbers get attention. Use % improvement, revenue impact, users served
2. **ATS-optimized format**: 76% of top companies use ATS — stick to 1 column, standard fonts, no tables
3. **Skill density**: Match 70%+ of keywords from the job description
4. **Action verbs first**: Architected, Implemented, Led, Optimized, Reduced, Increased
5. **Max 2 pages** for <10 years experience, max 3 pages otherwise

**Critical mistakes to avoid (seen in 68% of rejected resumes):**
- Typing "Curriculum Vitae" at the top
- Irrelevant hobbies like "listening to music"
- Generic objective statements
- Including 10+ year-old, outdated positions

Would you like me to:
- 📄 Analyze your uploaded resume for these issues?
- 🎯 Compare your resume against a specific job description?
- ✍️ Generate a professional summary tailored to your experience?`,
    sources: [
      { title: 'HireMind Internal Resume Data', url: '#' },
      { title: 'ATS Compatibility Report', url: '#' },
    ],
  },
  {
    keywords: ['salary', 'ctc', 'pay', 'compensation', 'lpa', 'negotiat'],
    response: `Based on our compensation benchmarks from 4,500+ recent offers across India [Source: HireMind Salary Guide 2025]:

**Salary negotiation strategy (proven to increase offers by 12-18%):**

1. **Delay sharing numbers first**: When asked "expected CTC", respond with: *"I'm focused on finding the right fit. Based on my research and experience, I'm confident we can arrive at a competitive number."*

2. **Know your BATNA**: Research the market range using:
   - Levels.fyi (for product/tech roles)
   - Glassdoor India
   - LinkedIn Salary Insights

3. **Anchor slightly high**: If research shows 20-28 LPA, state 26-30 LPA — gives negotiation room

4. **Consider full compensation**: Base (70%) + Bonus (10-20%) + RSUs/ESOPs (10-15%) + Benefits (5-10%)

**Typical ranges by experience (Bangalore/Pune/Mumbai):**
- 0-2 yrs: 4-12 LPA
- 2-5 yrs: 10-22 LPA
- 5-8 yrs: 18-38 LPA
- 8-12 yrs: 35-65 LPA
- 12+ yrs: 55+ LPA

Want me to generate a custom negotiation script for your specific situation?`,
    sources: [
      { title: 'HireMind Salary Guide 2025', url: '#' },
      { title: 'Levels.fyi India Data', url: '#' },
    ],
  },
  {
    keywords: ['interview', 'question', 'prepare', 'round', 'hr', 'technical'],
    response: `Interview preparation framework based on 500+ candidate success patterns [Source: HireMind Interview Analytics]:

**📋 The 3-phase prep approach:**

**Phase 1: Company & Role Research (2 days)**
- Read the JD line-by-line; circle every requirement
- Research 3 recent company news (funding, launches, partnerships)
- Find interviewer on LinkedIn — look for common connections, posts, tech stack
- Prepare 5 insightful questions for them (never ask: "What does your company do?")

**Phase 2: Skill Practice (3-5 days)**
- **DSA**: 2 problems/day (1 easy + 1 medium) from LeetCode/GFG — focus on Arrays, Strings, Trees, DP, Graphs
- **System Design**: Learn RESHADED framework (Requirements, Estimation, Storage, High-level, APIs, Detailed, Evaluation, Distribute)
- **Behavioral**: STAR format answers for: conflict, failure, leadership, tight deadline, disagreement — 8 stories minimum

**Phase 3: Mock Interviews (2 days)**
- Do at least 2 full-length technical mocks
- Record yourself answering behavioral questions — body language matters!
- Get 8+ hours sleep night before; brain performs 25% worse sleep-deprived

What specific interview type are you preparing for? I can give tailored questions:
- Technical/DSA round
- System design round
- Managerial/HR round
- Behavioral interview`,
    sources: [
      { title: 'HireMind Interview Analytics', url: '#' },
      { title: 'Google Interview Prep Guide', url: '#' },
    ],
  },
  {
    keywords: ['skill', 'learn', 'upskill', 'course', 'training', 'gap'],
    response: `Data-driven skill roadmap based on 2025-2026 hiring demand projections [Source: NASSCOM Tech Skill Report]:

**🔥 Highest ROI skills to learn (India, next 2 years):**

| Skill | Avg Salary Premium | Openings/Mo | Time to Proficiency |
|---|---|---|---|
| Kubernetes | +32% | 8,400 | 4-6 months |
| TypeScript (Advanced) | +24% | 15,200 | 2-3 months |
| LLM/GenAI App Dev | +41% | 5,800 | 3-4 months |
| Rust | +38% | 2,300 | 6-8 months |
| Next.js 15 | +18% | 11,700 | 1-2 months |

**🎯 Recommended learning paths (budget-friendly):**

1. **Frontend Pro**: TypeScript → Next.js 15 → Testing (Jest/Playwright) → Design Systems
2. **Backend Pro**: Node/Python → Microservices → Docker → Kubernetes → AWS/GCP
3. **Data/AI Pro**: SQL → Python → ML Fundamentals → PyTorch → LLM Apps (LangChain)

**Free resources I recommend:**
- Coursera (financial aid available for most courses)
- YouTube: freeCodeCamp, Tech With Tim, CodeWithHarry (Hindi)
- Practice: LeetCode, Exercism.io, Frontend Mentor
- Build: Contribute to open source — top 5% contributors get interview invites directly

Tell me your current skill level and target role, and I'll generate a personalized 3-month plan!`,
    sources: [
      { title: 'NASSCOM Tech Skill Report 2025', url: '#' },
      { title: 'LinkedIn Jobs on the Rise', url: '#' },
    ],
  },
  {
    keywords: ['switch', 'change', 'career', 'pivot', 'transition'],
    response: `Career switch playbook based on 320 successful career transitions analyzed [Source: HireMind Career Transition Study]:

**⏱️ Realistic timelines (India):**
- Tiered transition (e.g., frontend → full stack): 3-6 months
- Cross-function (e.g., dev → product): 6-12 months
- Major pivot (e.g., non-tech → SDE): 9-18 months

**✅ Proven 5-step framework:**

1. **Transferable skills audit (Day 1-2)**
   - List ALL skills from current job (hard + soft)
   - Map which overlap with target role
   - Highlight stories where you demonstrated these skills

2. **Skill gap minimum (Month 1)**
   - Don't learn everything — learn the HIREABLE minimum
   - Example: switching to PM → learn SQL, Figma basics, PRD writing; skip agile certifications initially

3. **Credibility projects (Month 2-3)**
   - 2-3 portfolio pieces showing you can do the work
   - Quantity: Freelance on Internshala/Fiverr for social proof
   - Quality: Case studies with before/after metrics

4. **Network before you need it (Month 1-6)**
   - 2 informational interviews/week with people in target role
   - 80% of mid-senior roles get filled via referral
   - Apply AND get referred — 5x higher callback rate

5. **Storytelling mastery (Month 4+)**
   - Your "why pivot" story must be 60 seconds, logical, and energetic
   - Frame past as foundation: *"My background in X taught me Y, which gives me unique perspective as Z"*

**💡 Reality check:**
- First 100 applications = 0 callbacks. Normal!
- Switchers get 2-3 offers from 150+ quality applications
- Consider lateral move + internal transfer — safest path for >5 YOE

What role are you targeting, and what's your current background?`,
    sources: [
      { title: 'HireMind Career Transition Study', url: '#' },
      { title: 'LinkedIn Career Change Data', url: '#' },
    ],
  },
];

const GENERIC_RESPONSES = [
  {
    response: `That's an interesting question! I'm HireMind AI — your career strategist and job search assistant.

I can help you with:
- 📝 **Resume & Cover Letter**: Writing, optimization, ATS analysis, role-specific tailoring
- 💼 **Job Search**: Market trends, salary benchmarks, company insights, role fit analysis
- 🎯 **Applications**: Optimizing profile, tracking submissions, follow-up templates
- 🗣️ **Interview Prep**: Question banks, mock interviews, company-specific guides, STAR stories
- 💰 **Negotiation**: Offer evaluation, salary scripts, benefits & equity strategy
- 📈 **Career Growth**: Skill gap analysis, upskilling plans, promotion strategy, career pivots
- 🧠 **Company Research**: Culture reviews, recent news, team information, interview insights

**Tip:** Be specific! Instead of "help me prepare", try "Give me 5 behavioral questions for Google PM interview with sample STAR answers" — you'll get much better results.

What's your specific goal right now?`,
    sources: [],
  },
  {
    response: `Got it! Based on your query, here's a framework to think about this.

**Quick stats to ground you:**
- Average job search in India takes 8-12 weeks for 5+ YOE candidates
- Each application takes ~15 minutes if optimized
- Quality over quantity: 20 targeted applications/week > 100 generic ones
- Response rate benchmark: 1 interview per 10-15 applications (good)

**Ask me follow-ups:**
1. Want me to drill deeper into a specific step?
2. Should I pull in real-time data from our job/candidate database?
3. Want a personalized analysis using your profile or job ID?

Just paste a job description URL/ID or your candidate ID, and I'll give you tailored, actionable advice.`,
    sources: [
      { title: 'HireMind Job Search Report', url: '#' },
    ],
  },
];

function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  for (const template of AI_RESPONSE_TEMPLATES) {
    if (template.keywords.some(kw => message.includes(kw))) {
      return { content: template.response, sources: template.sources };
    }
  }
  const generic = GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)];
  return { content: generic.response, sources: generic.sources };
}

export async function getChatHistory() {
  await sleep(MOCK_DELAY * 0.6);
  if (randomFailure()) {
    throw new Error('Failed to load chat history.');
  }
  const chats = getStoredChats();
  return chats
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.messages?.[0]?.timestamp || 0) - new Date(a.createdAt || a.messages?.[0]?.timestamp || 0));
}

export async function getChatById(chatId) {
  await sleep(MOCK_DELAY * 0.4);
  const chats = getStoredChats();
  return chats.find(c => c.id === chatId) || null;
}

export async function createChat(title = 'New Chat') {
  await sleep(MOCK_DELAY * 0.3);
  const chat = {
    id: 'chat_' + generateId(),
    title,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  const updated = [chat, ...getStoredChats()];
  saveStoredChats(updated);
  return chat;
}

export async function sendMessage(chatId, userMessage) {
  if (randomFailure()) {
    await sleep(MOCK_DELAY * 0.5);
    throw new Error('Failed to send message. Please try again.');
  }
  await sleep(MOCK_DELAY * 0.6);
  const typingDelay = 400 + Math.min(2500, userMessage.length * 15);
  const userMsgId = 'msg_' + generateId();
  const userMessageObj = {
    id: userMsgId,
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  };
  let chats = getStoredChats();
  let chatIndex = chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) {
    const newChat = {
      id: chatId || 'chat_' + generateId(),
      title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
      createdAt: new Date().toISOString(),
      messages: [userMessageObj],
    };
    chats = [newChat, ...chats];
    chatIndex = 0;
  } else {
    chats[chatIndex].messages = [...(chats[chatIndex].messages || []), userMessageObj];
    if (!chats[chatIndex].title || chats[chatIndex].title === 'New Chat') {
      chats[chatIndex].title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
    }
  }
  saveStoredChats(chats);
  await sleep(typingDelay);
  if (randomFailure()) {
    throw new Error('AI response failed.');
  }
  const aiResult = generateAIResponse(userMessage);
  const aiMsgId = 'msg_' + generateId();
  const aiMessageObj = {
    id: aiMsgId,
    role: 'assistant',
    content: aiResult.content,
    sources: aiResult.sources,
    timestamp: new Date().toISOString(),
  };
  chats = getStoredChats();
  chatIndex = chats.findIndex(c => c.id === (chatId || chats[0].id));
  if (chatIndex !== -1) {
    chats[chatIndex].messages = [...chats[chatIndex].messages, aiMessageObj];
    saveStoredChats(chats);
  }
  return {
    userMessage: userMessageObj,
    assistantMessage: aiMessageObj,
    chatId: chatIndex !== -1 ? chats[chatIndex].id : chatId,
  };
}

export async function deleteChat(chatId) {
  await sleep(MOCK_DELAY * 0.4);
  if (randomFailure()) {
    throw new Error('Failed to delete chat.');
  }
  const updated = getStoredChats().filter(c => c.id !== chatId);
  saveStoredChats(updated);
  return { success: true, id: chatId };
}
