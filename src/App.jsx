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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        {description && <p className="text-gray-400 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function FeedbackBanner({ tone, title, body, icon: Icon }) {
  const toneStyles = {
    info: 'border-blue-500 bg-gray-800/70',
    success: 'border-green-500 bg-gray-800/70',
    alert: 'border-yellow-500 bg-gray-800/70',
  };

  return (
    <div className={`border rounded-xl p-4 flex gap-3 ${toneStyles[tone]}`}>
      <Icon className="text-blue-400" />
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-gray-400 text-sm mt-1">{body}</p>
      </div>
    </div>
  );
}

function Navigation({ activePage, onChange }) {
  return (
    <aside className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">SkillSwap</p>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activePage === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
              isActive ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );
      })}
    </aside>
  );
}

function Card({ children }) {
  return <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">{children}</div>;
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const feedbackItems = useMemo(() => Object.values(FEEDBACK), []);

  return (
    <PageShell>
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <Navigation activePage={activePage} onChange={setActivePage} />
        <div className="space-y-8">
          <section className="space-y-4">
            <h1 className="text-3xl font-bold">SkillSwap Experience Map</h1>
            <p className="text-gray-400">
              Review the core journeys for student skill exchanges, messaging, and club coordination.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {feedbackItems.map((item) => (
                <FeedbackBanner key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="grid xl:grid-cols-3 gap-6">
            <Card>
              <SectionHeader title="Upcoming sessions" description="Schedule confirmations and locations." />
              <div className="space-y-4">
                {mockSessions.map((session) => (
                  <div key={session.title} className="border border-gray-700 rounded-xl p-4">
                    <p className="font-semibold text-white">{session.title}</p>
                    <p className="text-gray-400 text-sm">with {session.partner}</p>
                    <p className="text-gray-500 text-sm mt-2">{session.date}</p>
                    <p className="text-gray-500 text-sm">{session.location}</p>
                    <span className="inline-flex mt-3 px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-200">
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Messages" description="Recent conversation highlights." />
              <div className="space-y-4">
                {mockMessages.map((message, index) => (
                  <div key={`${message.name}-${index}`} className="border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{message.name}</p>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{message.body}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Ratings" description="Recent peer feedback." />
              <div className="space-y-4">
                {mockRatings.map((rating) => (
                  <div key={rating.skill} className="border border-gray-700 rounded-xl p-4">
                    <p className="font-semibold text-white">{rating.skill}</p>
                    <p className="text-gray-400 text-sm">{rating.note}</p>
                    <p className="text-yellow-400 mt-2">{'★'.repeat(rating.rating)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid lg:grid-cols-2 gap-6">
            <Card>
              <SectionHeader
                title="Club directory"
                description="Track emerging peer-led groups and focus areas."
                action={<button className="px-4 py-2 bg-blue-500 rounded-lg">Create club</button>}
              />
              <div className="space-y-4">
                {mockClubMembers.map((club) => (
                  <div key={club.name} className="border border-gray-700 rounded-xl p-4">
                    <p className="font-semibold text-white">{club.name}</p>
                    <p className="text-gray-400 text-sm">{club.focus}</p>
                    <p className="text-gray-500 text-sm mt-2">{club.members} members</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Admin overview" description="Snapshot of moderation readiness." />
              <div className="space-y-4 text-gray-400">
                <p>
                  Active page: <span className="text-white font-semibold capitalize">{activePage}</span>
                </p>
                <div className="space-y-2">
                  <p>• 128 active learners</p>
                  <p>• 42 upcoming sessions</p>
                  <p>• 6 pending safety reviews</p>
                </div>
                <button className="px-4 py-2 bg-gray-700 rounded-lg text-white w-fit">Review admin dashboard</button>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
