import React from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { UserRole } from '../../types';
import { AdminNotificationCenter } from '../admin/AdminNotificationCenter';
import {
  Wallet,
  ShieldCheck,
  Zap,
  TrendingUp,
  User,
  Users,
  ShieldAlert,
  Flame,
  ChevronDown,
  PlusCircle,
  HelpCircle,
  Gift,
  Ticket
} from 'lucide-react';

interface HeaderProps {
  onOpenDeposit: () => void;
  onOpenKYC: () => void;
  onOpenResponsibleGaming: () => void;
  activePlayerTab: 'lobby' | 'my-bets' | 'raffles' | 'wallet';
  setActivePlayerTab: (tab: 'lobby' | 'my-bets' | 'raffles' | 'wallet') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeposit,
  onOpenKYC,
  onOpenResponsibleGaming,
  activePlayerTab,
  setActivePlayerTab,
}) => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    allUsers,
    setCurrentUser,
    currentAgent,
    openBets,
  } = useWeBet();

  const userOpenBetsCount = openBets.filter(
    b => (b.makerId === currentUser.id || b.takerId === currentUser.id) && (b.status === 'open' || b.status === 'matched')
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E0F]/95 backdrop-blur-md border-b border-[#232328]">
      {/* Top Banner / System Bar */}
      <div className="bg-[#131314] border-b border-[#1F1F24] px-4 py-1.5 text-xs text-[#9CA3AF]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Live Status Ticker */}
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-[#FF0000] font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping mr-1.5" />
              PEER-TO-PEER LOBBY
            </span>
            <span className="hidden sm:inline text-[#4B5563]">|</span>
            <span className="hidden sm:flex items-center text-[#D1D5DB]">
              <Flame className="w-3.5 h-3.5 text-[#FFD700] mr-1" />
              Standard 100:100 Ratio &bull; 10% Vig on Winnings
            </span>
          </div>

          {/* Quick Role Persona Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-[#6B7280] uppercase tracking-wider hidden md:inline">Current Role:</span>
            <div className="flex items-center bg-[#0E0E0F] p-0.5 rounded-[8px] border border-[#26262B]">
              <button
                id="role-btn-player"
                onClick={() => setCurrentRole('player')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                  currentRole === 'player'
                    ? 'bg-[#FF0000] text-white shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Player</span>
              </button>
              <button
                id="role-btn-agent"
                onClick={() => setCurrentRole('agent')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                  currentRole === 'agent'
                    ? 'bg-[#FF0000] text-white shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Agent</span>
                <span className="hidden sm:inline text-[10px] bg-black/40 px-1 rounded text-[#FFD700] font-mono">60%</span>
              </button>
              <button
                id="role-btn-admin"
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                  currentRole === 'admin'
                    ? 'bg-[#FF0000] text-white shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Admin</span>
                <span className="hidden sm:inline text-[10px] bg-black/40 px-1 rounded text-[#9CA3AF] font-mono">40%</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#B30000] via-[#FF0000] to-[#FF4D4D] flex items-center justify-center redline-glow">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold italic text-2xl tracking-tighter text-white leading-none">
                WE<span className="text-[#FF0000]">BET</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#9CA3AF]">
                P2P SPORTS EXCHANGE
              </span>
            </div>
          </div>

          {/* Navigation for Player */}
          {currentRole === 'player' && (
            <nav className="hidden md:flex items-center space-x-1 bg-[#131314] p-1 rounded-[8px] border border-[#232328]">
              <button
                id="nav-player-lobby"
                onClick={() => setActivePlayerTab('lobby')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all ${
                  activePlayerTab === 'lobby'
                    ? 'bg-[#232328] text-white font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                P2P Lobby
              </button>
              <button
                id="nav-player-mybets"
                onClick={() => setActivePlayerTab('my-bets')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activePlayerTab === 'my-bets'
                    ? 'bg-[#232328] text-white font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <span>My Bets</span>
                {userOpenBetsCount > 0 && (
                  <span className="bg-[#FF0000] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                    {userOpenBetsCount}
                  </span>
                )}
              </button>
              <button
                id="nav-player-raffles"
                onClick={() => setActivePlayerTab('raffles')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activePlayerTab === 'raffles'
                    ? 'bg-[#FF0000] text-white font-semibold shadow-sm'
                    : 'text-[#F59E0B] hover:text-white hover:bg-[#1A1A1E]'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Prize Raffles</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                  Win
                </span>
              </button>
              <button
                id="nav-player-wallet"
                onClick={() => setActivePlayerTab('wallet')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-all ${
                  activePlayerTab === 'wallet'
                    ? 'bg-[#232328] text-white font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Wallet & Ledger
              </button>
            </nav>
          )}
        </div>

        {/* Right Side: Balances, KYC status, User Card */}
        <div className="flex items-center space-x-3">
          {currentRole === 'player' ? (
            <>
              {/* Responsible Gaming Quick Link */}
              <button
                id="btn-resp-gaming"
                onClick={onOpenResponsibleGaming}
                title="Responsible Gaming Limits"
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#131314] hover:bg-[#1A1A1E] border border-[#232328] text-xs text-[#9CA3AF] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Play Safe</span>
              </button>

              {/* KYC Status Badge */}
              <button
                id="btn-kyc-status"
                onClick={onOpenKYC}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#131314] hover:bg-[#1A1A1E] border border-[#232328] text-xs transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  currentUser.kycStatus === 'verified' ? 'bg-[#10B981]' : currentUser.kycStatus === 'pending' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                }`} />
                <span className="text-[#D1D5DB] font-medium">
                  {currentUser.kycStatus === 'verified' ? `KYC Tier ${currentUser.kycTier}` : currentUser.kycStatus === 'pending' ? 'KYC Review' : 'Verify ID'}
                </span>
              </button>

              {/* Player PTS Wallet Chip */}
              <div className="flex items-center bg-[#131314] rounded-[8px] border border-[#2A2A30] pl-3 pr-1 py-1">
                <div className="flex flex-col mr-2">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-semibold tracking-wider">Credits</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="font-mono font-bold text-white text-base leading-none">
                      {currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFD700]">PTS</span>
                  </div>
                </div>
                <button
                  id="btn-quick-deposit"
                  onClick={onOpenDeposit}
                  title="Deposit / Top-up PTS"
                  className="bg-[#FF0000] hover:bg-[#CC0000] text-white p-1.5 rounded-[6px] transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              {/* User Persona Dropdown Selector */}
              <div className="relative group">
                <div className="flex items-center space-x-2 bg-[#131314] hover:bg-[#18181C] p-1.5 rounded-[8px] border border-[#232328] cursor-pointer">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-[6px] object-cover border border-[#333]"
                  />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-[#9CA3AF]">ID: {currentUser.id.slice(0, 8)}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                </div>

                {/* Switch Player Account Menu */}
                <div className="hidden group-hover:block absolute right-0 mt-1 w-56 bg-[#131314] border border-[#26262B] rounded-[8px] shadow-xl p-2 z-50">
                  <div className="text-[10px] uppercase font-bold text-[#6B7280] px-2 py-1">Switch Player Account</div>
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setCurrentUser(user)}
                      className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-[6px] text-left text-xs transition-colors ${
                        currentUser.id === user.id ? 'bg-[#26262B] text-white font-semibold' : 'text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white'
                      }`}
                    >
                      <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                      <div className="flex-1 truncate">
                        <div className="truncate text-white">{user.name}</div>
                        <div className="text-[10px] text-[#9CA3AF]">{user.balance.toFixed(2)} PTS</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : currentRole === 'agent' ? (
            /* Agent Info Chip */
            <div className="flex items-center space-x-3">
              <div className="bg-[#131314] px-3 py-1.5 rounded-[8px] border border-[#2A2A30] flex items-center space-x-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF]">Agent Commission Pool</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="font-mono font-bold text-[#FFD700] text-base leading-none">
                      {currentAgent.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFD700]">PTS</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-[#26262B]" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF]">Split Rate</span>
                  <span className="font-mono font-bold text-white text-xs leading-none">
                    {(currentAgent.commissionRate * 100).toFixed(0)}% of Vig
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-[#131314] px-2.5 py-1.5 rounded-[8px] border border-[#232328]">
                <img
                  src={currentAgent.avatar}
                  alt={currentAgent.name}
                  className="w-7 h-7 rounded-[6px] object-cover border border-[#FFD700]/30"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{currentAgent.name}</span>
                  <span className="text-[10px] text-[#FFD700] font-mono">{currentAgent.code}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Admin Info Chip */
            <div className="flex items-center space-x-3">
              <AdminNotificationCenter />
              <div className="bg-[#131314] px-3 py-1.5 rounded-[8px] border border-[#FF0000]/30 flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF0000] animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#FF0000] tracking-wider">Super Administrator</span>
                  <span className="text-xs font-bold text-white">Chief Ops & Treasury</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Player Navigation Bar */}
      {currentRole === 'player' && (
        <div className="md:hidden flex items-center justify-around bg-[#131314] border-t border-[#1F1F24] px-2 py-1.5">
          <button
            id="mobile-nav-lobby"
            onClick={() => setActivePlayerTab('lobby')}
            className={`flex-1 py-1.5 text-xs font-medium text-center rounded-[6px] transition-colors ${
              activePlayerTab === 'lobby' ? 'bg-[#FF0000] text-white font-semibold' : 'text-[#9CA3AF]'
            }`}
          >
            P2P Lobby
          </button>
          <button
            id="mobile-nav-mybets"
            onClick={() => setActivePlayerTab('my-bets')}
            className={`flex-1 py-1.5 text-xs font-medium text-center rounded-[6px] transition-colors relative ${
              activePlayerTab === 'my-bets' ? 'bg-[#FF0000] text-white font-semibold' : 'text-[#9CA3AF]'
            }`}
          >
            <span>My Bets</span>
            {userOpenBetsCount > 0 && (
              <span className="ml-1 bg-white text-[#FF0000] text-[10px] font-bold px-1 rounded-full">
                {userOpenBetsCount}
              </span>
            )}
          </button>
          <button
            id="mobile-nav-raffles"
            onClick={() => setActivePlayerTab('raffles')}
            className={`flex-1 py-1.5 text-xs font-medium text-center rounded-[6px] transition-colors ${
              activePlayerTab === 'raffles' ? 'bg-[#FF0000] text-white font-semibold' : 'text-[#F59E0B]'
            }`}
          >
            Raffles
          </button>
          <button
            id="mobile-nav-wallet"
            onClick={() => setActivePlayerTab('wallet')}
            className={`flex-1 py-1.5 text-xs font-medium text-center rounded-[6px] transition-colors ${
              activePlayerTab === 'wallet' ? 'bg-[#FF0000] text-white font-semibold' : 'text-[#9CA3AF]'
            }`}
          >
            Wallet
          </button>
        </div>
      )}
    </header>
  );
};
