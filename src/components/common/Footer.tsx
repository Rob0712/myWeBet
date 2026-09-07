import React from 'react';
import { ShieldCheck, Zap, Lock, Award, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E0E0F] border-t border-[#1F1F24] mt-16 text-xs text-[#9CA3AF]">
      {/* Upper Footer info */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#FF0000] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-extrabold italic text-lg tracking-tight text-white">
              WE<span className="text-[#FF0000]">BET</span>
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            High-fidelity peer-to-peer sports betting exchange. Standard 100:100 Open Bet Cards with transparent 10% vig on winnings model.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Money Model (Vig)</h4>
          <ul className="space-y-1 text-[11px] text-[#6B7280]">
            <li>&bull; 100:100 Standard Ratio</li>
            <li>&bull; 10% Fee on Net Winnings Only</li>
            <li>&bull; 60% Agent Revenue Allocation</li>
            <li>&bull; 40% Platform Admin Retention</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Responsible Play</h4>
          <ul className="space-y-1 text-[11px] text-[#6B7280]">
            <li>&bull; Mandatory 18+ Verification</li>
            <li>&bull; Biometric KYC Liveness Checks</li>
            <li>&bull; Custom Daily / Weekly Deposit Caps</li>
            <li>&bull; Immediate Self-Exclusion Timeouts</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Compliance & Security</h4>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-[#26262B] text-[#FFD700] text-[11px] font-bold px-2 py-1 rounded-[4px]">
              18+ ONLY
            </span>
            <span className="bg-[#26262B] text-[#10B981] text-[11px] font-bold px-2 py-1 rounded-[4px] flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>P2P SECURE</span>
            </span>
          </div>
          <p className="text-[10px] text-[#6B7280]">
            Points (PTS) are managed via designated Master Agents and administrative offline ledgers.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#18181C] py-4 bg-[#0A0A0B] text-center text-[11px] text-[#4B5563]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} WeBet Exchange. Apex Redline Design System.</span>
          <span className="text-[#6B7280]">Designed for Speed, Precision & Fair Odds</span>
        </div>
      </div>
    </footer>
  );
};
