import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { X, ArrowDownLeft, Check, ShieldCheck, UserCheck, QrCode } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPOSIT_PRESETS = [100, 250, 500, 1000, 2500];

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentAgent, requestDeposit } = useWeBet();
  const [amount, setAmount] = useState<number>(500);
  const [method, setMethod] = useState<string>('agent_settle');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    const result = requestDeposit(
      amount,
      method === 'agent_settle' ? `Direct via Agent ${currentAgent.name}` : method.toUpperCase(),
      referenceNote
    );
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="deposit-modal"
        className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col"
      >
        <div className="p-4 border-b border-[#232328] flex items-center justify-between bg-[#18181C]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#FF0000] flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Request Credit (PTS) Deposit</h3>
              <p className="text-xs text-[#9CA3AF]">1 Credit (PTS) = 1.00 Value Unit</p>
            </div>
          </div>
          <button
            id="close-deposit-modal"
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-white hover:bg-[#26262B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1.5 tracking-wider">
              Deposit Amount (PTS)
            </label>
            <div className="relative mb-2">
              <input
                type="number"
                id="input-deposit-amount"
                min="10"
                step="10"
                value={amount}
                onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] pl-3 pr-12 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-[#FF0000]"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-[#FFD700]">PTS</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {DEPOSIT_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`flex-1 py-1 rounded-[4px] text-xs font-mono font-semibold transition-colors ${
                    amount === preset
                      ? 'bg-[#FF0000] text-white'
                      : 'bg-[#18181C] text-[#9CA3AF] hover:bg-[#232328] hover:text-white border border-[#26262B]'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1.5 tracking-wider">
              Deposit Method
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setMethod('agent_settle')}
                className={`p-3 rounded-[8px] border flex items-center justify-between cursor-pointer transition-all ${
                  method === 'agent_settle'
                    ? 'bg-[#1C1818] border-[#FF0000] redline-glow'
                    : 'bg-[#0E0E0F] border-[#232328] hover:border-[#3A3A40]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <UserCheck className="w-4 h-4 text-[#FFD700]" />
                  <div>
                    <div className="text-xs font-bold text-white">Direct via Master Agent ({currentAgent.name})</div>
                    <div className="text-[10px] text-[#9CA3AF]">Agent Code: {currentAgent.code} (Fastest Approval)</div>
                  </div>
                </div>
                {method === 'agent_settle' && <Check className="w-4 h-4 text-[#FF0000]" />}
              </label>

              <label
                onClick={() => setMethod('usdt_trc20')}
                className={`p-3 rounded-[8px] border flex items-center justify-between cursor-pointer transition-all ${
                  method === 'usdt_trc20'
                    ? 'bg-[#1C1818] border-[#FF0000] redline-glow'
                    : 'bg-[#0E0E0F] border-[#232328] hover:border-[#3A3A40]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <QrCode className="w-4 h-4 text-[#10B981]" />
                  <div>
                    <div className="text-xs font-bold text-white">USDT Tether (TRC-20)</div>
                    <div className="text-[10px] text-[#9CA3AF]">Automated on-chain point settlement</div>
                  </div>
                </div>
                {method === 'usdt_trc20' && <Check className="w-4 h-4 text-[#FF0000]" />}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1 tracking-wider">
              Note or Transaction Hash (Optional)
            </label>
            <input
              type="text"
              id="input-deposit-note"
              placeholder="e.g. Paid in cash to Agent / TxHash"
              value={referenceNote}
              onChange={e => setReferenceNote(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="submit-deposit-btn"
              disabled={isSubmitting || amount <= 0}
              className="w-full py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-extrabold uppercase tracking-wider rounded-[8px] transition-all redline-glow flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Submit Deposit Request ({amount} PTS)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
