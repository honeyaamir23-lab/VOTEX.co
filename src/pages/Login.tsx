import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { loginWithEmail, signupWithEmail, resetPassword } = useGame();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [emoji, setEmoji] = useState('😎');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isResetting) {
        await resetPassword(email, password);
        toast.success("Password reset successfully! Please sign in.");
        setIsResetting(false);
        setPassword('');
      } else if (isRegistering) {
        await signupWithEmail(`${emoji} ${name}`, email, password);
        onLogin();
        navigate('/');
      } else {
        await loginWithEmail(email, password);
        onLogin();
        navigate('/');
      }
    } catch (err: any) {
      if (err.message.includes("Email already exists")) {
        setIsRegistering(false); 
      }
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] sm:min-h-full sm:h-full bg-[#0A0D14] text-white p-6 justify-center">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h1 className="text-4xl font-black tracking-widest font-sans flex items-center justify-center mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
             <span className="text-yellow-400">VO</span>
             <span className="text-[#10B981]">TEX</span>
          </h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-400 font-medium tracking-wide">Battle instantly worldwide</p>
        </div>

        <div className="w-full max-w-sm bg-[#131823] p-8 rounded-3xl border border-gray-800 shadow-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold mb-2">
              {isResetting ? 'Reset Password' : (isRegistering ? 'Create Account' : 'Welcome Back')}
            </h2>
            <p className="text-sm text-gray-400">
              {isResetting 
                ? 'Enter your email and a new strong password'
                : (isRegistering ? 'Sign up to start voting and battling' : 'Sign in to continue to Votex')
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-400 text-xs p-3 rounded-lg border border-red-500/50 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isResetting && isRegistering && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Choose Your Avatar
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {['😎','🤖','👾','👻','🤠','👽','🦄','🦁','🦊','🐼','🐵','🐸','🦖','🐉','🐙','🦈','⚡','🔥','🌟','👑'].map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEmoji(icon)}
                        className={`text-2xl min-w-[44px] h-[44px] rounded-xl snap-center flex items-center justify-center transition-all ${emoji === icon ? 'bg-[#10B981] scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#1A1F2E] grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-lg">
                      {emoji}
                    </div>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1A1F2E] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#10B981] transition-colors"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1F2E] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#10B981] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {isResetting ? 'New Password' : 'Password'}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1F2E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#10B981] transition-colors"
                placeholder={isResetting ? 'Enter strong password' : '••••••••'}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-[#10B981] hover:bg-[#0ea5e9] text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50 shadow-lg"
            >
              {isLoading 
                ? (isResetting ? 'Resetting...' : (isRegistering ? 'Creating...' : 'Signing in...')) 
                : (isResetting ? 'Reset Password' : (isRegistering ? 'Create Account' : 'Sign In'))
              }
            </button>
            
            {!isRegistering && !isResetting && (
               <div className="text-center mt-2">
                  <button 
                    type="button"
                    onClick={() => {
                        setIsResetting(true);
                        setError('');
                    }}
                    className="text-gray-400 text-xs font-medium hover:text-[#10B981] transition-colors"
                  >
                     Forgot Password?
                  </button>
               </div>
            )}
          </form>

          <div className="text-center text-sm text-gray-400">
            {isResetting ? (
                <button 
                  onClick={() => {
                    setIsResetting(false);
                    setError('');
                  }} 
                  type="button"
                  className="text-[#10B981] font-bold hover:underline"
                >
                  Back to Sign in
                </button>
            ) : (
                <>
                    {isRegistering ? 'Already have an account?' : 'New here?'}{' '}
                    <button 
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                      }} 
                      type="button"
                      className="text-[#10B981] font-bold hover:underline"
                    >
                      {isRegistering ? 'Sign in instead' : 'Create an account'}
                    </button>
                </>
            )}
          </div>
        </div>

        {/* Partnership Marquee */}
        <div className="w-full max-w-sm overflow-hidden mt-8 border-t border-b border-gray-800/40 py-3 relative bg-[#0A0D14]/30">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0A0D14] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0A0D14] to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex whitespace-nowrap animate-marquee">
            <div className="flex shrink-0 items-center gap-6 pr-6 text-[11px] text-gray-400 font-medium tracking-wide">
              <span>In Partnership With: Netlify</span>
              <span className="text-gray-600">•</span>
              <span>Median.co</span>
              <span className="text-gray-600">•</span>
              <span>TikTok Lite</span>
              <span className="text-gray-600">•</span>
              <span>Supabase</span>
            </div>
            <div className="flex shrink-0 items-center gap-6 pr-6 text-[11px] text-gray-400 font-medium tracking-wide" aria-hidden="true">
              <span>In Partnership With: Netlify</span>
              <span className="text-gray-600">•</span>
              <span>Median.co</span>
              <span className="text-gray-600">•</span>
              <span>TikTok Lite</span>
              <span className="text-gray-600">•</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
