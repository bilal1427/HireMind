import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import RoleRoute from './components/common/RoleRoute';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import CandidateResume from './pages/candidate/Resume';
import CandidateJobs from './pages/candidate/Jobs';
import CandidateJobDetail from './pages/candidate/JobDetail';
import CandidateApplications from './pages/candidate/Applications';
import CandidateSkillGap from './pages/candidate/SkillGap';
import CandidateInterviews from './pages/candidate/Interviews';
import CandidateAIAssistant from './pages/candidate/AIAssistant';

import RecruiterDashboard from './pages/recruiter/Dashboard';
import RecruiterJobs from './pages/recruiter/Jobs';
import RecruiterCreateJob from './pages/recruiter/JobCreate';
import RecruiterJobDetail from './pages/recruiter/JobDetails';
import RecruiterCandidates from './pages/recruiter/Candidates';
import RecruiterCandidateDetail from './pages/recruiter/CandidateDetail';
import RecruiterMatching from './pages/recruiter/Matching';
import RecruiterInterviews from './pages/recruiter/Interviews';
import RecruiterFeedback from './pages/recruiter/Feedback';
import RecruiterAIAssistant from './pages/recruiter/AIAssistant';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              <Route element={<RoleRoute role="candidate" />}>
                <Route element={<AppLayout />}>
                  <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
                  <Route path="/candidate/profile" element={<CandidateProfile />} />
                  <Route path="/candidate/resume" element={<CandidateResume />} />
                  <Route path="/candidate/jobs" element={<CandidateJobs />} />
                  <Route path="/candidate/jobs/:id" element={<CandidateJobDetail />} />
                  <Route path="/candidate/applications" element={<CandidateApplications />} />
                  <Route path="/candidate/skill-gap" element={<CandidateSkillGap />} />
                  <Route path="/candidate/interviews" element={<CandidateInterviews />} />
                  <Route path="/candidate/ai-assistant" element={<CandidateAIAssistant />} />
                  <Route path="/candidate" element={<Navigate to="/candidate/dashboard" replace />} />
                </Route>
              </Route>

              <Route element={<RoleRoute role="recruiter" />}>
                <Route element={<AppLayout />}>
                  <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                  <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
                  <Route path="/recruiter/jobs/create" element={<RecruiterCreateJob />} />
                  <Route path="/recruiter/jobs/:id" element={<RecruiterJobDetail />} />
                  <Route path="/recruiter/candidates" element={<RecruiterCandidates />} />
                  <Route path="/recruiter/candidates/:id" element={<RecruiterCandidateDetail />} />
                  <Route path="/recruiter/matching" element={<RecruiterMatching />} />
                  <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
                  <Route path="/recruiter/feedback" element={<RecruiterFeedback />} />
                  <Route path="/recruiter/ai-assistant" element={<RecruiterAIAssistant />} />
                  <Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
                </Route>
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
