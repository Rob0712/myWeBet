import React, { useState, useRef, useEffect } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { KYCSubmission } from '../../types';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  X,
  AlertCircle,
  Upload,
  UserCheck,
  Lock,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, submitKYC, kycSubmissions } = useWeBet();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState<string>(currentUser.name);
  const [dob, setDob] = useState<string>('1992-05-14');
  const [idType, setIdType] = useState<KYCSubmission['idType']>('passport');
  const [idNumber, setIdNumber] = useState<string>('P84920193');

  // Liveness check state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [livenessProgress, setLivenessProgress] = useState<number>(0);
  const [livenessPrompt, setLivenessPrompt] = useState<string>('Center your face in the oval');
  const [isLivenessComplete, setIsLivenessComplete] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const existingSubmission = kycSubmissions.find(k => k.userId === currentUser.id);

  // Handle camera start/stop
  const startCamera = async () => {
    setCameraActive(true);
    setLivenessProgress(0);
    setLivenessPrompt('Hold still and look directly at camera');

    // Simulate progressive liveness stages
    const timer1 = setTimeout(() => {
      setLivenessProgress(35);
      setLivenessPrompt('Turn head slowly to the right');
    }, 1200);

    const timer2 = setTimeout(() => {
      setLivenessProgress(70);
      setLivenessPrompt('Blink twice to verify liveliness');
    }, 2400);

    const timer3 = setTimeout(() => {
      setLivenessProgress(100);
      setLivenessPrompt('✓ Biometric face match verified!');
      setIsLivenessComplete(true);
    }, 3600);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      // Graceful fallback to simulated scanner
      console.log('Camera simulated stream mode active');
    }
  };

  const handleFinalSubmit = () => {
    submitKYC(fullName, dob, idType, idNumber);
    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="kyc-modal"
        className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#232328] flex items-center justify-between bg-[#18181C]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#10B981] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Identity & Liveness Verification</h3>
              <p className="text-xs text-[#9CA3AF]">Unlock Tier 2 Uncapped Credit Limits & Fast Cashouts</p>
            </div>
          </div>
          <button
            id="close-kyc-modal"
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-white hover:bg-[#26262B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 bg-[#0E0E0F] border-b border-[#232328] text-center text-xs py-2 px-4">
          <div className={`font-semibold ${step >= 1 ? 'text-[#FF0000]' : 'text-[#6B7280]'}`}>
            1. Document ID
          </div>
          <div className={`font-semibold ${step >= 2 ? 'text-[#FF0000]' : 'text-[#6B7280]'}`}>
            2. Face Liveness
          </div>
          <div className={`font-semibold ${step >= 3 ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
            3. Verification Status
          </div>
        </div>

        {/* Step 1: Document Details */}
        {step === 1 && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                  ID Type
                </label>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value as any)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
                >
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National Identity Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                ID Document Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <div className="p-3 bg-[#0E0E0F] rounded-[8px] border border-[#232328] flex items-center space-x-3">
              <Upload className="w-5 h-5 text-[#9CA3AF]" />
              <div className="flex-1 text-xs">
                <span className="text-white font-medium block">Front Document Scan Attached</span>
                <span className="text-[10px] text-[#10B981]">✓ Pre-loaded document simulation</span>
              </div>
            </div>

            <button
              id="kyc-next-step-1"
              onClick={() => {
                setStep(2);
                startCamera();
              }}
              className="w-full py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-extrabold uppercase tracking-wider rounded-[8px] transition-all redline-glow cursor-pointer"
            >
              Proceed to Liveness Check
            </button>
          </div>
        )}

        {/* Step 2: Interactive Liveness Face Check */}
        {step === 2 && (
          <div className="p-5 space-y-4 text-center">
            <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-[#2A2A30] bg-[#0E0E0F] flex items-center justify-center">
              {/* Scan Overlay Ring */}
              <div
                className={`absolute inset-0 rounded-full border-4 transition-all duration-500 pointer-events-none ${
                  isLivenessComplete
                    ? 'border-[#10B981] shadow-[0_0_20px_#10B981]'
                    : 'border-[#FF0000] animate-pulse'
                }`}
              />

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {!videoRef.current?.srcObject && (
                <div className="flex flex-col items-center space-y-2">
                  <Camera className="w-12 h-12 text-[#9CA3AF] animate-bounce" />
                  <span className="text-[11px] text-[#6B7280]">Biometric AI Stream</span>
                </div>
              )}
            </div>

            {/* Prompt & Progress */}
            <div>
              <div className="text-sm font-bold text-white mb-1">{livenessPrompt}</div>
              <div className="w-full bg-[#1F1F24] rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                <div
                  className="bg-[#10B981] h-full transition-all duration-300"
                  style={{ width: `${livenessProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-[#9CA3AF] font-mono mt-1 block">
                Biometric Progress: {livenessProgress}%
              </span>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => startCamera()}
                className="py-2.5 px-4 bg-[#1E1E24] hover:bg-[#26262B] text-xs font-semibold text-[#9CA3AF] rounded-[8px] flex items-center justify-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              <button
                id="kyc-complete-liveness-btn"
                disabled={!isLivenessComplete}
                onClick={handleFinalSubmit}
                className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-[8px] text-white transition-all ${
                  isLivenessComplete
                    ? 'bg-[#10B981] hover:bg-[#059669] shadow-md cursor-pointer'
                    : 'bg-[#2A2A30] text-[#6B7280] cursor-not-allowed'
                }`}
              >
                Confirm & Submit KYC
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verified Status */}
        {step === 3 && (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">KYC Verification Submitted!</h4>
              <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto mt-1">
                Your ID credentials and biometric liveness check have been logged. You are upgraded to Tier 2 status.
              </p>
            </div>

            <div className="bg-[#0E0E0F] p-3 rounded-[8px] border border-[#232328] text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Status:</span>
                <span className="text-[#10B981] font-bold">VERIFIED TIER 2</span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Credit Withdrawal Limit:</span>
                <span className="font-mono font-bold text-white">Uncapped (50,000 PTS/day)</span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Assigned Agent:</span>
                <span className="font-mono text-[#FFD700]">Marcus Vance (AGENT-RED-01)</span>
              </div>
            </div>

            <button
              id="kyc-done-btn"
              onClick={onClose}
              className="w-full py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold uppercase rounded-[8px]"
            >
              Done & Return to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
