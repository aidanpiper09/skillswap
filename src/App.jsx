import React, { useMemo, useState } from 'react';
import {
  Home,
  LogIn,
  LayoutDashboard,
  User,
  Calendar,
  MessageCircle,
  Star,
  Users,
  Shield,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'landing', label: 'Landing', icon: Home },
  { id: 'auth', label: 'Auth', icon: LogIn },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'messaging', label: 'Messaging', icon: MessageCircle },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'clubs', label: 'Clubs', icon: Users },
  { id: 'admin', label: 'Admin', icon: Shield },
];

const FEEDBACK = {
  info: {
    title: 'Action needed',
    body: 'Complete all fields to submit your request. Required fields are marked with *.',
    icon: AlertTriangle,
    tone: 'info',
  },
  success: {
    title: 'Saved successfully',
    body: 'Your updates were captured. Review next steps in the checklist below.',
    icon: CheckCircle2,
    tone: 'success',
  },
  alert: {
    title: 'Attention',
    body: 'Messaging is in demo mode. Messages are not sent to real users.',
    icon: Bell,
    tone: 'alert',
  },
};

const mockSessions = [
  {
    title: 'Algebra II Study Jam',
    partner: 'Jordan Kim',
    date: 'Thu, Oct 3 · 4:00 PM',
    location: 'Library, Room 214',
    status: 'Pending confirmation',
  },
  {
    title: 'UX Design Critique',
    partner: 'Alex Martinez',
    date: 'Fri, Oct 4 · 12:30 PM',
    location: 'Design Lab',
    status: 'Accepted',
  },
  {
    title: 'Python Tutoring',
    partner: 'Priya Singh',
    date: 'Mon, Oct 7 · 3:15 PM',
    location: 'STEM Center',
    status: 'Completed',
  },
];

const mockMessages = [
  {
    name: 'Priya Singh',
    time: '2:42 PM',
    body: 'Bringing the practice problems and a summary sheet.',
  },
  {
    name: 'You',
    time: '2:44 PM',
    body: 'Perfect! I will reserve the study booth in advance.',
  },
];

const mockRatings = [
  { skill: 'Public Speaking', rating: 5, note: 'Clear guidance and feedback.' },
  { skill: 'Graphic Design', rating: 4, note: 'Helpful tips for layout.' },
  { skill: 'Chemistry', rating: 5, note: 'Explained concepts clearly.' },
];

const mockClubMembers = [
  { name: 'BPA Leadership Club', members: 28, focus: 'Career readiness' },
  { name: 'STEM Study Group', members: 36, focus: 'Math & science tutoring' },
  { name: 'Creative Studio', members: 19, focus: 'Art, design, and writing' },
];

function PageShell({ children }) {
  return (
    <div className="app-shell">
      <div className="page-container">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function FeedbackBanner({ title, body, icon: Icon, tone }) {
  return (
    <div className={`feedback-banner ${tone}`} role="status">
      <div className="feedback-icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    </div>
  );
}

function FormField({ label, helper, children, required }) {
  return (
    <label className="form-field">
      <span>
        {label} {required && <span className="required">*</span>}
      </span>
      {children}
      {helper && <small>{helper}</small>}
    </label>
  );
}

function App() {
  const [page, setPage] = useState('landing');
  const [authMode, setAuthMode] = useState('signin');

  const navActions = useMemo(
    () => (
      <div className="nav-actions">
        <button className="ghost-button" type="button">
          <Mail size={18} aria-hidden="true" />
          <span>Inbox</span>
        </button>
        <button className="ghost-button" type="button">
          <Settings size={18} aria-hidden="true" />
          <span>Preferences</span>
        </button>
      </div>
    ),
    []
  );

  return (
    <div className="app">
      <header className="top-nav">
        <div className="brand">
          <div className="brand-badge">SS</div>
          <div>
            <p className="brand-title">SkillSwap</p>
            <p className="brand-subtitle">Accessible student skill exchange</p>
          </div>
        </div>
        <nav className="nav-links" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                className={`nav-link ${page === item.id ? 'active' : ''}`}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        {navActions}
      </header>

      {page === 'landing' && (
        <PageShell>
          <div className="hero">
            <div className="hero-content">
              <p className="pill">Built for high-contrast, accessible navigation</p>
              <h1>Swap skills, build confidence, and connect with classmates.</h1>
              <p>
                SkillSwap organizes sessions, messaging, ratings, and club collaboration in one unified
                space. Every page includes clear instructions and feedback to reduce confusion.
              </p>
              <div className="hero-actions">
                <button className="primary-button" type="button" onClick={() => setPage('auth')}>
                  Get started
                </button>
                <button className="secondary-button" type="button" onClick={() => setPage('dashboard')}>
                  Preview dashboard
                </button>
              </div>
              <div className="hero-stats">
                <div>
                  <strong>96%</strong>
                  <span>students feel more prepared</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>access to peer mentors</span>
                </div>
                <div>
                  <strong>High</strong>
                  <span>contrast UI support</span>
                </div>
              </div>
            </div>
            <div className="hero-panel">
              <h3>What you can do</h3>
              <ul>
                <li>Schedule sessions with built-in reminders.</li>
                <li>Track ratings and achievements across skills.</li>
                <li>Join clubs for collaborative learning.</li>
                <li>Manage approvals with an admin command center.</li>
              </ul>
              <FeedbackBanner {...FEEDBACK.info} />
            </div>
          </div>
        </PageShell>
      )}

      {page === 'auth' && (
        <PageShell>
          <div className="grid-two">
            <section className="card">
              <SectionHeader
                title="Sign in or create an account"
                description="Use your school email. We protect your privacy and never share your contact details publicly."
              />
              <div className="toggle-group" role="tablist" aria-label="Auth mode">
                <button
                  type="button"
                  className={authMode === 'signin' ? 'active' : ''}
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'active' : ''}
                  onClick={() => setAuthMode('register')}
                >
                  Create account
                </button>
              </div>
              <form className="form">
                {authMode === 'register' && (
                  <FormField label="Full name" helper="Use your preferred name." required>
                    <input type="text" placeholder="Jordan Lee" />
                  </FormField>
                )}
                <FormField
                  label="School email"
                  helper="We'll send a verification email within 5 minutes."
                  required
                >
                  <input type="email" placeholder="student@district.edu" />
                </FormField>
                <FormField label="Password" helper="Minimum 8 characters with a number." required>
                  <input type="password" placeholder="Create a strong password" />
                </FormField>
                {authMode === 'register' && (
                  <FormField label="Graduation year" helper="Used to match you with peers." required>
                    <select>
                      <option>2025</option>
                      <option>2026</option>
                      <option>2027</option>
                      <option>2028</option>
                    </select>
                  </FormField>
                )}
                <button className="primary-button" type="submit">
                  {authMode === 'register' ? 'Create account' : 'Sign in'}
                </button>
                <p className="form-note">
                  Need help? Contact support or check the FAQ in the footer of every page.
                </p>
              </form>
            </section>
            <section className="card emphasis">
              <SectionHeader title="Before you begin" description="Follow these steps for a smooth start." />
              <ol className="checklist">
                <li>Verify your email for access to scheduling tools.</li>
                <li>Add at least one skill you can teach and one you want to learn.</li>
                <li>Enable notifications to receive session updates.</li>
              </ol>
              <FeedbackBanner {...FEEDBACK.success} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'dashboard' && (
        <PageShell>
          <SectionHeader
            title="Dashboard overview"
            description="Quick actions, session highlights, and progress at a glance."
            action={<button className="secondary-button">New request</button>}
          />
          <div className="grid-three">
            <div className="card">
              <h3>Upcoming sessions</h3>
              <p className="muted">2 sessions scheduled this week.</p>
              <div className="metric">02</div>
              <button className="ghost-button" type="button" onClick={() => setPage('sessions')}>
                View schedule
              </button>
            </div>
            <div className="card">
              <h3>Ratings average</h3>
              <p className="muted">Based on 12 peer reviews.</p>
              <div className="metric">4.8 ★</div>
              <button className="ghost-button" type="button" onClick={() => setPage('ratings')}>
                See feedback
              </button>
            </div>
            <div className="card">
              <h3>Club participation</h3>
              <p className="muted">3 active clubs joined.</p>
              <div className="metric">03</div>
              <button className="ghost-button" type="button" onClick={() => setPage('clubs')}>
                Manage clubs
              </button>
            </div>
          </div>
          <div className="grid-two">
            <section className="card">
              <SectionHeader title="Session pipeline" description="Track requests from draft to completion." />
              <div className="timeline">
                <div>
                  <strong>Request submitted</strong>
                  <p>Awaiting partner confirmation.</p>
                </div>
                <div>
                  <strong>Session scheduled</strong>
                  <p>Calendar invites and reminders sent.</p>
                </div>
                <div>
                  <strong>Feedback collected</strong>
                  <p>Ratings appear in your profile.</p>
                </div>
              </div>
            </section>
            <section className="card">
              <SectionHeader title="Feedback reminders" description="Consistent prompts appear on every page." />
              <FeedbackBanner {...FEEDBACK.info} />
              <FeedbackBanner {...FEEDBACK.alert} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'profile' && (
        <PageShell>
          <SectionHeader title="Profile & skills" description="Keep your profile updated so peers can find you." />
          <div className="grid-two">
            <section className="card">
              <h3>Personal details</h3>
              <form className="form">
                <FormField label="Display name" helper="This appears on session requests." required>
                  <input type="text" placeholder="Jordan Lee" />
                </FormField>
                <FormField label="Bio" helper="Share how you like to learn or teach." required>
                  <textarea rows="4" placeholder="I enjoy breaking complex topics into quick study guides." />
                </FormField>
                <FormField label="Availability" helper="Add the times you are open for sessions." required>
                  <input type="text" placeholder="Weekdays after 3 PM" />
                </FormField>
                <button className="primary-button" type="submit">
                  Save profile
                </button>
              </form>
            </section>
            <section className="card emphasis">
              <h3>Skills & goals</h3>
              <div className="tag-group">
                <span>Mentoring · Algebra II</span>
                <span>Mentoring · Debate</span>
                <span>Learning · HTML/CSS</span>
                <span>Learning · Biology</span>
              </div>
              <FormField label="Add a skill" helper="Specify if you can teach or want to learn it." required>
                <div className="inline-field">
                  <input type="text" placeholder="Graphic Design" />
                  <select>
                    <option>Can teach</option>
                    <option>Want to learn</option>
                  </select>
                  <button className="secondary-button" type="button">
                    Add
                  </button>
                </div>
              </FormField>
              <p className="muted">Skills and goals appear on the landing page highlights and in search.</p>
            </section>
          </div>
        </PageShell>
      )}

      {page === 'sessions' && (
        <PageShell>
          <SectionHeader
            title="Sessions"
            description="Schedule, confirm, and track sessions with clear status indicators."
            action={<button className="secondary-button">Request session</button>}
          />
          <div className="grid-two">
            <section className="card">
              <h3>Schedule a new session</h3>
              <form className="form">
                <FormField label="Skill focus" helper="Select one skill per request." required>
                  <input type="text" placeholder="Algebra II" />
                </FormField>
                <FormField label="Partner" helper="Search classmates by skill." required>
                  <input type="text" placeholder="Search by name or skill" />
                </FormField>
                <FormField label="Date & time" helper="Your timezone is America/Chicago." required>
                  <div className="inline-field">
                    <input type="date" />
                    <input type="time" />
                  </div>
                </FormField>
                <FormField label="Location" helper="Virtual or in-person locations are supported." required>
                  <input type="text" placeholder="Library, Room 214" />
                </FormField>
                <button className="primary-button" type="submit">
                  Send request
                </button>
                <p className="form-note">All participants receive confirmation and reminders.</p>
              </form>
            </section>
            <section className="card emphasis">
              <h3>Upcoming sessions</h3>
              <ul className="list">
                {mockSessions.map((session) => (
                  <li key={session.title}>
                    <div>
                      <strong>{session.title}</strong>
                      <p>{session.partner}</p>
                      <p className="muted">{session.date}</p>
                    </div>
                    <span className="status-pill">{session.status}</span>
                  </li>
                ))}
              </ul>
              <FeedbackBanner {...FEEDBACK.info} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'messaging' && (
        <PageShell>
          <SectionHeader
            title="Messaging"
            description="Communicate with session partners using consistent, accessible controls."
          />
          <div className="grid-two">
            <section className="card">
              <h3>Conversation details</h3>
              <div className="conversation-header">
                <div>
                  <strong>Python Tutoring</strong>
                  <p className="muted">Session with Priya Singh · Mon, Oct 7</p>
                </div>
                <button className="secondary-button" type="button">
                  View session
                </button>
              </div>
              <div className="chat-window" role="log" aria-live="polite">
                {mockMessages.map((message, index) => (
                  <div key={`${message.time}-${index}`} className="chat-bubble">
                    <div className="chat-meta">
                      <span>{message.name}</span>
                      <span>{message.time}</span>
                    </div>
                    <p>{message.body}</p>
                  </div>
                ))}
              </div>
              <form className="form">
                <FormField label="Message" helper="Use clear details for meeting changes." required>
                  <textarea rows="3" placeholder="Write a message..." />
                </FormField>
                <button className="primary-button" type="submit">
                  Send message
                </button>
              </form>
            </section>
            <section className="card emphasis">
              <h3>Message guidelines</h3>
              <ul className="list">
                <li>
                  <strong>Share updates early.</strong>
                  <p>Send changes at least 2 hours before the session.</p>
                </li>
                <li>
                  <strong>Confirm location details.</strong>
                  <p>Include meeting links or room numbers in every update.</p>
                </li>
                <li>
                  <strong>Respect privacy.</strong>
                  <p>Avoid sharing personal contact info.</p>
                </li>
              </ul>
              <FeedbackBanner {...FEEDBACK.alert} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'ratings' && (
        <PageShell>
          <SectionHeader
            title="Ratings & feedback"
            description="Consistent rating forms help students understand expectations."
          />
          <div className="grid-two">
            <section className="card">
              <h3>Submit a rating</h3>
              <form className="form">
                <FormField label="Session" helper="Select the completed session." required>
                  <select>
                    <option>Python Tutoring · Priya Singh</option>
                    <option>UX Design Critique · Alex Martinez</option>
                  </select>
                </FormField>
                <FormField label="Rating" helper="1 = Needs improvement, 5 = Excellent" required>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" className="rating-star">
                        <Star aria-hidden="true" />
                        <span>{value}</span>
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Feedback" helper="Offer specific notes to help your partner." required>
                  <textarea rows="4" placeholder="Shared clear explanations and practice questions." />
                </FormField>
                <button className="primary-button" type="submit">
                  Submit rating
                </button>
              </form>
            </section>
            <section className="card emphasis">
              <h3>Recent ratings</h3>
              <ul className="list">
                {mockRatings.map((rating) => (
                  <li key={rating.skill}>
                    <div>
                      <strong>{rating.skill}</strong>
                      <p className="muted">{rating.note}</p>
                    </div>
                    <span className="status-pill">{rating.rating} ★</span>
                  </li>
                ))}
              </ul>
              <FeedbackBanner {...FEEDBACK.success} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'clubs' && (
        <PageShell>
          <SectionHeader
            title="Clubs & cohorts"
            description="Organize recurring study groups and practice sessions."
            action={<button className="secondary-button">Create club</button>}
          />
          <div className="grid-two">
            <section className="card">
              <h3>Join a club</h3>
              <form className="form">
                <FormField label="Search clubs" helper="Filter by focus or organizer." required>
                  <input type="text" placeholder="Search clubs" />
                </FormField>
                <FormField label="Meeting cadence" helper="Weekly and bi-weekly options available." required>
                  <select>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </FormField>
                <button className="primary-button" type="submit">
                  Request invite
                </button>
              </form>
              <p className="form-note">Club leads receive your request instantly.</p>
            </section>
            <section className="card emphasis">
              <h3>Active clubs</h3>
              <ul className="list">
                {mockClubMembers.map((club) => (
                  <li key={club.name}>
                    <div>
                      <strong>{club.name}</strong>
                      <p className="muted">{club.focus}</p>
                    </div>
                    <span className="status-pill">{club.members} members</span>
                  </li>
                ))}
              </ul>
              <FeedbackBanner {...FEEDBACK.info} />
            </section>
          </div>
        </PageShell>
      )}

      {page === 'admin' && (
        <PageShell>
          <SectionHeader
            title="Admin command center"
            description="Monitor users, sessions, and access in one high-contrast dashboard."
            action={<button className="secondary-button">Export report</button>}
          />
          <div className="grid-three">
            <div className="card">
              <h3>Users onboarded</h3>
              <div className="metric">182</div>
              <p className="muted">+12 this week</p>
            </div>
            <div className="card">
              <h3>Open requests</h3>
              <div className="metric">16</div>
              <p className="muted">4 require review today</p>
            </div>
            <div className="card">
              <h3>Accessibility checks</h3>
              <div className="metric">100%</div>
              <p className="muted">Contrast and focus styles verified</p>
            </div>
          </div>
          <div className="grid-two">
            <section className="card">
              <h3>Recent approvals</h3>
              <ul className="list">
                <li>
                  <div>
                    <strong>Session request · UX Design</strong>
                    <p className="muted">Approved by Ms. Ortega</p>
                  </div>
                  <span className="status-pill">Approved</span>
                </li>
                <li>
                  <div>
                    <strong>Club creation · Creative Studio</strong>
                    <p className="muted">Pending final roster</p>
                  </div>
                  <span className="status-pill">Pending</span>
                </li>
                <li>
                  <div>
                    <strong>User access · New student</strong>
                    <p className="muted">Verification sent</p>
                  </div>
                  <span className="status-pill">In review</span>
                </li>
              </ul>
            </section>
            <section className="card emphasis">
              <h3>Admin checklist</h3>
              <ul className="list">
                <li>
                  <strong>Audit logs</strong>
                  <p>Review flagged activity daily.</p>
                </li>
                <li>
                  <strong>Moderation</strong>
                  <p>Check session notes for safety guidance.</p>
                </li>
                <li>
                  <strong>Support tickets</strong>
                  <p>Respond within 24 hours.</p>
                </li>
              </ul>
              <FeedbackBanner {...FEEDBACK.alert} />
            </section>
          </div>
        </PageShell>
      )}

      <footer className="footer">
        <div>
          <p>SkillSwap · Accessible peer learning</p>
          <p className="muted">Need assistance? Email support@skillswap.edu</p>
        </div>
        <div className="footer-links">
          <a href="https://example.com">Privacy</a>
          <a href="https://example.com">Help center</a>
          <a href="https://example.com">Accessibility</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
