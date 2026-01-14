import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [gradYear, setGradYear] = useState('2026');
  const [isRegister, setIsRegister] = useState(false);
  
  // Profile states
  const [bio, setBio] = useState('');
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [soughtSkills, setSoughtSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState('offered');
  
  // Sessions states
  const [sessions, setSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessionSkill, setSessionSkill] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  
  // Messages states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Rating states
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  
  // Admin states
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSessions, setAdminSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({});
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
          setPage(profileDoc.data().role === 'admin' ? 'admin' : 'dashboard');
        } else {
          setPage('profile-setup');
        }
      } else {
        setPage('login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && userProfile) {
      loadUserData();
    }
  }, [user, userProfile, page]);

  const loadUserData = async () => {
    if (page === 'dashboard' || page === 'sessions') {
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('participants', 'array-contains', user.uid)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user.uid && u.role === 'student'));
    }
    
    if (page === 'admin' && userProfile?.role === 'admin') {
      const usersSnap = await getDocs(collection(db, 'users'));
      setAdminUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const sessionsSnap = await getDocs(collection(db, 'sessions'));
      setAdminSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const logsSnap = await getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')));
      setAuditLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      calculateStats(usersSnap.docs, sessionsSnap.docs);
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
    });
    
    setStats({
      totalUsers: users.length,
      totalSessions: sessions.length,
      topSkills: Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name,
          email,
          role,
          gradYear,
          createdAt: Timestamp.now(),
          offeredSkills: [],
          soughtSkills: [],
          achievements: [],
          sessionsCompleted: 0
        });
        await addDoc(collection(db, 'auditLogs'), {
          action: 'USER_REGISTERED',
          userId: userCred.user.uid,
          timestamp: Timestamp.now()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio,
        offeredSkills,
        soughtSkills
      });
      setUserProfile({ ...userProfile, bio, offeredSkills, soughtSkills });
      alert('Profile updated!');
    } catch (error) {
      alert(error.message);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skillType === 'offered') {
      setOfferedSkills([...offeredSkills, { name: newSkill, proficiency: 'intermediate' }]);
    } else {
      setSoughtSkills([...soughtSkills, { name: newSkill, interest: 'high' }]);
    }
    setNewSkill('');
  };

  const requestSession = async () => {
    if (!selectedUser || !sessionSkill || !sessionDate || !sessionTime) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const sessionDoc = await addDoc(collection(db, 'sessions'), {
        requesterId: user.uid,
        requesterName: userProfile.name,
        providerId: selectedUser.id,
        providerName: selectedUser.name,
        skill: sessionSkill,
        startTime: new Date(`${sessionDate}T${sessionTime}`),
        location: sessionLocation,
        status: 'pending',
        participants: [user.uid, selectedUser.id],
        createdAt: Timestamp.now()
      });
      
      await addDoc(collection(db, 'auditLogs'), {
        action: 'SESSION_REQUESTED',
        userId: user.uid,
        sessionId: sessionDoc.id,
        timestamp: Timestamp.now()
      });
      
      alert('Session requested!');
      setSelectedUser(null);
      setSessionSkill('');
      setSessionDate('');
      setSessionTime('');
      setSessionLocation('');
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { status });
      
      if (status === 'completed') {
        const session = sessions.find(s => s.id === sessionId);
        const newCount = (userProfile.sessionsCompleted || 0) + 1;
        await updateDoc(doc(db, 'users', user.uid), {
          sessionsCompleted: newCount
        });
        
        checkAchievements(newCount);
      }
      
      await addDoc(collection(db, 'auditLogs'), {
        action: `SESSION_${status.toUpperCase()}`,
        userId: user.uid,
        sessionId,
        timestamp: Timestamp.now()
      });
      
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const checkAchievements = async (sessionCount) => {
    const newAchievements = [];
    
    if (sessionCount === 1 && !userProfile.achievements?.includes('first_session')) {
      newAchievements.push('first_session');
    }
    if (sessionCount === 5 && !userProfile.achievements?.includes('five_sessions')) {
      newAchievements.push('five_sessions');
    }
    if (sessionCount === 10 && !userProfile.achievements?.includes('ten_sessions')) {
      newAchievements.push('ten_sessions');
    }
    
    if (newAchievements.length > 0) {
      await updateDoc(doc(db, 'users', user.uid), {
        achievements: [...(userProfile.achievements || []), ...newAchievements]
      });
      setUserProfile({
        ...userProfile,
        achievements: [...(userProfile.achievements || []), ...newAchievements]
      });
    }
  };

  const submitRating = async (sessionId) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      const rateeId = session.requesterId === user.uid ? session.providerId : session.requesterId;
      
      await addDoc(collection(db, 'ratings'), {
        sessionId,
        raterId: user.uid,
        rateeId,
        score: ratingScore,
        comment: ratingComment,
        createdAt: Timestamp.now()
      });
      
      if (ratingScore === 5) {
        const rateeProfile = await getDoc(doc(db, 'users', rateeId));
        if (rateeProfile.exists() && !rateeProfile.data().achievements?.includes('five_star')) {
          await updateDoc(doc(db, 'users', rateeId), {
            achievements: [...(rateeProfile.data().achievements || []), 'five_star']
          });
        }
      }
      
      alert('Rating submitted!');
      setRatingScore(5);
      setRatingComment('');
      setSelectedSession(null);
      loadUserData();
    } catch (error) {
      alert(error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        sessionId: selectedSession.id,
        fromUserId: user.uid,
        fromName: userProfile.name,
        body: newMessage,
        createdAt: Timestamp.now()
      });
      
      setNewMessage('');
      loadMessages(selectedSession.id);
    } catch (error) {
      alert(error.message);
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
      const deleteUserAndData = httpsCallable(functions, 'deleteUserAndData');
      await deleteUserAndData({ userId });
      loadUserData();
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

  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
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
          
          <button
            onClick={() => setIsRegister(!isRegister)}
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
          {userProfile?.role === 'student' && (
            <div className="flex space-x-4">
              <button onClick={() => setPage('dashboard')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'dashboard' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <Home size={20} />
                <span>Dashboard</span>
              </button>
              <button onClick={() => setPage('sessions')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'sessions' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <Calendar size={20} />
                <span>Sessions</span>
              </button>
              <button onClick={() => setPage('profile')} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${page === 'profile' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                <User size={20} />
                <span>Profile</span>
              </button>
            </div>
          )}
          {userProfile?.role === 'admin' && (
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
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Time</label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
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
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setPage('rate-session');
                      }}
                      className="w-full mt-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm flex items-center justify-center"
                    >
                      <Star size={16} className="mr-1" />
                      Rate Session
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
          </div>
        </div>
      </div>
    );
  }

  if (page === 'rate-session' && selectedSession) {
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
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Session: {selectedSession.skill}</p>
              <p className="text-gray-400">
                With: {selectedSession.requesterId === user.uid ? selectedSession.providerName : selectedSession.requesterName}
              </p>
            </div>
            
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
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Comment (optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none h-32"
              />
            </div>
            
            <button
              onClick={() => submitRating(selectedSession.id)}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition"
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Bio</label>
                <textarea
                  value={bio || userProfile?.bio || ''}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none h-24"
                />
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
                {(offeredSkills.length > 0 ? offeredSkills : userProfile?.offeredSkills || []).map((skill, idx) => (
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
                {(soughtSkills.length > 0 ? soughtSkills : userProfile?.soughtSkills || []).map((skill, idx) => (
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
        </div>
      </div>
    );
  }

  if (page === 'admin' && userProfile?.role === 'admin') {
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
              <p className="text-3xl font-bold text-orange-400">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalSessions || 0}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
              <p className="text-gray-400 text-sm">Active Sessions</p>
              <p className="text-3xl font-bold text-green-400">
                {adminSessions.filter(s => s.status === 'accepted').length}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
              <p className="text-gray-400 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-400">
                {adminSessions.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-orange-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="mr-2 text-orange-400" />
                Top Skills Requested
              </h3>
              <div className="space-y-3">
                {stats.topSkills?.map(([skill, count], idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <span className="text-white font-semibold">{skill}</span>
                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                      {count} sessions
                    </span>
                  </div>
                ))}
                {(!stats.topSkills || stats.topSkills.length === 0) && (
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
                      {log.timestamp?.toDate?.()?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
