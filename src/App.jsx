import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
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

const firebaseConfig = {
  apiKey: "AIzaSyAhPSxvy-XQMcZp9BZQ1vmjJE-sFsTCHdA",
  authDomain: "bpa-skill-swap.firebaseapp.com",
  projectId: "bpa-skill-swap",
  storageBucket: "bpa-skill-swap.firebasestorage.app",
  messagingSenderId: "378435376890",
  appId: "1:378435376890:web:2e3eccfb40e5174d235b43",
  measurementId: "G-L3GP4JCBPR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
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

  useEffect(() => {
    setSecureTransport(isSecureContext());
  }, []);

  useEffect(() => {
    setSecureTransport(isSecureContext());
  }, []);

  useEffect(() => {
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

  const updateSessionStatus = async (sessionId, status) => {
    setSessionFeedback(null);
    try {
      await callFunction('updateSessionStatus', { sessionId, status });
      await updateSessionStatusCallable({ sessionId, status });
      const response = await updateSessionStatusFn({ sessionId, status });
      
      if (status === 'completed' && response.data?.sessionsCompleted !== undefined) {
        const newCount = response.data.sessionsCompleted;
        setUserProfile({ ...userProfile, sessionsCompleted: newCount });
        checkAchievements(newCount);
      }
      
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
        userId: user.uid,
        sessionId,
        timestamp: Timestamp.now()
      });
      
      setSessionFeedback({ type: 'success', message: `Session marked as ${status}.` });
      setSessionErrors({});
      loadUserData();
    } catch (error) {
      setSessionFeedback({ type: 'error', message: error.message });
    }
  };

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
        raterId: user.uid,
        rateeId,
        score: ratingScore,
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

  const loadMessages = async (sessionId) => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc')
    );
    const messagesSnap = await getDocs(messagesQuery);
    setMessages(messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    
    try {
      const deleteUserCallable = httpsCallable(functions, 'adminDeleteUser');
      await deleteUserCallable({ targetUserId: userId });
      await callFunction('deleteUser', { userId });
      await deleteDoc(doc(db, 'users', userId));
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
    );
  }

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
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-blue-600 transition"
            >
              {isRegister ? 'Register' : 'Login'}
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
      </div>
    );
  }

  const Navigation = () => (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
            SkillSwap
          </h1>
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
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">{userProfile?.name}</span>
          <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );

  if (page === 'dashboard') {
    const filteredUsers = allUsers.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.offeredSkills?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
              <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Skills Offered</p>
                    <p className="text-3xl font-bold text-blue-400">{userProfile?.offeredSkills?.length || 0}</p>
                  </div>
                  <Award className="text-blue-400" size={40} />
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Achievements</p>
                    <p className="text-3xl font-bold text-orange-400">{userProfile?.achievements?.length || 0}</p>
                  </div>
                  <Star className="text-orange-400" size={40} />
                </div>
              </div>
            </div>
          </div>

          {userProfile?.achievements && userProfile.achievements.length > 0 && (
            <div className="mb-8 bg-gray-800 p-6 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Award className="mr-2 text-blue-400" />
                Your Achievements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userProfile.achievements.map(achId => {
                  const ach = ACHIEVEMENTS.find(a => a.id === achId);
                  return (
                    <div key={achId} className="bg-gray-700 p-4 rounded-lg border border-orange-500">
                      <div className="text-3xl mb-2">{ach?.icon}</div>
                      <h4 className="font-bold text-white">{ach?.name}</h4>
                      <p className="text-sm text-gray-400">{ach?.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Users className="mr-2 text-orange-400" />
                Find Skills
              </h3>
              <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(student => (
                <div key={student.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white text-lg">{student.name}</h4>
                      <p className="text-sm text-gray-400">Class of {student.gradYear}</p>
                    </div>
                    <User className="text-blue-400" size={24} />
                  </div>
                  
                  {student.offeredSkills && student.offeredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2">Offers:</p>
                      <div className="flex flex-wrap gap-2">
                        {student.offeredSkills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedUser(student);
                      setPage('request-session');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-lg hover:from-orange-600 hover:to-blue-600 transition font-semibold"
                  >
                    Request Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'request-session' && selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
    );
  }

  if (page === 'sessions') {
    const pendingSessions = sessions.filter(s => s.status === 'pending');
    const upcomingSessions = sessions.filter(s => s.status === 'accepted');
    const completedSessions = sessions.filter(s => s.status === 'completed');

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <Calendar className="mr-2" />
                Upcoming ({upcomingSessions.length})
              </h3>
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="bg-gray-700 p-4 rounded-lg">
                    <p className="font-bold text-white">{session.skill}</p>
                    <p className="text-sm text-gray-400">
                      {session.requesterId === user.uid ? `With ${session.providerName}` : `With ${session.requesterName}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {session.startTime?.toDate?.()?.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">📍 {session.location}</p>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setPage('messages');
                          loadMessages(session.id);
                        }}
                        className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm flex items-center justify-center"
                      >
                        <MessageCircle size={16} className="mr-1" />
                        Chat
                      </button>
                      <button
                        onClick={() => updateSessionStatus(session.id, 'completed')}
                        className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
                )}
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
              </div>
            </div>
          </div>
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
    );
  }

  if (page === 'messages' && selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
              >
                Send
              </button>
            </div>
            <FieldError message={messageErrors.newMessage} />
          </div>
        </div>
      </div>
    );
  }

  if (page === 'rate-session' && selectedSession) {
    const isRatingAllowed = selectedSession.status === 'completed' && selectedSession.participants?.includes(user.uid);
    const hasRatedSession = ratedSessionIds.includes(selectedSession.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
    );
  }

  if (page === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
              
              <button
                onClick={updateProfile}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-blue-600 transition"
              >
                Save Profile
              </button>
            </div>
          </div>

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
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setSkillType('offered');
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setSkillType('offered');
                    addSkill();
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Add
                </button>
              </div>
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
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setSkillType('sought');
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setSkillType('sought');
                    addSkill();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
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
    );
  }

  if (page === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation />
        
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
                {(adminReports.ratingsSummary?.averageScore || 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
              <p className="text-gray-400 text-sm">Open Flags</p>
              <p className="text-3xl font-bold text-yellow-400">
                {adminReports.moderationFlags?.openFlags || 0}
              </p>
            </div>
          </div>

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

            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <BarChart3 className="mr-2 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="bg-gray-700 p-3 rounded-lg text-sm">
                    <p className="text-white font-semibold">{log.action}</p>
                    <p className="text-gray-400 text-xs">
                      {log.createdAt?.toDate?.()?.toLocaleString() || log.timestamp?.toDate?.()?.toLocaleString() || log.createdAt}
                      {log.createdAt?.toDate?.()?.toLocaleString()}
                      {(log.createdAt || log.timestamp)?.toDate?.()?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
              <table className="w-full">
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
    );
  }

  return null;
}
