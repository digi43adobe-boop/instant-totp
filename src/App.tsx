/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TOTP, Secret } from 'otpauth';
import { Copy, Check, ShieldAlert } from 'lucide-react';

export default function App() {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);

  const secretRef = useRef(secret);

  useEffect(() => {
    secretRef.current = secret;
  }, [secret]);

  const updateCode = () => {
    const currentSecret = secretRef.current;
    if (!currentSecret) {
      setCode('');
      setError('');
      return;
    }

    const cleanSecret = currentSecret.replace(/\s+/g, '').toUpperCase();
    try {
      const totp = new TOTP({
        secret: Secret.fromBase32(cleanSecret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });
      setCode(totp.generate());
      setError('');
    } catch (err) {
      setCode('');
      setError('Secret Key không hợp lệ');
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastPeriod = -1;

    const tick = () => {
      const now = Date.now();
      const periodMs = 30000;
      const currentPeriod = Math.floor(now / periodMs);
      const timeElapsedInPeriod = now % periodMs;
      const remainingMs = periodMs - timeElapsedInPeriod;

      setProgress((remainingMs / periodMs) * 100);
      setTimeLeft(Math.ceil(remainingMs / 1000));

      if (currentPeriod !== lastPeriod) {
        lastPeriod = currentPeriod;
        updateCode();
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    updateCode();
  }, [secret]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Lỗi khi copy', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Khung thẻ chính */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 sm:p-10 flex flex-col items-center gap-8 z-10">
        
        {/* Logo */}
        <img 
          src="https://res.cloudinary.com/dz2hugofx/image/upload/v1772079170/Digi_43_-_Logo_Official-01_xql3wg.png"
          alt="Digi 43 Logo"
          className="w-40 sm:w-48 h-auto object-contain drop-shadow-sm" 
        />

        {/* Khu vực nhập Secret Key */}
        <div className="w-full space-y-3">
          <label className="text-sm font-semibold text-slate-500 ml-1">Secret Key</label>
          <div className="relative group">
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Nhập Secret Key vào đây..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
          
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-500 text-sm font-medium animate-pulse">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Khu vực hiển thị mã Code */}
        <div className="h-40 flex flex-col items-center justify-center relative w-full bg-slate-50/50 rounded-2xl border border-slate-100">
          {code ? (
            <div className="relative group flex flex-col items-center justify-center w-full">
              <div 
                className="text-5xl sm:text-6xl font-black tracking-[0.15em] font-mono text-indigo-600 cursor-pointer select-all hover:scale-105 transition-transform duration-200"
                onClick={handleCopy}
              >
                {code.slice(0, 3)} <span className="text-indigo-400">{code.slice(3)}</span>
              </div>

              <button
                onClick={handleCopy}
                className="absolute -right-2 sm:right-2 top-1/2 -translate-y-1/2 p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md opacity-0 group-hover:opacity-100"
                title="Sao chép mã"
              >
                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
              </button>
            </div>
          ) : (
            <div className="text-slate-300 text-5xl sm:text-6xl font-black tracking-[0.15em] font-mono select-none">
              000 000
            </div>
          )}
        </div>

        {/* Thanh tiến trình thời gian */}
        {code && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Hiệu lực trong</span>
              <span className={timeLeft <= 5 ? 'text-rose-500 animate-pulse font-bold' : 'text-indigo-600 font-bold'}>
                {timeLeft} giây
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-none ${
                  timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Footer nhỏ phía dưới */}
      <div className="mt-8 text-sm text-slate-400 font-medium">
        Bảo mật 2 lớp (2FA) Authenticator
      </div>
    </div>
  );
}
