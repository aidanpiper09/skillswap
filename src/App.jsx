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
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onIdTokenChanged, getIdTokenResult } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, Timestamp, onSnapshot } from 'firebase/firestore';
import { Calendar, User, Award, MessageCircle, Users, BarChart3, Shield, LogOut, Search, Star, Clock, CheckCircle, XCircle, TrendingUp, Home } from 'lucide-react';

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

// Firebase bootstrap: shared service handles auth + Firestore reads/writes.
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const createSessionFn = httpsCallable(functions, 'createSession');
const updateSessionStatusFn = httpsCallable(functions, 'updateSessionStatus');
const deleteUserFn = httpsCallable(functions, 'deleteUserAccount');
const createAuditLogFn = httpsCallable(functions, 'createAuditLog');

const TEXT_LIMITS = {
  bio: 500,
  skill: 60,
  sessionSkill: 80,
  sessionLocation: 120,
  message: 1000,
  ratingComment: 300,
  clubDescription: 500
};

const sanitizeText = (value) => {
  const normalized = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  return normalized
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const sanitizeSingleLine = (value) => sanitizeText(value).replace(/\n+/g, ' ').trim();

const validateTextField = (label, value, maxLength, singleLine = false) => {
  const sanitized = singleLine ? sanitizeSingleLine(value) : sanitizeText(value);

  if (sanitized.length > maxLength) {
    alert(`${label} must be ${maxLength} characters or less.`);
    return null;
  }

  return sanitized;
};

const sanitizeSkillList = (skills, label) => {
  const sanitized = [];

  for (const skill of skills) {
    const cleanName = sanitizeSingleLine(skill.name);
    if (!cleanName) {
      alert(`${label} skill names cannot be blank.`);
      return null;
    }
    if (cleanName.length > TEXT_LIMITS.skill) {
      alert(`${label} skill names must be ${TEXT_LIMITS.skill} characters or less.`);
      return null;
    }
    sanitized.push({ ...skill, name: cleanName });
  }

  return sanitized;
};

const MAX_SKILLS = 12;
const MAX_BIO_LENGTH = 280;
const MAX_MESSAGE_LENGTH = 500;
const MAX_RATING_COMMENT_LENGTH = 300;
const MAX_CLUB_DESCRIPTION_LENGTH = 500;
const MAX_CLUB_FIELD_LENGTH = 120;
const SKILL_NAME_PATTERN = /^[A-Za-z0-9 .&+'-]{2,40}$/;

const validateSkillName = (skillName) => {
  const trimmed = skillName.trim();
  if (!trimmed) return 'Skill name is required.';
  if (!SKILL_NAME_PATTERN.test(trimmed)) {
    return 'Skill names must be 2-40 characters and can include letters, numbers, spaces, and . & + \' -.';
  }
  return '';
};

const validateSkillList = (skills, label) => {
  if (skills.length > MAX_SKILLS) {
    return `Limit ${label} skills to ${MAX_SKILLS}.`;
  }
  for (const skill of skills) {
    const error = validateSkillName(skill.name || '');
    if (error) {
      return `${label} skill error: ${error}`;
    }
  }
  return '';
};

const validateBio = (bioText) => {
  if (bioText.length > MAX_BIO_LENGTH) {
    return `Bio must be ${MAX_BIO_LENGTH} characters or less.`;
  }
  return '';
};

const validateMessage = (messageText) => {
  const trimmed = messageText.trim();
  if (!trimmed) return 'Message cannot be empty.';
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`;
  }
  return '';
};

const validateRating = (score, comment) => {
  if (score < 1 || score > 5) {
    return 'Rating must be between 1 and 5.';
  }
  if (comment.trim().length > MAX_RATING_COMMENT_LENGTH) {
    return `Rating comment must be ${MAX_RATING_COMMENT_LENGTH} characters or less.`;
  }
  return '';
};

const validateClubDetails = (details) => {
  if (!details.name.trim()) return 'Club name is required.';
  if (details.name.trim().length < 2 || details.name.trim().length > 60) {
    return 'Club name must be 2-60 characters.';
  }
  if (details.description.trim().length > MAX_CLUB_DESCRIPTION_LENGTH) {
    return `Club description must be ${MAX_CLUB_DESCRIPTION_LENGTH} characters or less.`;
  }
  if (details.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contactEmail)) {
    return 'Club contact email must be valid.';
  }
  if (details.meetingLocation.trim().length > MAX_CLUB_FIELD_LENGTH) {
    return `Meeting location must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`;
  }
  if (details.meetingSchedule.trim().length > MAX_CLUB_FIELD_LENGTH) {
    return `Meeting schedule must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`;
  }
  return '';
};

const isSecureContext = () => {
  if (typeof window === 'undefined') return true;
  if (window.location.protocol === 'https:') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const MAX_SKILLS = 12;
const MAX_BIO_LENGTH = 280;
const MAX_MESSAGE_LENGTH = 500;
const MAX_RATING_COMMENT_LENGTH = 300;
const MAX_CLUB_DESCRIPTION_LENGTH = 500;
const MAX_CLUB_FIELD_LENGTH = 120;
const SKILL_NAME_PATTERN = /^[A-Za-z0-9 .&+'-]{2,40}$/;

const validateSkillName = (skillName) => {
  const trimmed = skillName.trim();
  if (!trimmed) return 'Skill name is required.';
  if (!SKILL_NAME_PATTERN.test(trimmed)) {
    return 'Skill names must be 2-40 characters and can include letters, numbers, spaces, and . & + \' -.';
  }
  return '';
};

const validateSkillList = (skills, label) => {
  if (skills.length > MAX_SKILLS) {
    return `Limit ${label} skills to ${MAX_SKILLS}.`;
  }
  for (const skill of skills) {
    const error = validateSkillName(skill.name || '');
    if (error) {
      return `${label} skill error: ${error}`;
    }
  }
  return '';
};

const validateBio = (bioText) => {
  if (bioText.length > MAX_BIO_LENGTH) {
    return `Bio must be ${MAX_BIO_LENGTH} characters or less.`;
  }
  return '';
};

const validateMessage = (messageText) => {
  const trimmed = messageText.trim();
  if (!trimmed) return 'Message cannot be empty.';
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`;
  }
  return '';
};

const validateRating = (score, comment) => {
  if (score < 1 || score > 5) {
    return 'Rating must be between 1 and 5.';
  }
  if (comment.trim().length > MAX_RATING_COMMENT_LENGTH) {
    return `Rating comment must be ${MAX_RATING_COMMENT_LENGTH} characters or less.`;
  }
  return '';
};

const validateClubDetails = (details) => {
  if (!details.name.trim()) return 'Club name is required.';
  if (details.name.trim().length < 2 || details.name.trim().length > 60) {
    return 'Club name must be 2-60 characters.';
  }
  if (details.description.trim().length > MAX_CLUB_DESCRIPTION_LENGTH) {
    return `Club description must be ${MAX_CLUB_DESCRIPTION_LENGTH} characters or less.`;
  }
  if (details.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contactEmail)) {
    return 'Club contact email must be valid.';
  }
  if (details.meetingLocation.trim().length > MAX_CLUB_FIELD_LENGTH) {
    return `Meeting location must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`;
  }
  if (details.meetingSchedule.trim().length > MAX_CLUB_FIELD_LENGTH) {
    return `Meeting schedule must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`;
  }
  return '';
};

const isSecureContext = () => {
  if (typeof window === 'undefined') return true;
  if (window.location.protocol === 'https:') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const ACHIEVEMENTS = [
  { id: 'first_session', name: 'First Steps', description: 'Complete your first session', icon: '🎯' },
  { id: 'five_sessions', name: 'Getting Started', description: 'Complete 5 sessions', icon: '🌟' },
  { id: 'ten_sessions', name: 'Skilled Swapper', description: 'Complete 10 sessions', icon: '🏆' },
  { id: 'five_star', name: 'Perfect Rating', description: 'Receive a 5-star rating', icon: '⭐' },
  { id: 'teacher', name: 'Master Teacher', description: 'Teach 5 different skills', icon: '👨‍🏫' },
  { id: 'learner', name: 'Curious Mind', description: 'Learn 5 different skills', icon: '📚' }
];

export default function SkillSwap() {
  // Core UI state: controls auth routing and major view selection.
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  const [secureTransport, setSecureTransport] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileInitialized, setProfileInitialized] = useState(false);
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [isRegister, setIsRegister] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const [authFeedback, setAuthFeedback] = useState(null);
  
  // Profile states
  const [bio, setBio] = useState('');
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [soughtSkills, setSoughtSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('offered');
  const [profileVisibility, setProfileVisibility] = useState('members');
  const [allowRequestsFrom, setAllowRequestsFrom] = useState('anyone');
  const [allowMessagesFrom, setAllowMessagesFrom] = useState('participants');
  const [clubs, setClubs] = useState([]);
  const [newClub, setNewClub] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [profileFeedback, setProfileFeedback] = useState(null);
  
  // Sessions states
  const [sessions, setSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessionSkill, setSessionSkill] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionErrors, setSessionErrors] = useState({});
  const [sessionFeedback, setSessionFeedback] = useState(null);
  
  // Messages states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [messageErrors, setMessageErrors] = useState({});
  const [messageFeedback, setMessageFeedback] = useState(null);
  
  // Rating states
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratedSessionIds, setRatedSessionIds] = useState([]);
  const [ratingErrors, setRatingErrors] = useState({});
  const [ratingFeedback, setRatingFeedback] = useState(null);
  
  // Admin states
  const [adminUsers, setAdminUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    activeSessions: 0,
    pendingSessions: 0,
    topSkills: [],
    ratingsSummary: null,
    recentActivity: []
  const [adminSessions, setAdminSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminReports, setAdminReports] = useState({
    userCounts: {},
    sessionStats: {},
    ratingsSummary: {},
    moderationFlags: {},
    topSkills: []
  const [stats, setStats] = useState({});
  const [clubDetails, setClubDetails] = useState({
    name: '',
    description: '',
    contactEmail: '',
    meetingLocation: '',
    meetingSchedule: ''
  });
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Clubs states
  const [clubs, setClubs] = useState([]);
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubSchedule, setClubSchedule] = useState('');
  const [editingClubId, setEditingClubId] = useState(null);
  const [editClubName, setEditClubName] = useState('');
  const [editClubDescription, setEditClubDescription] = useState('');
  const [editClubSchedule, setEditClubSchedule] = useState('');

  const logAuditEvent = async (payload) => {
    const logAuditEventCallable = httpsCallable(functions, 'logAuditEvent');
    await logAuditEventCallable(payload);
  };

  const updateSessionStatusCallable = httpsCallable(functions, 'updateSessionStatus');

  const callFunction = async (name, data) => {
    const callable = httpsCallable(functions, name);
    const result = await callable(data);
    return result.data;
  };

  const logAuditEvent = async (action, payload = {}) => {
    await callFunction('logAuditEvent', { action, ...payload });
  };

  const logAuditEvent = async ({ action, targetUserId, sessionId, metadata }) => {
    const logEvent = httpsCallable(functions, 'logAuditEvent');
    await logEvent({
      action,
      targetUserId: targetUserId || null,
      sessionId: sessionId || null,
      metadata: metadata || null
    });
  };

  useEffect(() => {
    setSecureTransport(isSecureContext());
  }, []);

  useEffect(() => {
    setSecureTransport(isSecureContext());
  }, []);

  useEffect(() => {
    // Auth bootstrap: derive profile + landing page from Firebase auth state.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser, true);
        const adminClaim = tokenResult.claims?.admin === true;
        setIsAdmin(adminClaim);
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
          setPage(adminClaim ? 'admin' : 'dashboard');
        const hasAdminClaim = tokenResult?.claims?.admin === true;
        setIsAdmin(hasAdminClaim);
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
          setPage(hasAdminClaim ? 'admin' : 'dashboard');
        } else {
          setPage('profile-setup');
        }
      } else {
        setIsAdmin(false);
        setPage('login');
      }
      setProfileInitialized(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Data refresh when navigating between major sections or after auth resolution.
    if (user && userProfile) {
      loadUserData();
    }
  }, [user, userProfile, page, isAdmin]);

  useEffect(() => {
    if (userProfile && !profileInitialized) {
      setBio(userProfile.bio || '');
      setOfferedSkills(userProfile.offeredSkills || []);
      setSoughtSkills(userProfile.soughtSkills || []);
      setClubs(userProfile.clubs || []);
      setProfileInitialized(true);
    }
  }, [userProfile, profileInitialized]);

  const FeedbackBanner = ({ feedback }) => {
    if (!feedback) return null;
    const styles = feedback.type === 'error'
      ? 'border-red-500 bg-red-500/10 text-red-200'
      : 'border-green-500 bg-green-500/10 text-green-200';
    const Icon = feedback.type === 'error' ? XCircle : CheckCircle;
    return (
      <div className={`flex items-start space-x-2 border px-4 py-3 rounded-lg ${styles}`}>
        <Icon size={20} className={feedback.type === 'error' ? 'text-red-400' : 'text-green-400'} />
        <p className="text-sm">{feedback.message}</p>
      </div>
    );
  };

  const FieldError = ({ message }) => (
    message ? <p className="text-red-400 text-sm mt-1">{message}</p> : null
  );

  const validateAuthForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Enter your email address.';
    } else if (!email.includes('@')) {
      errors.email = 'Use a valid email format (name@school.edu).';
    }
    if (!password) {
      errors.password = 'Enter your password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
    if (isRegister) {
      if (!name.trim()) {
        errors.name = 'Tell us your full name.';
      }
      const year = Number(gradYear);
      if (!gradYear) {
        errors.gradYear = 'Enter your graduation year.';
      } else if (Number.isNaN(year) || year < 2024 || year > 2035) {
        errors.gradYear = 'Graduation year should be between 2024 and 2035.';
      }
    }
    setAuthErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!bio.trim()) {
      errors.bio = 'Add a short bio so others know you.';
    } else if (bio.trim().length < 10) {
      errors.bio = 'Bio should be at least 10 characters.';
    }
    if ((offeredSkills.length === 0) && (soughtSkills.length === 0)) {
      errors.skills = 'Add at least one skill you offer or want to learn.';
    }
    if (clubs.length === 0) {
      errors.clubs = 'Add at least one club or activity you are part of.';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSessionForm = () => {
    const errors = {};
    if (!selectedUser) {
      errors.selectedUser = 'Choose a student to request a session with.';
    }
    if (!sessionSkill) {
      errors.sessionSkill = 'Select a skill for this session.';
    }
    if (!sessionDate) {
      errors.sessionDate = 'Pick a date for the session.';
    }
    if (!sessionTime) {
      errors.sessionTime = 'Pick a time for the session.';
    }
    if (!sessionLocation.trim()) {
      errors.sessionLocation = 'Add a location or online link.';
    }
    if (sessionDate && sessionTime) {
      const startTime = new Date(`${sessionDate}T${sessionTime}`);
      if (Number.isNaN(startTime.getTime())) {
        errors.sessionDate = 'Enter a valid date and time.';
      } else if (startTime < new Date()) {
        errors.sessionDate = 'Choose a future time for the session.';
      }
    }
    setSessionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRatingForm = () => {
    const errors = {};
    if (!ratingScore || ratingScore < 1) {
      errors.ratingScore = 'Select a rating between 1 and 5 stars.';
    }
    if (ratingComment && ratingComment.length > 300) {
      errors.ratingComment = 'Keep comments under 300 characters.';
    }
    setRatingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (userProfile) {
      setBio(userProfile.bio || '');
      setOfferedSkills(userProfile.offeredSkills || []);
      setSoughtSkills(userProfile.soughtSkills || []);
      setProfileVisibility(userProfile.profileVisibility || 'members');
      setAllowRequestsFrom(userProfile.allowRequestsFrom || 'anyone');
      setAllowMessagesFrom(userProfile.allowMessagesFrom || 'participants');
    }
  }, [userProfile]);

  const validateMessageForm = () => {
    const errors = {};
    if (!selectedSession) {
      errors.selectedSession = 'Pick a session to message.';
    }
    if (!newMessage.trim()) {
      errors.newMessage = 'Write a message before sending.';
    } else if (newMessage.trim().length < 2) {
      errors.newMessage = 'Message is too short.';
    }
    setMessageErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const authErrorMessage = (error) => {
    if (error?.code === 'auth/invalid-credential') {
      return 'We could not sign you in with those details. Double-check your email and password.';
    }
    if (error?.code === 'auth/email-already-in-use') {
      return 'That email is already in use. Try logging in instead.';
    }
    if (error?.code === 'auth/weak-password') {
      return 'Choose a stronger password (at least 8 characters).';
    }
    return error?.message || 'Something went wrong. Please try again.';
  };
  const loadUserData = async () => {
    // Dashboard and sessions share the same data sources: user's sessions + peer list.
    if (page === 'dashboard' || page === 'sessions') {
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('participants', 'array-contains', user.uid)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const usersQuery = query(
        collection(db, 'users'),
        where('profileVisibility', 'in', ['public', 'members'])
      );
      const usersSnap = await getDocs(usersQuery);
      setAllUsers(
        usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user.uid && u.role === 'student')
      );
      const ratingsSnap = await getDocs(query(
        collection(db, 'ratings'),
        where('raterId', '==', user.uid)
      ));
      setRatedSessionIds(ratingsSnap.docs.map(doc => doc.data().sessionId));

      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user.uid && u.role === 'student'));
    }
    
    // Admin-only aggregation: full user list, all sessions, audit log history.
    if (page === 'admin' && userProfile?.role === 'admin') {
      try {
        const getReports = httpsCallable(functions, 'getAdminReports');
        const getDashboardData = httpsCallable(functions, 'getAdminDashboardData');
        const [reportsRes, dashboardRes] = await Promise.all([
          getReports(),
          getDashboardData()
        ]);
        const reports = reportsRes.data || {};
        const dashboard = dashboardRes.data || {};
        setAdminReports({
          userCounts: reports.userCounts || {},
          sessionStats: reports.sessionStats || {},
          ratingsSummary: reports.ratingsSummary || {},
          moderationFlags: reports.moderationFlags || {},
          topSkills: reports.topSkills || []
        });
        setAdminUsers(dashboard.users || []);
        setAdminSessions(dashboard.sessions || []);
        setAuditLogs(dashboard.auditLogs || []);
      } catch (error) {
        alert(error.message);
    if (page === 'admin' && isAdmin) {
      const usersSnap = await getDocs(collection(db, 'users'));
      setAdminUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      await fetchAdminReports(usersSnap.docs.length);
      
      const sessionsSnap = await getDocs(collection(db, 'sessions'));
      setAdminSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const logsSnap = await getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')));
      setAuditLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const clubDoc = await getDoc(doc(db, 'clubDetails', 'main'));
      if (clubDoc.exists()) {
        setClubDetails({
          name: clubDoc.data().name || '',
          description: clubDoc.data().description || '',
          contactEmail: clubDoc.data().contactEmail || '',
          meetingLocation: clubDoc.data().meetingLocation || '',
          meetingSchedule: clubDoc.data().meetingSchedule || ''
        });
      }
      
      calculateStats(usersSnap.docs, sessionsSnap.docs);
    }
    
    if (page === 'clubs') {
      const clubsSnap = await getDocs(query(collection(db, 'clubs'), orderBy('createdAt', 'desc')));
      setClubs(clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
  };

  const logAuditEvent = async (action, payload = {}) => {
    if (!auth.currentUser) return;
    try {
      const logEvent = httpsCallable(functions, 'logAuditEvent');
      await logEvent({ action, ...payload });
    } catch (error) {
      console.error('Failed to log audit event', error);
    }
  };

  const fetchAdminReports = async (totalUsers) => {
    try {
      const sessionCountsCallable = httpsCallable(functions, 'getAdminSessionCounts');
      const ratingsSummaryCallable = httpsCallable(functions, 'getAdminRatingsSummary');
      const topSkillsCallable = httpsCallable(functions, 'getAdminTopSkills');
      const recentActivityCallable = httpsCallable(functions, 'getAdminRecentActivity');

      const [sessionCounts, ratingsSummary, topSkills, recentActivity] = await Promise.all([
        sessionCountsCallable(),
        ratingsSummaryCallable(),
        topSkillsCallable(),
        recentActivityCallable()
      ]);

      setStats({
        totalUsers,
        totalSessions: sessionCounts.data.totalSessions || 0,
        activeSessions: sessionCounts.data.byStatus?.accepted || 0,
        pendingSessions: sessionCounts.data.byStatus?.pending || 0,
        topSkills: topSkills.data.topSkills || [],
        ratingsSummary: ratingsSummary.data,
        recentActivity: recentActivity.data.activity || []
      });
    } catch (error) {
      console.error('Failed to load admin reports', error);
  // Stats module: compute admin dashboard counts and top skills list.
  const calculateStats = (users, sessions) => {
    const skillCounts = {};
    const ratingsBySkill = {};
    
    sessions.forEach(s => {
      const session = s.data();
      if (session.skill) {
        skillCounts[session.skill] = (skillCounts[session.skill] || 0) + 1;
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (!validateAuthForm()) {
      setAuthFeedback({ type: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    try {
      if (isRegister) {
        // Registration path: write user profile + audit log entry.
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name,
          email,
          role: 'student',
          gradYear,
          createdAt: Timestamp.now(),
          offeredSkills: [],
          soughtSkills: [],
          bio: '',
          clubs: [],
          achievements: [],
          sessionsCompleted: 0,
          profileVisibility: 'members',
          allowRequestsFrom: 'anyone',
          allowMessagesFrom: 'participants'
        });
        await logAuditEvent({
          action: 'USER_REGISTERED',
          metadata: { email }
        const logAuditEvent = httpsCallable(functions, 'logAuditEvent');
        await logAuditEvent({
          action: 'USER_REGISTERED',
          targetUserId: userCred.user.uid
        await logAuditEvent('USER_REGISTERED', { targetUserId: userCred.user.uid });
        await addDoc(collection(db, 'auditLogs'), {
          action: 'USER_REGISTERED',
          userId: userCred.user.uid,
          timestamp: Timestamp.now()
        await logAuditEvent({ action: 'USER_REGISTERED' });
        await createAuditLogFn({
          action: 'USER_REGISTERED'
        });
        setAuthFeedback({ type: 'success', message: 'Account created! Let’s finish your profile.' });
      } else {
        // Login path: Firebase handles auth; UI will rehydrate via auth listener.
        await signInWithEmailAndPassword(auth, email, password);
        setAuthFeedback({ type: 'success', message: 'Welcome back! Redirecting you now.' });
      }
    } catch (error) {
      setAuthFeedback({ type: 'error', message: authErrorMessage(error) });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdmin(false);
  };

  // Profile module: update bio and skills arrays.
  const updateProfile = async () => {
    const sanitizedBio = validateTextField('Bio', bio, TEXT_LIMITS.bio);
    if (sanitizedBio === null) {
      return;
    }
    const sanitizedOfferedSkills = sanitizeSkillList(offeredSkills, 'Offered');
    if (sanitizedOfferedSkills === null) {
      return;
    }
    const sanitizedSoughtSkills = sanitizeSkillList(soughtSkills, 'Sought');
    if (sanitizedSoughtSkills === null) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio: sanitizedBio,
        offeredSkills: sanitizedOfferedSkills,
        soughtSkills: sanitizedSoughtSkills
      });
      setBio(sanitizedBio);
      setOfferedSkills(sanitizedOfferedSkills);
      setSoughtSkills(sanitizedSoughtSkills);
      setUserProfile({ ...userProfile, bio: sanitizedBio, offeredSkills: sanitizedOfferedSkills, soughtSkills: sanitizedSoughtSkills });
      alert('Profile updated!');
    setProfileFeedback(null);
    if (!validateProfileForm()) {
      setProfileFeedback({ type: 'error', message: 'Please update the highlighted fields.' });
      return;
    }
    try {
      const bioError = validateBio(bio);
      if (bioError) {
        alert(bioError);
        return;
      }
      const offeredError = validateSkillList(offeredSkills, 'Offered');
      if (offeredError) {
        alert(offeredError);
        return;
      }
      const soughtError = validateSkillList(soughtSkills, 'Sought');
      if (soughtError) {
        alert(soughtError);
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        bio,
        offeredSkills,
        soughtSkills,
        profileVisibility,
        allowRequestsFrom,
        allowMessagesFrom
      });
      setUserProfile({
        ...userProfile,
        bio,
        offeredSkills,
        soughtSkills,
        profileVisibility,
        allowRequestsFrom,
        allowMessagesFrom
      });
      alert('Profile updated!');
        clubs
      });
      setUserProfile({ ...userProfile, bio, offeredSkills, soughtSkills, clubs });
      setProfileErrors({});
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      setProfileFeedback({ type: 'error', message: error.message });
    }
  };

  // Skill editor: locally accumulate new offered/sought skills.
  const addSkill = () => {
    const error = validateSkillName(newSkill);
    if (error) {
      alert(error);
      return;
    }
    const currentSkills = skillType === 'offered' ? offeredSkills : soughtSkills;
    if (currentSkills.length >= MAX_SKILLS) {
      alert(`You can only add up to ${MAX_SKILLS} skills.`);
      return;
    }
    if (currentSkills.some(skill => skill.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      alert('That skill is already listed.');
      return;
    }
    if (skillType === 'offered') {
      setOfferedSkills([...offeredSkills, { name: newSkill.trim(), proficiency: 'intermediate' }]);
    } else {
      setSoughtSkills([...soughtSkills, { name: newSkill.trim(), interest: 'high' }]);
    const sanitizedSkill = validateTextField('Skill', newSkill, TEXT_LIMITS.skill, true);
    if (sanitizedSkill === null || !sanitizedSkill) {
      return;
    }
    if (skillType === 'offered') {
      setOfferedSkills([...offeredSkills, { name: sanitizedSkill, proficiency: 'intermediate' }]);
    } else {
      setSoughtSkills([...soughtSkills, { name: sanitizedSkill, interest: 'high' }]);
    if (!newSkill.trim()) {
      setProfileFeedback({ type: 'error', message: 'Add a skill name before saving.' });
      return;
    }
    const normalizedSkill = newSkill.trim().toLowerCase();
    if (skillType === 'offered') {
      if (offeredSkills.some(skill => skill.name.toLowerCase() === normalizedSkill)) {
        setProfileFeedback({ type: 'error', message: 'That offered skill is already listed.' });
        return;
      }
      setOfferedSkills([...offeredSkills, { name: newSkill.trim(), proficiency: 'intermediate' }]);
      setProfileErrors((prev) => ({ ...prev, skills: null }));
      setProfileFeedback({ type: 'success', message: 'Offered skill added.' });
    } else {
      if (soughtSkills.some(skill => skill.name.toLowerCase() === normalizedSkill)) {
        setProfileFeedback({ type: 'error', message: 'That learning goal is already listed.' });
        return;
      }
      setSoughtSkills([...soughtSkills, { name: newSkill.trim(), interest: 'high' }]);
      setProfileErrors((prev) => ({ ...prev, skills: null }));
      setProfileFeedback({ type: 'success', message: 'Learning goal added.' });
    }
    setNewSkill('');
  };

  // Session request flow: validates input, writes session + audit log.
  const addClub = () => {
    if (!newClub.trim()) {
      setProfileFeedback({ type: 'error', message: 'Enter a club or activity name.' });
      return;
    }
    const normalizedClub = newClub.trim().toLowerCase();
    if (clubs.some(club => club.toLowerCase() === normalizedClub)) {
      setProfileFeedback({ type: 'error', message: 'That club is already listed.' });
      return;
    }
    setClubs([...clubs, newClub.trim()]);
    setNewClub('');
    setProfileErrors((prev) => ({ ...prev, clubs: null }));
    setProfileFeedback({ type: 'success', message: 'Club added.' });
  };

  const requestSession = async () => {
    setSessionFeedback(null);
    if (!validateSessionForm()) {
      setSessionFeedback({ type: 'error', message: 'Please complete the required fields.' });
      return;
    }

    const skillError = validateSkillName(sessionSkill);
    if (skillError) {
      alert(skillError);
      return;
    }
    if (sessionLocation && sessionLocation.trim().length > MAX_CLUB_FIELD_LENGTH) {
      alert(`Location must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`);
      return;
    }
    if (selectedUser.allowRequestsFrom === 'none') {
      alert('This user is not accepting session requests.');
      return;
    }

    const skillError = validateSkillName(sessionSkill);
    if (skillError) {
      alert(skillError);
      return;
    }
    if (sessionLocation && sessionLocation.trim().length > MAX_CLUB_FIELD_LENGTH) {
      alert(`Location must be ${MAX_CLUB_FIELD_LENGTH} characters or less.`);
      return;
    }
    if (selectedUser.allowRequestsFrom === 'none') {
      alert('This user is not accepting session requests.');
      return;
    }
    
    const sanitizedSkill = validateTextField('Session skill', sessionSkill, TEXT_LIMITS.sessionSkill, true);
    if (sanitizedSkill === null) {
      return;
    }
    const sanitizedLocation = sessionLocation
      ? validateTextField('Session location', sessionLocation, TEXT_LIMITS.sessionLocation, true)
      : '';
    if (sanitizedLocation === null) {
      return;
    }

    try {
      await createSessionFn({
        providerId: selectedUser.id,
        providerName: selectedUser.name,
        skill: sessionSkill.trim(),
        startTime: new Date(`${sessionDate}T${sessionTime}`),
        location: sessionLocation.trim(),
        startTime: new Date(`${sessionDate}T${sessionTime}`),
        location: sessionLocation.trim(),
        skill: sanitizedSkill,
        skill: sessionSkill,
        startTime: new Date(`${sessionDate}T${sessionTime}`),
        location: sanitizedLocation,
        status: 'pending',
        participants: [user.uid, selectedUser.id],
        createdAt: Timestamp.now()
      });
      
      await logAuditEvent({
        action: 'SESSION_REQUESTED',
        sessionId: sessionDoc.id,
        metadata: { requestedSkill: sessionSkill, providerId: selectedUser.id }
      const logAuditEvent = httpsCallable(functions, 'logAuditEvent');
      await logAuditEvent({
        action: 'SESSION_REQUESTED',
        sessionId: sessionDoc.id,
        targetUserId: selectedUser.id
      await logAuditEvent('SESSION_REQUESTED', { sessionId: sessionDoc.id });
      
      await logAuditEvent('SESSION_REQUESTED', {
        sessionId: sessionDoc.id,
        targetUserId: selectedUser.id
      await logAuditEvent({ action: 'SESSION_REQUESTED', sessionId: sessionDoc.id });
        startTime: new Date(`${sessionDate}T${sessionTime}`).toISOString(),
        location: sessionLocation
      });
      
      setSessionFeedback({ type: 'success', message: 'Session requested! You will be notified when it is accepted.' });
      setSelectedUser(null);
      setSessionSkill('');
      setSessionDate('');
      setSessionTime('');
      setSessionLocation('');
      setSessionErrors({});
      loadUserData();
    } catch (error) {
      setSessionFeedback({ type: 'error', message: error.message });
    }
  };

  // Session lifecycle updates: status change, completion triggers achievements.
  const updateSessionStatus = async (sessionId, status) => {
    setSessionFeedback(null);
    try {
      const changeSessionStatus = httpsCallable(functions, 'changeSessionStatus');
      await changeSessionStatus({ sessionId, status });
      await callFunction('updateSessionStatus', { sessionId, status });
      await updateSessionStatusCallable({ sessionId, status });
      const response = await updateSessionStatusFn({ sessionId, status });
      
      if (status === 'completed' && response.data?.sessionsCompleted !== undefined) {
        const newCount = response.data.sessionsCompleted;
        setUserProfile({ ...userProfile, sessionsCompleted: newCount });
        checkAchievements(newCount);
      }
      
      await logAuditEvent({
      await logAuditEvent(`SESSION_${status.toUpperCase()}`, {
        sessionId
      const updateStatus = httpsCallable(functions, 'updateSessionStatus');
      await updateStatus({ sessionId, status });
      
      if (status === 'completed') {
        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        const updatedCount = userSnapshot.data()?.sessionsCompleted || 0;
        const updatedAchievements = userSnapshot.data()?.achievements || [];
        await checkAchievements(updatedCount, updatedAchievements);
      }
      
      await addDoc(collection(db, 'auditLogs'), {
        action: `SESSION_${status.toUpperCase()}`,
        sessionId,
        metadata: { status }
      });
      
      setSessionFeedback({ type: 'success', message: `Session marked as ${status}.` });
      setSessionErrors({});
      loadUserData();
    } catch (error) {
      setSessionFeedback({ type: 'error', message: error.message });
    }
  };

  // Achievements module: milestone-based awards stored on user profile.
  const checkAchievements = async (sessionCount) => {
  const checkAchievements = async (sessionCount, existingAchievements = userProfile.achievements || []) => {
    const newAchievements = [];
    
    if (sessionCount === 1 && !existingAchievements.includes('first_session')) {
      newAchievements.push('first_session');
    }
    if (sessionCount === 5 && !existingAchievements.includes('five_sessions')) {
      newAchievements.push('five_sessions');
    }
    if (sessionCount === 10 && !existingAchievements.includes('ten_sessions')) {
      newAchievements.push('ten_sessions');
    }
    
    if (newAchievements.length > 0) {
      await updateDoc(doc(db, 'users', user.uid), {
        achievements: [...existingAchievements, ...newAchievements]
      });
      setUserProfile({
        ...userProfile,
        achievements: [...existingAchievements, ...newAchievements]
      });
    }
  };

  // Ratings module: store rating + award five-star achievement when applicable.
  const normalizeRatingScore = (score) => {
    const numericScore = Math.round(Number(score));
    if (Number.isNaN(numericScore)) return null;
    return Math.min(5, Math.max(1, numericScore));
  };

  const sanitizeRatingComment = (comment) => {
    if (!comment) return '';
    const withoutTags = comment.replace(/<[^>]*>/g, '');
    return withoutTags.replace(/\s+/g, ' ').trim().slice(0, 500);
  };

  const submitRating = async (sessionId) => {
    const sanitizedComment = ratingComment
      ? validateTextField('Rating comment', ratingComment, TEXT_LIMITS.ratingComment)
      : '';
    if (sanitizedComment === null) {
      return;
    }

    setRatingFeedback(null);
    if (!validateRatingForm()) {
      setRatingFeedback({ type: 'error', message: 'Please fix the rating details.' });
      return;
    }
    try {
      const submitRatingFn = httpsCallable(functions, 'submitRating');
      await submitRatingFn({
      await callFunction('submitRating', { sessionId, score: ratingScore, comment: ratingComment });
      alert('Rating submitted!');
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        alert('Session not found.');
        return;
      }
      const ratingError = validateRating(ratingScore, ratingComment);
      if (ratingError) {
        alert(ratingError);
        return;
      }
      if (session.status !== 'completed') {
        alert('Ratings can only be submitted for completed sessions.');
        return;
      }
      if (!session.participants?.includes(user.uid)) {
        alert('Only session participants can submit ratings.');
        return;
      }

      const ratingScoreValue = normalizeRatingScore(ratingScore);
      if (!ratingScoreValue) {
        alert('Please select a rating between 1 and 5.');
        return;
      }

      const sanitizedComment = sanitizeRatingComment(ratingComment);

      const ratingQuery = query(
        collection(db, 'ratings'),
        where('sessionId', '==', sessionId),
        where('raterId', '==', user.uid)
      );
      const existingRatingSnap = await getDocs(ratingQuery);
      if (!existingRatingSnap.empty) {
        alert('You have already rated this session.');
        return;
      }

      const rateeId = session.requesterId === user.uid ? session.providerId : session.requesterId;
      
      await addDoc(collection(db, 'ratings'), {
        sessionId,
        score: ratingScore,
        comment: ratingComment
      });
      
      alert('Rating submitted!');
        comment: ratingComment.trim(),
        score: ratingScoreValue,
        comment: sanitizedComment,
        createdAt: Timestamp.now()
      });
      
      if (ratingScoreValue === 5) {
        const rateeProfile = await getDoc(doc(db, 'users', rateeId));
        if (rateeProfile.exists() && !rateeProfile.data().achievements?.includes('five_star')) {
          await updateDoc(doc(db, 'users', rateeId), {
            achievements: [...(rateeProfile.data().achievements || []), 'five_star']
          });
        }
      }
      
      setRatingFeedback({ type: 'success', message: 'Rating submitted. Thank you for the feedback!' });
      setRatingScore(5);
      setRatingComment('');
      setSelectedSession(null);
      setRatedSessionIds(prev => (prev.includes(sessionId) ? prev : [...prev, sessionId]));
      setRatingErrors({});
      loadUserData();
    } catch (error) {
      setRatingFeedback({ type: 'error', message: error.message });
    }
  };

  // Messaging module: write message scoped to selected session.
  const sendMessage = async () => {
    if (!selectedSession) return;
    if (allowMessagesFrom === 'none') {
      alert('Your privacy settings do not allow sending messages.');
      return;
    }
    const messageError = validateMessage(newMessage);
    if (messageError) {
      alert(messageError);
      return;
    }
    if (selectedSession.participants && !selectedSession.participants.includes(user.uid)) {
      alert('You do not have permission to message this session.');
    if (!newMessage.trim() || !selectedSession) return;

    const sanitizedMessage = validateTextField('Message', newMessage, TEXT_LIMITS.message);
    if (sanitizedMessage === null || !sanitizedMessage) {
    setMessageFeedback(null);
    if (!validateMessageForm()) {
      setMessageFeedback({ type: 'error', message: 'Write a message before sending.' });
      return;
    }
    
    try {
      await addDoc(collection(db, 'messages'), {
        sessionId: selectedSession.id,
        fromUserId: user.uid,
        fromName: userProfile.name,
        body: newMessage.trim(),
        body: sanitizedMessage,
        createdAt: Timestamp.now()
      });
      
      setNewMessage('');
      setMessageErrors({});
      setMessageFeedback({ type: 'success', message: 'Message sent.' });
      loadMessages(selectedSession.id);
    } catch (error) {
      setMessageFeedback({ type: 'error', message: error.message });
    }
  };

  // Messaging module: fetch chat history for the session in time order.
  const loadMessages = async (sessionId) => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc')
    );
    const messagesSnap = await getDocs(messagesQuery);
    setMessages(messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Admin action: delete user and record audit log entry.
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
  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    
    try {
      const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
      await deleteUserAccount({ userId });
      const deleteUserCallable = httpsCallable(functions, 'adminDeleteUser');
      await deleteUserCallable({ targetUserId: userId });
      await callFunction('deleteUser', { userId });
      await deleteDoc(doc(db, 'users', userId));
      await logAuditEvent({
        action: 'ADMIN_USER_DELETED',
        targetUserId: userId
      await logAuditEvent('USER_DELETED', { targetUserId: userId });
      await logAuditEvent({ action: 'USER_DELETED', targetUserId: userId });
      await deleteUserFn({ targetUserId: userId });
      const deleteUserAndData = httpsCallable(functions, 'deleteUserAndData');
      await deleteUserAndData({ userId });
      const deleteUserCascade = httpsCallable(functions, 'deleteUserCascade');
      await deleteUserCascade({ userId });
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const createClub = async () => {
    if (!user) {
      alert('Please log in to create a club.');
      return;
    }
    const trimmedName = clubName.trim();
    const trimmedDescription = clubDescription.trim();
    const trimmedSchedule = clubSchedule.trim();
    if (!trimmedName || !trimmedDescription) {
      alert('Club name and description are required.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'clubs'), {
        name: trimmedName,
        description: trimmedDescription,
        schedule: trimmedSchedule,
        ownerId: user.uid,
        ownerName: userProfile?.name || 'Unknown',
        members: [user.uid],
        createdAt: Timestamp.now()
      });
      setClubName('');
      setClubDescription('');
      setClubSchedule('');
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const startEditingClub = (club) => {
    setEditingClubId(club.id);
    setEditClubName(club.name || '');
    setEditClubDescription(club.description || '');
    setEditClubSchedule(club.schedule || '');
  };

  const cancelEditingClub = () => {
    setEditingClubId(null);
    setEditClubName('');
    setEditClubDescription('');
    setEditClubSchedule('');
  };

  const updateClub = async (club) => {
    if (!user) {
      alert('Please log in to update clubs.');
      return;
    }
    const isOwner = club.ownerId === user.uid;
    const isAdmin = userProfile?.role === 'admin';
    if (!isOwner && !isAdmin) {
      alert('Only the club owner or an admin can update this club.');
      return;
    }
    const trimmedName = editClubName.trim();
    const trimmedDescription = editClubDescription.trim();
    const trimmedSchedule = editClubSchedule.trim();
    if (!trimmedName || !trimmedDescription) {
      alert('Club name and description are required.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'clubs', club.id), {
        name: trimmedName,
        description: trimmedDescription,
        schedule: trimmedSchedule
      });
      cancelEditingClub();
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteClub = async (club) => {
    if (!user) {
      alert('Please log in to manage clubs.');
      return;
    }
    const isOwner = club.ownerId === user.uid;
    const isAdmin = userProfile?.role === 'admin';
    if (!isOwner && !isAdmin) {
      alert('Only the club owner or an admin can delete this club.');
      return;
    }
    if (!window.confirm('Delete this club?')) return;
    
    try {
      await deleteDoc(doc(db, 'clubs', club.id));
      if (editingClubId === club.id) {
        cancelEditingClub();
      }
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const joinClub = async (club) => {
    if (!user) {
      alert('Please log in to join clubs.');
      return;
    }
    if (club.members?.includes(user.uid)) {
      alert('You are already a member of this club.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'clubs', club.id), {
        members: arrayUnion(user.uid)
      });
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const leaveClub = async (club) => {
    if (!user) {
      alert('Please log in to update membership.');
      return;
    }
    if (!club.members?.includes(user.uid)) {
      alert('You are not a member of this club.');
      return;
    }
    if (club.ownerId === user.uid) {
      alert('Club owners cannot leave their own club. Please delete or transfer ownership.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'clubs', club.id), {
        members: arrayRemove(user.uid)
      });
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const saveClubDetails = async () => {
    const error = validateClubDetails(clubDetails);
    if (error) {
      alert(error);
      return;
    }
    try {
      await setDoc(doc(db, 'clubDetails', 'main'), {
        name: clubDetails.name.trim(),
        description: clubDetails.description.trim(),
        contactEmail: clubDetails.contactEmail.trim(),
        meetingLocation: clubDetails.meetingLocation.trim(),
        meetingSchedule: clubDetails.meetingSchedule.trim(),
        updatedAt: Timestamp.now(),
        updatedBy: user.uid
      });
      alert('Club details updated!');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
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
  if (!secureTransport && import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-red-500 rounded-2xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Secure Connection Required</h1>
          <p className="text-gray-300">
            Please access SkillSwap over HTTPS to protect your data in transit.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-orange-500">
            <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
              SkillSwap
            </h1>
            <p className="text-gray-400 text-center mb-8">Student Talent Exchange Platform</p>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Graduation Year"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-blue-600 transition"
              >
                {isRegister ? 'Register' : 'Login'}
              </button>
            </form>
            
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-orange-500">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
            SkillSwap
          </h1>
          <p className="text-gray-400 text-center mb-8">Student Talent Exchange Platform</p>
          <div className="mb-4">
            <FeedbackBanner feedback={authFeedback} />
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  required
                />
                <FieldError message={authErrors.name} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="number"
                  placeholder="Graduation Year"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
                <FieldError message={authErrors.gradYear} />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
            <FieldError message={authErrors.email} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
            <FieldError message={authErrors.password} />
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="w-full mt-4 text-blue-400 hover:text-blue-300 transition"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </form>
          
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setAuthErrors({});
              setAuthFeedback(null);
            }}
            className="w-full mt-4 text-blue-400 hover:text-blue-300 transition"
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
          
          <div className="mt-8 text-center text-xs text-gray-500">
            BPA SkillSwap | Frisco, Texas | 2026
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const Navigation = () => (
    <nav className="app-nav bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="app-nav__container flex items-center justify-between max-w-7xl mx-auto">
        <div className="app-nav__left flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
            SkillSwap
          </h1>
          {userProfile?.role === 'student' && (
            <div className="app-nav__links flex space-x-4">
          {!isAdmin && (
            <div className="flex space-x-4">
              <button onClick={() => setPage('dashboard')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'dashboard' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <Home size={20} />
                <span>Dashboard</span>
              </button>
              <button onClick={() => setPage('sessions')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'sessions' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <Calendar size={20} />
                <span>Sessions</span>
              </button>
              <button onClick={() => setPage('clubs')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'clubs' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <Users size={20} />
                <span>Clubs</span>
              </button>
              <button onClick={() => setPage('profile')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'profile' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <User size={20} />
                <span>Profile</span>
              </button>
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setPage('admin')} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg">
              <Shield size={20} />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
        <div className="app-nav__right flex items-center space-x-4">
          <span className="text-gray-300">{userProfile?.name}</span>
          <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );

  const Footer = () => (
    <footer className="border-t border-gray-700 bg-gray-900/80">
      <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-gray-400 space-y-2">
        <p className="text-gray-300 font-semibold">Event Credits & Theme</p>
        <p>
          Chapter: Frisco High School BPA | Team: Avery Chen, Jordan Lee, Priya Patel, Marcus Rivera
        </p>
        <p>
          School: Frisco High School | City/State: Frisco, TX | Theme: SkillSwap — Connect, Learn, Grow | Year: 2026
        </p>
      </div>
    </footer>
  );

  if (page === 'dashboard') {
    const filteredUsers = allUsers.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.offeredSkills?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome back, {userProfile?.name}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Sessions Completed</p>
                    <p className="text-3xl font-bold text-orange-400">{userProfile?.sessionsCompleted || 0}</p>
                  </div>
                  <CheckCircle className="text-orange-400" size={40} />
                </div>
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
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'request-session' && selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-3xl mx-auto p-6">
          <button
            onClick={() => setPage('dashboard')}
            className="mb-6 text-blue-400 hover:text-blue-300 flex items-center"
          >
            ← Back to Dashboard
          </button>
          
          <div className="bg-gray-800 p-8 rounded-lg border border-orange-500">
            <h2 className="text-2xl font-bold text-white mb-6">Request Session with {selectedUser.name}</h2>
            <div className="mb-6">
              <FeedbackBanner feedback={sessionFeedback} />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Select Skill</label>
                <select
                  value={sessionSkill}
                  onChange={(e) => setSessionSkill(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Choose a skill...</option>
                  {selectedUser.offeredSkills?.map((skill, idx) => (
                    <option key={idx} value={skill.name}>{skill.name}</option>
                  ))}
                </select>
                <FieldError message={sessionErrors.sessionSkill} />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <FieldError message={sessionErrors.sessionDate} />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Time</label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <FieldError message={sessionErrors.sessionTime} />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Location / Online Link</label>
                <input
                  type="text"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  placeholder="Library, Room 201, or Zoom link..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <FieldError message={sessionErrors.sessionLocation} />
              </div>
              
              <button
                onClick={requestSession}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-blue-600 transition"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'sessions') {
    const pendingSessions = sessions.filter(s => s.status === 'pending');
    const upcomingSessions = sessions.filter(s => s.status === 'accepted');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-3xl font-bold text-white mb-6">My Sessions</h2>
          <div className="mb-6">
            <FeedbackBanner feedback={sessionFeedback} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center">
                <Clock className="mr-2" />
                Pending ({pendingSessions.length})
              </h3>
              <div className="space-y-3">
                {pendingSessions.map(session => (
                  <div key={session.id} className="bg-gray-700 p-4 rounded-lg">
                    <p className="font-bold text-white">{session.skill}</p>
                    <p className="text-sm text-gray-400">
                      {session.requesterId === user.uid ? `With ${session.providerName}` : `From ${session.requesterName}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {session.startTime?.toDate?.()?.toLocaleString()}
                    </p>
                    {session.providerId === user.uid && (
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => updateSessionStatus(session.id, 'accepted')}
                          className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateSessionStatus(session.id, 'declined')}
                          className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {pendingSessions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending sessions</p>
                )}
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
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
              <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
                <CheckCircle className="mr-2" />
                Completed ({completedSessions.length})
              </h3>
              <div className="space-y-3">
                {completedSessions.map(session => (
                  <div key={session.id} className="bg-gray-700 p-4 rounded-lg">
                    <p className="font-bold text-white">{session.skill}</p>
                    <p className="text-sm text-gray-400">
                      {session.requesterId === user.uid ? `With ${session.providerName}` : `With ${session.requesterName}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {session.startTime?.toDate?.()?.toLocaleDateString()}
                    </p>
                    {ratedSessionIds.includes(session.id) && (
                      <p className="text-xs text-green-400 mt-2">Rating submitted</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setPage('rate-session');
                      }}
                      disabled={ratedSessionIds.includes(session.id)}
                      className={`w-full mt-3 py-2 rounded text-sm flex items-center justify-center transition ${
                        ratedSessionIds.includes(session.id)
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                    >
                      <Star size={16} className="mr-1" />
                      {ratedSessionIds.includes(session.id) ? 'Rated' : 'Rate Session'}
                    </button>
                  </div>
                ))}
                {completedSessions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No completed sessions yet</p>
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
      </div>
    );
  }

  if (page === 'clubs') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Student Clubs</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <h3 className="text-xl font-bold text-white mb-4">Start a Club</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Club name"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
                <textarea
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  placeholder="Describe the club mission..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none h-28"
                />
                <input
                  type="text"
                  value={clubSchedule}
                  onChange={(e) => setClubSchedule(e.target.value)}
                  placeholder="Meeting schedule (optional)"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={createClub}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-blue-600 transition"
                >
                  Create Club
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
              {clubs.map(club => {
                const isOwner = club.ownerId === user?.uid;
                const isAdmin = userProfile?.role === 'admin';
                const isMember = club.members?.includes(user?.uid);
                const isEditing = editingClubId === club.id;
                
                return (
                  <div key={club.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{club.name}</h3>
                        <p className="text-sm text-gray-400">Owner: {club.ownerName || 'Unknown'}</p>
                      </div>
                      <div className="text-sm text-gray-400">{club.members?.length || 0} members</div>
                    </div>
                    
                    {isEditing ? (
                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          value={editClubName}
                          onChange={(e) => setEditClubName(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                        <textarea
                          value={editClubDescription}
                          onChange={(e) => setEditClubDescription(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none h-24"
                        />
                        <input
                          type="text"
                          value={editClubSchedule}
                          onChange={(e) => setEditClubSchedule(e.target.value)}
                          placeholder="Meeting schedule (optional)"
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateClub(club)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditingClub}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-4 text-gray-300">{club.description}</p>
                        {club.schedule && (
                          <p className="mt-2 text-sm text-gray-400">Schedule: {club.schedule}</p>
                        )}
                      </>
                    )}
                    
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {(isOwner || isAdmin) && !isEditing && (
                        <>
                          <button
                            onClick={() => startEditingClub(club)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteClub(club)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {!isEditing && (
                        <>
                          {isOwner && (
                            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs">Owner</span>
                          )}
                          {!isOwner && isMember && (
                            <button
                              onClick={() => leaveClub(club)}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                            >
                              Leave Club
                            </button>
                          )}
                          {!isOwner && !isMember && (
                            <button
                              onClick={() => joinClub(club)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                            >
                              Join Club
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {clubs.length === 0 && (
                <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center text-gray-400">
                  No clubs yet. Be the first to start one!
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'messages' && selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => {
              setPage('sessions');
              setSelectedSession(null);
            }}
            className="mb-6 text-blue-400 hover:text-blue-300 flex items-center"
          >
            ← Back to Sessions
          </button>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MessageCircle className="mr-2 text-blue-400" />
              Chat: {selectedSession.skill} Session
            </h2>
            <div className="mb-4">
              <FeedbackBanner feedback={messageFeedback} />
              <FieldError message={messageErrors.selectedSession} />
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto mb-4">
              {messages.map(msg => (
                <div key={msg.id} className={`mb-4 ${msg.fromUserId === user.uid ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${msg.fromUserId === user.uid ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <p className="text-xs text-gray-400 mb-1">{msg.fromName}</p>
                    <p className="text-white">{msg.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
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
            <FieldError message={messageErrors.newMessage} />
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'rate-session' && selectedSession) {
    const isRatingAllowed = selectedSession.status === 'completed' && selectedSession.participants?.includes(user.uid);
    const hasRatedSession = ratedSessionIds.includes(selectedSession.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-3xl mx-auto p-6">
          <button
            onClick={() => {
              setPage('sessions');
              setSelectedSession(null);
            }}
            className="mb-6 text-blue-400 hover:text-blue-300 flex items-center"
          >
            ← Back to Sessions
          </button>
          
          <div className="bg-gray-800 p-8 rounded-lg border border-yellow-500">
            <h2 className="text-2xl font-bold text-white mb-6">Rate Your Session</h2>
            <div className="mb-4">
              <FeedbackBanner feedback={ratingFeedback} />
            </div>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Session: {selectedSession.skill}</p>
              <p className="text-gray-400">
                With: {selectedSession.requesterId === user.uid ? selectedSession.providerName : selectedSession.requesterName}
              </p>
            </div>

            {(!isRatingAllowed || hasRatedSession) && (
              <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
                {!isRatingAllowed && <p>You can only rate completed sessions you participated in.</p>}
                {hasRatedSession && <p>You have already rated this session.</p>}
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-3">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => setRatingScore(score)}
                    className={`p-3 rounded-lg transition ${ratingScore >= score ? 'text-yellow-400' : 'text-gray-600'}`}
                  >
                    <Star size={32} fill={ratingScore >= score ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <FieldError message={ratingErrors.ratingScore} />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Comment (optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none h-32"
              />
              <FieldError message={ratingErrors.ratingComment} />
            </div>
            
            <button
              onClick={() => submitRating(selectedSession.id)}
              disabled={!isRatingAllowed || hasRatedSession}
              className={`w-full py-3 text-white font-bold rounded-lg transition ${
                !isRatingAllowed || hasRatedSession
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              }`}
            >
              Submit Rating
            </button>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 p-8 rounded-lg border border-orange-500 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>
            <div className="mb-4">
              <FeedbackBanner feedback={profileFeedback} />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Bio</label>
                <textarea
                  value={bio || userProfile?.bio || ''}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/{MAX_BIO_LENGTH} characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Profile Visibility</label>
                  <select
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="members">Members Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Session Requests</label>
                  <select
                    value={allowRequestsFrom}
                    onChange={(e) => setAllowRequestsFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="anyone">Allow from anyone</option>
                    <option value="none">Do not allow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Messages</label>
                  <select
                    value={allowMessagesFrom}
                    onChange={(e) => setAllowMessagesFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="participants">Session participants only</option>
                    <option value="none">Do not allow</option>
                  </select>
                </div>
                <FieldError message={profileErrors.bio} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <h3 className="text-xl font-bold text-orange-400 mb-4">Skills I Offer</h3>
              
              <div className="mb-4 space-y-2">
                {offeredSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <span className="text-white">{skill.name}</span>
                    <button
                      onClick={() => setOfferedSkills(offeredSkills.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
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

            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold text-blue-400 mb-4">Skills I Want to Learn</h3>
              
              <div className="mb-4 space-y-2">
                {soughtSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <span className="text-white">{skill.name}</span>
                    <button
                      onClick={() => setSoughtSkills(soughtSkills.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
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
          <FieldError message={profileErrors.skills} />

          <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-green-500">
            <h3 className="text-xl font-bold text-green-400 mb-4">Clubs & Activities</h3>
            <div className="mb-4 space-y-2">
              {(clubs.length > 0 ? clubs : userProfile?.clubs || []).map((club, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">{club}</span>
                  <button
                    onClick={() => setClubs(clubs.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newClub}
                onChange={(e) => setNewClub(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addClub();
                  }
                }}
                placeholder="Add a club or activity..."
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={addClub}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Add
              </button>
            </div>
            <FieldError message={profileErrors.clubs} />
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (page === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col">
        <Navigation />
        
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Shield className="mr-3 text-orange-400" />
            Admin Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-orange-400">{adminReports.userCounts?.totalUsers || 0}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-400">{adminReports.sessionStats?.totalSessions || 0}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
              <p className="text-gray-400 text-sm">Avg. Rating</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.activeSessions || 0}
                {(adminReports.ratingsSummary?.averageScore || 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
              <p className="text-gray-400 text-sm">Open Flags</p>
              <p className="text-3xl font-bold text-yellow-400">
                {stats.pendingSessions || 0}
                {adminReports.moderationFlags?.openFlags || 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <BarChart3 className="mr-2 text-green-400" />
                Session Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Accepted</span>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                    {adminReports.sessionStats?.accepted || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Pending</span>
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                    {adminReports.sessionStats?.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Completed</span>
                  <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                    {adminReports.sessionStats?.completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Declined</span>
                  <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm">
                    {adminReports.sessionStats?.declined || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="mr-2 text-orange-400" />
                Top Skills Requested
              </h3>
              <div className="space-y-3">
                {stats.topSkills?.map(({ skill, count }, idx) => (
                {adminReports.topSkills?.map(([skill, count], idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <span className="text-white font-semibold">{skill}</span>
                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                      {count} sessions
                    </span>
                  </div>
                ))}
                {(!adminReports.topSkills || adminReports.topSkills.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No data yet</p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Star className="mr-2 text-green-400" />
                Ratings Summary
              </h3>
              {stats.ratingsSummary ? (
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Average Rating</span>
                    <span className="font-semibold text-green-300">
                      {stats.ratingsSummary.averageScore?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Ratings</span>
                    <span className="font-semibold text-green-300">
                      {stats.ratingsSummary.totalRatings || 0}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map(score => (
                      <div key={score} className="flex items-center justify-between text-xs text-gray-400">
                        <span>{score} stars</span>
                        <span>{stats.ratingsSummary.scoreBreakdown?.[score] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No ratings yet</p>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <BarChart3 className="mr-2 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.recentActivity.map(log => (
                  <div key={log.id} className="bg-gray-700 p-3 rounded-lg text-sm">
                    <p className="text-white font-semibold">{log.action}</p>
                    <p className="text-gray-400 text-xs">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
                      {log.createdAt?.toDate?.()?.toLocaleString() || log.timestamp?.toDate?.()?.toLocaleString() || log.createdAt}
                      {log.createdAt?.toDate?.()?.toLocaleString()}
                      {(log.createdAt || log.timestamp)?.toDate?.()?.toLocaleString()}
                    </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Star className="mr-2 text-yellow-400" />
                Ratings Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Total Ratings</span>
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                    {adminReports.ratingsSummary?.totalRatings || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">5-Star Rate</span>
                  <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                    {adminReports.ratingsSummary?.fiveStarRate || 0}%
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(score => (
                    <div key={score} className="bg-gray-700 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400">{score}★</p>
                      <p className="text-white font-semibold">{adminReports.ratingsSummary?.distribution?.[score] || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-red-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Shield className="mr-2 text-red-400" />
                Moderation Flags
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Total Flags</span>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">
                    {adminReports.moderationFlags?.totalFlags || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Open</span>
                  <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                    {adminReports.moderationFlags?.openFlags || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <span className="text-white">Resolved</span>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                    {adminReports.moderationFlags?.resolvedFlags || 0}
                  </span>
                </div>
              </div>
            </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-blue-500 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Users className="mr-2 text-blue-400" />
              Club Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 mb-2">Club Name</label>
                <input
                  type="text"
                  value={clubDetails.name}
                  onChange={(e) => setClubDetails({ ...clubDetails, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="SkillSwap Club"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={clubDetails.contactEmail}
                  onChange={(e) => setClubDetails({ ...clubDetails, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="club@school.edu"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Meeting Location</label>
                <input
                  type="text"
                  value={clubDetails.meetingLocation}
                  onChange={(e) => setClubDetails({ ...clubDetails, meetingLocation: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Room 204"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Meeting Schedule</label>
                <input
                  type="text"
                  value={clubDetails.meetingSchedule}
                  onChange={(e) => setClubDetails({ ...clubDetails, meetingSchedule: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Wednesdays at 3:30 PM"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">Description</label>
              <textarea
                value={clubDetails.description}
                onChange={(e) => setClubDetails({ ...clubDetails, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-28"
                placeholder="Share the mission of the club..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {clubDetails.description.length}/{MAX_CLUB_DESCRIPTION_LENGTH} characters
              </p>
            </div>
            <button
              onClick={saveClubDetails}
              className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Save Club Details
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Users className="mr-2 text-orange-400" />
              User Management
            </h3>
            <div className="overflow-x-auto">
              <table className="responsive-table w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400">Role</th>
                    <th className="text-left py-3 px-4 text-gray-400">Sessions</th>
                    <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4 text-white">{u.name}</td>
                      <td className="py-3 px-4 text-gray-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{u.sessionsCompleted || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
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
