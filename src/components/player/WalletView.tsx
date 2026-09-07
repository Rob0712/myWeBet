import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Transaction } from '../../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Shield,
  Layers,
  History,
  CheckCircle2,
  Clock,
  Zap,
  Building,
  CreditCard,
  QrCode
} from 'lucide-react';

interface WalletViewProps {
  onOpenDeposit: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ onOpenDeposit }) => {
  const { currentUser, transactions, requestWithdrawal, currentAgent, cashierRequests } = useWeBet();
  const [filterType, setFilterType] = useState<string>('all');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [withdrawMethod, setWithdrawMethod] = useState<string>('bank_transfer');
  const [withdrawDetails, setWithdrawDetails] = useState<string>('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'balance' | 'withdraw'>('balance');

  // Filter transactions for this user
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);

  const filteredTransactions = userTransactions.filter(t => {
    if (filterType === 'all') return true;
    if (filterType === 'bets') return t.type === 'bet_stake' || t.type === 'bet_payout';
    if (filterType === 'fees') return t.type === 'vig_fee';
    if (filterType === 'cashier') return t.type === 'deposit' || t.type === 'withdrawal' || t.type === 'agent_topup';
    return true;
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWithdraw(true);
    const result = requestWithdrawal(withdrawAmount, withdrawMethod, withdrawDetails || 'Manual Settlement');
    setIsSubmittingWithdraw(false);
    if (result.success) {
      setActiveTab('balance');
    }
  };

  const pendingWithdrawals = cashierRequests.filter(
    r => r.userId === currentUser.id && r.status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available PTS */}
        <div className="bg-[#131314] p-5 rounded-[8px] border border-[#2A2A30] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0000]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span className="uppercase font-bold tracking-wider">Available Credits</span>
              <span className="bg-[#FF0000]/20 text-[#FF0000] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                1 PTS = 1.00 UNIT
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5 my-2">
              <span className="font-mono font-extrabold text-3xl text-white">
                {currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-[#FFD700]">PTS</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-[#1F1F24]">
            <button
              id="btn-wallet-deposit"
              onClick={onOpenDeposit}
              className="flex-1 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 redline-glow cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit PTS</span>
            </button>

            <button
              id="btn-wallet-withdraw-tab"
              onClick={() => setActiveTab('withdraw')}
              className="flex-1 py-2 bg-[#1E1E24] hover:bg-[#26262B] text-[#D1D5DB] text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Withdraw PTS</span>
            </button>
          </div>
        </div>

        {/* In-Play Escrow PTS */}
        <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span className="uppercase font-bold tracking-wider">Active In-Play Escrow</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="flex items-baseline space-x-1.5 my-2">
              <span className="font-mono font-extrabold text-3xl text-[#D1D5DB]">
                {currentUser.inPlayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-[#9CA3AF]">PTS</span>
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] pt-3 border-t border-[#1F1F24]">
            Locked in open & matched bets. Released automatically upon match completion.
          </p>
        </div>

        {/* Assigned Agent Card */}
        <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span className="uppercase font-bold tracking-wider">Assigned Agent</span>
              <span className="bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                OFFLINE CASHIER
              </span>
            </div>
            <div className="flex items-center space-x-3 my-2">
              <img
                src={currentAgent.avatar}
                alt={currentAgent.name}
                className="w-10 h-10 rounded-[8px] object-cover border border-[#FFD700]/40"
              />
              <div>
                <div className="text-sm font-bold text-white leading-tight">{currentAgent.name}</div>
                <div className="text-xs text-[#FFD700] font-mono">{currentAgent.code}</div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#9CA3AF] pt-3 border-t border-[#1F1F24]">
            Points & manual settlements are supported directly by your Master Agent.
          </p>
        </div>
      </div>

      {/* Pending Cashier Queue Notice */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-[#18181C] border border-[#F59E0B]/30 p-4 rounded-[8px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Pending Cashier Request</div>
              <div className="text-[11px] text-[#9CA3AF]">
                {pendingWithdrawals[0].type.toUpperCase()}: {pendingWithdrawals[0].amount.toFixed(2)} PTS is being processed by your Agent.
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-[#F59E0B]/20 text-[#F59E0B] px-2.5 py-1 rounded-[4px] font-bold">
            Awaiting Admin / Agent Approval
          </span>
        </div>
      )}

      {/* Withdraw Form View */}
      {activeTab === 'withdraw' && (
        <div className="bg-[#131314] p-5 rounded-[8px] border border-[#FFD700]/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232328]">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-base font-bold text-white">Request Point Cashout / Withdrawal</h3>
            </div>
            <button
              onClick={() => setActiveTab('balance')}
              className="text-xs text-[#9CA3AF] hover:text-white"
            >
              Back to Overview
            </button>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                Amount to Cash Out (PTS)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="input-withdraw-amount"
                  min="10"
                  max={currentUser.balance}
                  step="10"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] pl-3 pr-12 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-[#FF0000]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-[#FFD700]">PTS</span>
              </div>
              <span className="text-[11px] text-[#6B7280] mt-1 block">
                Available balance: {currentUser.balance.toFixed(2)} PTS
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                Cashout Method
              </label>
              <select
                id="select-withdraw-method"
                value={withdrawMethod}
                onChange={e => setWithdrawMethod(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000]"
              >
                <option value="agent_cash">Direct Settle via Agent ({currentAgent.name})</option>
                <option value="bank_transfer">Bank Wire Transfer</option>
                <option value="crypto_usdt">Crypto USDT (TRC-20)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                Account / Wallet Details (Optional)
              </label>
              <input
                type="text"
                id="input-withdraw-details"
                placeholder="IBAN, Crypto address, or Agent reference note"
                value={withdrawDetails}
                onChange={e => setWithdrawDetails(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <button
              type="submit"
              id="btn-submit-withdrawal"
              disabled={isSubmittingWithdraw || withdrawAmount > currentUser.balance || withdrawAmount <= 0}
              className={`w-full py-3 rounded-[8px] text-xs font-extrabold uppercase tracking-wider text-white transition-all ${
                withdrawAmount <= currentUser.balance && withdrawAmount > 0
                  ? 'bg-[#FF0000] hover:bg-[#CC0000] cursor-pointer'
                  : 'bg-[#2A2A30] text-[#6B7280] cursor-not-allowed'
              }`}
            >
              Submit Cashout Request ({withdrawAmount} PTS)
            </button>
          </form>
        </div>
      )}

      {/* Transaction & Settlement Ledger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#9CA3AF]" />
            <h3 className="text-sm uppercase font-extrabold tracking-wider text-white">
              Financial Settlement Ledger
            </h3>
          </div>

          <div className="flex items-center space-x-1 bg-[#131314] p-1 rounded-[6px] border border-[#232328]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                filterType === 'all' ? 'bg-[#26262B] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              All ({userTransactions.length})
            </button>
            <button
              onClick={() => setFilterType('bets')}
              className={`px-3 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                filterType === 'bets' ? 'bg-[#26262B] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Bets & Winnings
            </button>
            <button
              onClick={() => setFilterType('fees')}
              className={`px-3 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                filterType === 'fees' ? 'bg-[#26262B] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              10% Vig Fees
            </button>
            <button
              onClick={() => setFilterType('cashier')}
              className={`px-3 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                filterType === 'cashier' ? 'bg-[#26262B] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Cashier
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center text-xs text-[#9CA3AF]">
            No transactions in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
              <thead className="bg-[#18181C] text-[#9CA3AF] uppercase text-[10px] font-semibold border-b border-[#232328]">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Balance After</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {filteredTransactions.map(tx => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#161618] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                          tx.type === 'bet_payout'
                            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                            : tx.type === 'vig_fee'
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                            : tx.type === 'bet_stake'
                            ? 'bg-[#26262B] text-[#9CA3AF]'
                            : tx.type === 'deposit' || tx.type === 'agent_topup'
                            ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30'
                            : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="text-white font-medium">{tx.description}</div>
                        {tx.referenceId && (
                          <div className="text-[10px] text-[#6B7280] font-mono">Ref: {tx.referenceId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                        <span className={isPositive ? 'text-[#10B981]' : 'text-white'}>
                          {isPositive ? '+' : ''}{tx.amount.toFixed(2)} PTS
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#9CA3AF] whitespace-nowrap">
                        {tx.balanceAfter.toFixed(2)} PTS
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[#10B981] flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
