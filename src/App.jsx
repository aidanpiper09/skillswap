import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Calendar, User, Award, MessageCircle, Users, Shield, LogOut, Search, Star, Clock, CheckCircle, Home, Zap, Sparkles, Trophy, Target, Plus, Send, X } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyAhPSxvy-XQMcZp9BZQ1vmjJE-sFsTCHdA",
  authDomain: "bpa-skill-swap.firebaseapp.com",
  projectId: "bpa-skill-swap",
  storageBucket: "bpa-skill-swap.firebasestorage.app",
  messagingSenderId: "378435376890",
  appId: "1:378435376890:web:2e3eccfb40e5174d235b43"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ACHIEVEMENTS = [
  { id: 'first_session', name: 'First Steps', icon: '🎯', color: 'from-orange-500 to-red-500' },
  { id: 'five_sessions', name: 'Rising Star', icon: '🌟', color: 'from-blue-500 to-purple-500' },
  { id: 'ten_sessions', name: 'Expert', icon: '🏆', color: 'from-yellow-500 to-orange-500' }
];

export default function SkillSwap() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [gradYear, setGradYear] = useState('2026');
  const [isRegister, setIsRegister] = useState(false);
  const [bio, setBio] = useState('');
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [soughtSkills, setSoughtSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [sessions, setSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessionSkill, setSessionSkill] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLocation, setSessionLocation] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          setUserProfile(profile);
          setBio(profile.bio || '');
          setOfferedSkills(profile.offeredSkills || []);
          setSoughtSkills(profile.soughtSkills || []);
          setPage(profile.role === 'admin' ? 'admin' : 'dashboard');
        }
      } else {
        setPage('login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && userProfile) loadUserData();
  }, [user, userProfile, page]);

  const loadUserData = async () => {
    if (page === 'dashboard' || page === 'sessions') {
      const sessionsSnap = await getDocs(query(collection(db, 'sessions'), where('participants', 'array-contains', user.uid)));
      setSessions(sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid && u.role === 'student'));
    }
    if (page === 'admin') {
      const usersSnap = await getDocs(collection(db, 'users'));
      setAdminUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name, email, role, gradYear, createdAt: Timestamp.now(),
          offeredSkills: [], soughtSkills: [], achievements: [], sessionsCompleted: 0,
          allowSessionRequests: true, allowMessages: true, isPrivate: false
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert(err.message); }
  };

  const updateProfile = async () => {
    await updateDoc(doc(db, 'users', user.uid), { bio, offeredSkills, soughtSkills });
    setUserProfile({ ...userProfile, bio, offeredSkills, soughtSkills });
    alert('✅ Profile saved!');
  };

  const requestSession = async () => {
    if (!selectedUser || !sessionSkill || !sessionDate || !sessionTime) return alert('Fill all fields!');
    await addDoc(collection(db, 'sessions'), {
      requesterId: user.uid, requesterName: userProfile.name,
      providerId: selectedUser.id, providerName: selectedUser.name,
      skill: sessionSkill, startTime: Timestamp.fromDate(new Date(`${sessionDate}T${sessionTime}`)),
      location: sessionLocation, status: 'pending', participants: [user.uid, selectedUser.id],
      createdAt: Timestamp.now()
    });
    alert('🚀 Session requested!');
    setPage('dashboard');
    loadUserData();
  };

  const updateSessionStatus = async (sid, status) => {
    await updateDoc(doc(db, 'sessions', sid), { status });
    if (status === 'completed') {
      const cnt = (userProfile.sessionsCompleted || 0) + 1;
      await updateDoc(doc(db, 'users', user.uid), { sessionsCompleted: cnt });
    }
    loadUserData();
  };

  const submitRating = async (sid) => {
    const sess = sessions.find(s => s.id === sid);
    await addDoc(collection(db, 'ratings'), {
      sessionId: sid, raterId: user.uid, rateeId: sess.requesterId === user.uid ? sess.providerId : sess.requesterId,
      score: ratingScore, comment: ratingComment, createdAt: Timestamp.now()
    });
    alert('⭐ Rating submitted!');
    setSelectedSession(null);
    setPage('sessions');
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      sessionId: selectedSession.id, fromUserId: user.uid, fromName: userProfile.name,
      body: newMessage, createdAt: Timestamp.now()
    });
    setNewMessage('');
    loadMessages(selectedSession.id);
  };

  const loadMessages = async (sid) => {
    const snap = await getDocs(query(collection(db, 'messages'), where('sessionId', '==', sid), orderBy('createdAt')));
    setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Sparkles className="w-16 h-16 text-orange-500 animate-pulse" />
    </div>
  );

  if (page === 'login') return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-md border border-orange-500/30 shadow-2xl">
        <div className="flex items-center justify-center mb-2">
          <Zap className="w-10 h-10 text-orange-500 mr-2" />
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">SkillSwap</h1>
        </div>
        <p className="text-gray-400 text-center mb-8">Where Talents Meet & Grow</p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-4 bg-black text-white rounded-xl border border-gray-700 focus:border-orange-500 outline-none" required />
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-4 bg-black text-white rounded-xl border border-gray-700 focus:border-orange-500 outline-none">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <input type="number" placeholder="Graduation Year" value={gradYear} onChange={e => setGradYear(e.target.value)}
                className="w-full px-4 py-4 bg-black text-white rounded-xl border border-gray-700 focus:border-orange-500 outline-none" />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-black text-white rounded-xl border border-gray-700 focus:border-blue-500 outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-black text-white rounded-xl border border-gray-700 focus:border-blue-500 outline-none" required />
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition shadow-lg">
            {isRegister ? '🚀 Create Account' : '✨ Sign In'}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-blue-400 hover:text-blue-300">
          {isRegister ? 'Sign in instead' : 'Create account'}
        </button>
      </div>
    </div>
  );

  const Nav = () => (
    <nav className="bg-black/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4 sticky top-0 z-50">
      <div className="flex justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-orange-500 mr-2" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">SkillSwap</h1>
          </div>
          {userProfile?.role === 'student' && (
            <div className="flex space-x-2">
              <button onClick={() => setPage('dashboard')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold ${page === 'dashboard' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Home size={18} /><span>Dashboard</span>
              </button>
              <button onClick={() => setPage('sessions')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold ${page === 'sessions' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Calendar size={18} /><span>Sessions</span>
              </button>
              <button onClick={() => setPage('profile')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold ${page === 'profile' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <User size={18} /><span>Profile</span>
              </button>
            </div>
          )}
          {userProfile?.role === 'admin' && (
            <button onClick={() => setPage('admin')} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold">
              <Shield size={18} /><span>Admin</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white font-semibold">{userProfile?.name}</span>
          <button onClick={() => signOut(auth)} className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );

  if (page === 'dashboard') {
    const filtered = allUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="min-h-screen bg-black">
        <Nav />
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-4xl font-black text-white mb-6 flex items-center">
            <Sparkles className="mr-3 text-orange-500" />
            Welcome, <span className="bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent ml-2">{userProfile?.name}!</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 rounded-2xl border border-orange-500/30">
              <p className="text-gray-400 text-sm mb-1">Sessions</p>
              <p className="text-4xl font-black text-white">{userProfile?.sessionsCompleted || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-2xl border border-blue-500/30">
              <p className="text-gray-400 text-sm mb-1">Skills Offered</p>
              <p className="text-4xl font-black text-white">{userProfile?.offeredSkills?.length || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 rounded-2xl border border-yellow-500/30">
              <p className="text-gray-400 text-sm mb-1">Achievements</p>
              <p className="text-4xl font-black text-white">{userProfile?.achievements?.length || 0}</p>
            </div>
          </div>

          {userProfile?.achievements?.length > 0 && (
            <div className="mb-8 bg-gray-900/50 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-2xl font-black text-white mb-4 flex items-center">
                <Trophy className="mr-3 text-yellow-400" />Achievements
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {userProfile.achievements.map(aid => {
                  const ach = ACHIEVEMENTS.find(a => a.id === aid);
                  return (
                    <div key={aid} className={`bg-gradient-to-br ${ach?.color} p-6 rounded-2xl`}>
                      <div className="text-4xl mb-2">{ach?.icon}</div>
                      <h4 className="font-black text-white">{ach?.name}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-orange-500/30">
            <div className="flex justify-between mb-6">
              <h3 className="text-3xl font-black text-white flex items-center">
                <Target className="mr-3 text-orange-400" />Find Skills
              </h3>
              <div className="flex items-center bg-black/50 px-4 py-3 rounded-xl border border-gray-700">
                <Search className="text-gray-400 mr-2" size={20} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white outline-none" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {filtered.map(student => (
                <div key={student.id} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 hover:border-blue-500 transition">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h4 className="font-black text-white text-xl">{student.name}</h4>
                      <p className="text-sm text-gray-400">Class of {student.gradYear}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="text-white" size={24} />
                    </div>
                  </div>
                  {student.offeredSkills?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Offers:</p>
                      <div className="flex flex-wrap gap-2">
                        {student.offeredSkills.map((sk, i) => (
                          <span key={i} className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full">
                            {sk.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => { setSelectedUser(student); setPage('request'); }}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition">
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

  if (page === 'request' && selectedUser) return (
    <div className="min-h-screen bg-black">
      <Nav />
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => setPage('dashboard')} className="mb-6 text-blue-400 hover:text-blue-300">← Back</button>
        <div className="bg-gray-900 p-8 rounded-2xl border border-orange-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">Request Session with {selectedUser.name}</h2>
          <div className="space-y-4">
            <select value={sessionSkill} onChange={e => setSessionSkill(e.target.value)}
              className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none">
              <option value="">Choose skill...</option>
              {selectedUser.offeredSkills?.map((sk, i) => <option key={i} value={sk.name}>{sk.name}</option>)}
            </select>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none" />
            <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)}
              className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none" />
            <input type="text" placeholder="Location or link" value={sessionLocation} onChange={e => setSessionLocation(e.target.value)}
              className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none" />
            <button onClick={requestSession}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition">
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (page === 'sessions') {
    const pending = sessions.filter(s => s.status === 'pending');
    const upcoming = sessions.filter(s => s.status === 'accepted');
    const completed = sessions.filter(s => s.status === 'completed');
    return (
      <div className="min-h-screen bg-black">
        <Nav />
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-3xl font-bold text-white mb-6">My Sessions</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-orange-500/30">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center"><Clock className="mr-2" />Pending ({pending.length})</h3>
              {pending.map(s => (
                <div key={s.id} className="bg-gray-800 p-4 rounded-xl mb-3">
                  <p className="font-bold text-white">{s.skill}</p>
                  <p className="text-sm text-gray-400">{s.requesterId === user.uid ? `With ${s.providerName}` : `From ${s.requesterName}`}</p>
                  {s.providerId === user.uid && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateSessionStatus(s.id, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded">Accept</button>
                      <button onClick={() => updateSessionStatus(s.id, 'declined')} className="flex-1 py-2 bg-red-500 text-white rounded">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center"><Calendar className="mr-2" />Upcoming ({upcoming.length})</h3>
              {upcoming.map(s => (
                <div key={s.id} className="bg-gray-800 p-4 rounded-xl mb-3">
                  <p className="font-bold text-white">{s.skill}</p>
                  <p className="text-sm text-gray-400">{s.location}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setSelectedSession(s); setPage('chat'); loadMessages(s.id); }}
                      className="flex-1 py-2 bg-blue-500 text-white rounded flex items-center justify-center">
                      <MessageCircle size={16} className="mr-1" />Chat
                    </button>
                    <button onClick={() => updateSessionStatus(s.id, 'completed')} className="flex-1 py-2 bg-green-500 text-white rounded">Complete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-green-500/30">
              <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center"><CheckCircle className="mr-2" />Completed ({completed.length})</h3>
              {completed.map(s => (
                <div key={s.id} className="bg-gray-800 p-4 rounded-xl mb-3">
                  <p className="font-bold text-white">{s.skill}</p>
                  <button onClick={() => { setSelectedSession(s); setPage('rate'); }}
                    className="w-full mt-3 py-2 bg-yellow-500 text-white rounded flex items-center justify-center">
                    <Star size={16} className="mr-1" />Rate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'chat' && selectedSession) return (
    <div className="min-h-screen bg-black">
      <Nav />
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setPage('sessions')} className="mb-6 text-blue-400">← Back</button>
        <div className="bg-gray-900 p-6 rounded-2xl border border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <MessageCircle className="mr-2 text-blue-400" />Chat: {selectedSession.skill}
          </h2>
          <div className="bg-black rounded-xl p-4 h-96 overflow-y-auto mb-4">
            {messages.map(m => (
              <div key={m.id} className={`mb-4 ${m.fromUserId === user.uid ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-xl ${m.fromUserId === user.uid ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <p className="text-xs text-gray-400">{m.fromName}</p>
                  <p className="text-white">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type..." className="flex-1 px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none" />
            <button onClick={sendMessage} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (page === 'rate' && selectedSession) return (
    <div className="min-h-screen bg-black">
      <Nav />
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => setPage('sessions')} className="mb-6 text-blue-400">← Back</button>
        <div className="bg-gray-900 p-8 rounded-2xl border border-yellow-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">Rate Session</h2>
          <p className="text-gray-400 mb-6">Session: {selectedSession.skill}</p>
          <div className="mb-6">
            <label className="block text-gray-400 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRatingScore(n)} className={`p-3 ${ratingScore >= n ? 'text-yellow-400' : 'text-gray-600'}`}>
                  <Star size={32} fill={ratingScore >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Comment..."
            className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none h-32 mb-6" />
          <button onClick={() => submitRating(selectedSession.id)}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl">
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );

  if (page === 'profile') return (
    <div className="min-h-screen bg-black">
      <Nav />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-900 p-8 rounded-2xl border border-purple-500/30 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio..."
            className="w-full px-4 py-3 bg-black text-white rounded-xl border border-gray-700 outline-none h-24 mb-4" />
          <button onClick={updateProfile}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition">
            Save Profile
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-6 rounded-2xl border border-orange-500/30">
            <h3 className="text-xl font-bold text-orange-400 mb-4">Skills I Offer</h3>
            <div className="space-y-2 mb-4">
              {offeredSkills.map((sk, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-xl">
                  <span className="text-white">{sk.name}</span>
                  <button onClick={() => setOfferedSkills(offeredSkills.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300">
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (setOfferedSkills([...offeredSkills, { name: newSkill }]), setNewSkill(''))}
                placeholder="Add skill..." className="flex-1 px-4 py-2 bg-black text-white rounded-xl border border-gray-700 outline-none" />
              <button onClick={() => { setOfferedSkills([...offeredSkills, { name: newSkill }]); setNewSkill(''); }}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Skills I Want</h3>
            <div className="space-y-2 mb-4">
              {soughtSkills.map((sk, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-xl">
                  <span className="text-white">{sk.name}</span>
                  <button onClick={() => setSoughtSkills(soughtSkills.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300">
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (setSoughtSkills([...soughtSkills, { name: newSkill }]), setNewSkill(''))}
                placeholder="Add skill..." className="flex-1 px-4 py-2 bg-black text-white rounded-xl border border-gray-700 outline-none" />
              <button onClick={() => { setSoughtSkills([...soughtSkills, { name: newSkill }]); setNewSkill(''); }}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (page === 'admin') return (
    <div className="min-h-screen bg-black">
      <Nav />
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Shield className="mr-3 text-red-500" />Admin Dashboard
        </h2>
        <div className="bg-gray-900 p-6 rounded-2xl border border-red-500/30">
          <h3 className="text-xl font-bold text-white mb-4">Users</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-gray-400">Role</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-700">
                  <td className="py-3 px-4 text-white">{u.name}</td>
                  <td className="py-3 px-4 text-gray-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return null;
}
