import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Raffle } from '../../types';
import {
  Gift,
  Ticket,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Zap,
  Tag,
  ShieldCheck,
  Flame,
  Award,
  Plus,
  Minus,
  X
} from 'lucide-react';

interface RaffleArenaViewProps {
  onOpenDeposit?: () => void;
}

export const RaffleArenaView: React.FC<RaffleArenaViewProps> = ({ onOpenDeposit }) => {
  const { raffles, raffleTickets, currentUser, buyRaffleTickets } = useWeBet();

  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'my-entries' | 'winners'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRaffleForPurchase, setSelectedRaffleForPurchase] = useState<Raffle | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string; ticketNumbers?: number[] } | null>(null);

  // Filtered raffles
  const activeRaffles = raffles.filter(r => r.status === 'active');
  const completedRaffles = raffles.filter(r => r.status === 'completed');

  // User's tickets across all raffles
  const userTickets = raffleTickets.filter(t => t.userId === currentUser.id);
  const userEnteredRaffleIds = Array.from(new Set(userTickets.map(t => t.raffleId)));

  // Filtered by tab
  let displayedRaffles: Raffle[] = [];
  if (activeTab === 'all') {
    displayedRaffles = activeRaffles;
  } else if (activeTab === 'weekly') {
    displayedRaffles = activeRaffles.filter(r => r.isWeeklySpecial);
  } else if (activeTab === 'my-entries') {
    displayedRaffles = raffles.filter(r => userEnteredRaffleIds.includes(r.id));
  } else if (activeTab === 'winners') {
    displayedRaffles = completedRaffles;
  }

  // Category filter
  if (selectedCategory !== 'all' && activeTab !== 'winners') {
    displayedRaffles = displayedRaffles.filter(r => r.category === selectedCategory);
  }

  // Categories list
  const categories = ['all', 'Gaming & Tech', 'Sports Memorabilia', 'Gift Cards', 'Luxury & Lifestyle'];

  // Open modal handler
  const handleOpenPurchaseModal = (raffle: Raffle) => {
    setSelectedRaffleForPurchase(raffle);
    setTicketQuantity(1);
    setPurchaseResult(null);
  };

  const handleConfirmPurchase = () => {
    if (!selectedRaffleForPurchase) return;
    setIsSubmitting(true);
    try {
      const res = buyRaffleTickets(selectedRaffleForPurchase.id, ticketQuantity);
      setPurchaseResult(res);
      if (res.success) {
        // keep modal open momentarily to see ticket numbers
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Drawing Soon';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h ${minutes}m left`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner / Arena Header */}
      <div className="relative overflow-hidden rounded-[10px] bg-gradient-to-r from-[#18181C] via-[#1F1416] to-[#161619] border border-[#2A2A30] p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF0000]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#FF0000]/20 border border-[#FF0000]/40 text-[#FF4D4D] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weekly Prize Arena &bull; Zero Cash Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Spend Points. Win <span className="text-[#FF0000]">Real World Prizes</span>.
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Use your earned sports prediction points to purchase verified raffle tickets. Enter for next-gen consoles, authentic signed team jerseys, tech gear, and digital gift cards. Every draw is provably fair and authorized by Admin.
            </p>
          </div>

          {/* User Quick Stats Card */}
          <div className="bg-[#111113]/90 border border-[#2A2A30] rounded-[8px] p-4 flex sm:flex-row md:flex-col gap-4 shrink-0 justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Your Available Balance</span>
              <div className="text-xl font-mono font-extrabold text-white flex items-center space-x-1.5">
                <span className="text-[#FF0000]">{currentUser.balance.toLocaleString()}</span>
                <span className="text-xs text-[#9CA3AF]">PTS</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#232328] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Your Active Entries</span>
                <div className="text-sm font-bold font-mono text-[#F59E0B] flex items-center space-x-1">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{userTickets.length} Tickets</span>
                </div>
              </div>
              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="px-3 py-1.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                >
                  Get Points
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232328] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            id="tab-raffle-all"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Active Draws ({activeRaffles.length})</span>
          </button>

          <button
            id="tab-raffle-weekly"
            onClick={() => setActiveTab('weekly')}
            className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Weekly Specials</span>
          </button>

          <button
            id="tab-raffle-my-entries"
            onClick={() => setActiveTab('my-entries')}
            className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'my-entries'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Entered Draws</span>
            {userTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF0000] text-white text-[10px] font-bold font-mono">
                {userEnteredRaffleIds.length}
              </span>
            )}
          </button>

          <button
            id="tab-raffle-winners"
            onClick={() => setActiveTab('winners')}
            className={`px-3.5 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'winners'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Winners Hall of Fame ({completedRaffles.length})</span>
          </button>
        </div>

        {/* Category Pills (only in active views) */}
        {activeTab !== 'winners' && (
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#2A2A30] text-white font-bold border border-[#3A3A42]'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1E]'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RAFFLE CARDS GRID */}
      {displayedRaffles.length === 0 ? (
        <div className="p-12 text-center bg-[#131314] border border-[#232328] rounded-[8px] space-y-3">
          <Gift className="w-12 h-12 text-[#9CA3AF] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-white">No Draws Found</h3>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
            {activeTab === 'my-entries'
              ? "You haven't entered any prize draws yet. Pick an active weekly draw above to enter with your points!"
              : 'Check back soon as new weekly prize draws are announced by the Admin team.'}
          </p>
          {activeTab === 'my-entries' && (
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors inline-block"
            >
              Browse Active Draws
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedRaffles.map(raffle => {
            const isCompleted = raffle.status === 'completed';
            const userTicketsInThisRaffle = raffleTickets.filter(
              t => t.raffleId === raffle.id && t.userId === currentUser.id
            );
            const userTicketCount = userTicketsInThisRaffle.length;
            const thresholdPercent = Math.min(
              100,
              Math.round((raffle.totalTicketsSold / raffle.minTicketsThreshold) * 100)
            );
            const winProbability =
              raffle.totalTicketsSold > 0 && userTicketCount > 0
                ? ((userTicketCount / raffle.totalTicketsSold) * 100).toFixed(1)
                : '0';

            return (
              <div
                key={raffle.id}
                className={`bg-[#131314] border rounded-[10px] overflow-hidden flex flex-col transition-all hover:border-[#3A3A44] shadow-lg ${
                  isCompleted ? 'border-[#232328] opacity-95' : 'border-[#232328]'
                }`}
              >
                {/* Prize Image Container */}
                <div className="relative h-48 w-full bg-[#1A1A1E] overflow-hidden group">
                  <img
                    src={raffle.prizeImage}
                    alt={raffle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-transparent to-black/60" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="px-2 py-0.5 rounded-[4px] bg-black/75 backdrop-blur-sm text-[#D1D5DB] text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {raffle.category}
                    </span>
                    {raffle.featuredBadge && (
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#FF0000] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                        {raffle.featuredBadge}
                      </span>
                    )}
                  </div>

                  {/* Retail Value Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[#10B981] text-xs font-mono font-bold border border-[#10B981]/30">
                    ${raffle.prizeValue} Value
                  </div>

                  {/* Bottom Countdown / Status Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        <span>Draw Completed</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-black/80 text-[#F59E0B] border border-[#F59E0B]/30 text-[10px] font-mono font-bold backdrop-blur-md">
                        <Clock className="w-3 h-3 mr-0.5" />
                        <span>{calculateTimeRemaining(raffle.endsAt)}</span>
                      </span>
                    )}

                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#FF0000]/20 text-[#FF4D4D] border border-[#FF0000]/40 text-[11px] font-mono font-extrabold backdrop-blur-md">
                      <span>{raffle.ticketCost} PTS</span>
                      <span className="text-[9px] font-normal text-white/70">/entry</span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-1">
                      {raffle.title}
                    </h3>
                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      {raffle.subtitle || raffle.description}
                    </p>
                  </div>

                  {/* Draw Winner Banner if completed */}
                  {isCompleted && raffle.winnerName && (
                    <div className="p-2.5 rounded-[6px] bg-[#10B981]/10 border border-[#10B981]/30 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#10B981] font-bold flex items-center space-x-1">
                          <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                          <span>Winner: {raffle.winnerName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">
                          Tkt #{raffle.winnerTicketNumber}
                        </span>
                      </div>
                      {raffle.fulfillmentStatus && (
                        <div className="text-[10px] text-[#D1D5DB] flex items-center justify-between">
                          <span>Status:</span>
                          <span className="uppercase font-mono font-bold text-[#10B981]">
                            {raffle.fulfillmentStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress & Entry Statistics */}
                  {!isCompleted && (
                    <div className="space-y-2 pt-1 border-t border-[#1F1F24]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#9CA3AF]">Tickets Pool:</span>
                        <span className="text-white font-bold">
                          {raffle.totalTicketsSold} <span className="text-[#6B7280]">/ {raffle.minTicketsThreshold} target</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#1F1F24] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#FF0000] to-[#F59E0B] h-full rounded-full transition-all duration-500"
                          style={{ width: `${thresholdPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#6B7280]">
                          {thresholdPercent >= 100 ? (
                            <span className="text-[#10B981] font-bold flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Reserve Met &bull; Guaranteed Draw
                            </span>
                          ) : (
                            <span>{thresholdPercent}% to guaranteed threshold</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* User Entry Badge & Action Button */}
                  <div className="pt-2 border-t border-[#1F1F24] space-y-2">
                    {userTicketCount > 0 && (
                      <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-[6px] bg-[#18181C] border border-[#2A2A30]">
                        <div className="flex items-center space-x-1.5 text-white font-semibold">
                          <Ticket className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>You have {userTicketCount} ticket{userTicketCount > 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#F59E0B]">
                          ~{winProbability}% chance
                        </span>
                      </div>
                    )}

                    {!isCompleted ? (
                      <button
                        id={`btn-enter-raffle-${raffle.id}`}
                        onClick={() => handleOpenPurchaseModal(raffle)}
                        className="w-full py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-all flex items-center justify-center space-x-1.5 redline-glow cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Get Raffle Tickets &bull; {raffle.ticketCost} PTS</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-[#18181C] text-[#9CA3AF] text-xs font-medium rounded-[6px] text-center border border-[#232328]">
                        Draw Completed &bull; Winner Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TICKET PURCHASE MODAL */}
      {selectedRaffleForPurchase && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131314] border border-[#2A2A30] rounded-[10px] w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000]">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Enter Prize Draw</h3>
                  <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">
                    Official Weekly Raffle Entry
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRaffleForPurchase(null)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded hover:bg-[#232328] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Prize Summary Banner */}
              <div className="flex items-center space-x-3 p-3 bg-[#18181C] border border-[#2A2A30] rounded-[8px]">
                <img
                  src={selectedRaffleForPurchase.prizeImage}
                  alt={selectedRaffleForPurchase.title}
                  className="w-14 h-14 rounded-[6px] object-cover shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {selectedRaffleForPurchase.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="text-[#10B981] font-mono font-bold">
                      ${selectedRaffleForPurchase.prizeValue} Retail Value
                    </span>
                    <span className="text-[#6B7280]">&bull;</span>
                    <span className="text-[#F59E0B] font-mono">
                      {selectedRaffleForPurchase.ticketCost} PTS / Ticket
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Result View */}
              {purchaseResult?.success ? (
                <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/40 rounded-[8px] space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto animate-bounce" />
                  <div className="text-sm font-bold text-white">Tickets Confirmed!</div>
                  <p className="text-[#D1D5DB] text-xs">
                    You have entered <strong>{ticketQuantity} ticket{ticketQuantity > 1 ? 's' : ''}</strong> for the {selectedRaffleForPurchase.title}.
                  </p>
                  {purchaseResult.ticketNumbers && purchaseResult.ticketNumbers.length > 0 && (
                    <div className="mt-2 p-2 bg-black/40 rounded border border-[#10B981]/30">
                      <span className="text-[10px] text-[#9CA3AF] block mb-1">Your Serial Ticket Numbers:</span>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {purchaseResult.ticketNumbers.map(n => (
                          <span key={n} className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-mono font-bold text-[11px]">
                            #{n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedRaffleForPurchase(null)}
                    className="w-full mt-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-colors"
                  >
                    Done &bull; View Draw in Arena
                  </button>
                </div>
              ) : (
                <>
                  {/* Quantity Stepper */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#D1D5DB]">
                      <span className="font-semibold">Number of Entries:</span>
                      <span className="text-[#9CA3AF] text-[11px]">
                        Max {selectedRaffleForPurchase.maxTicketsPerUser || 50} per user
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTicketQuantity(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-[6px] bg-[#18181C] hover:bg-[#24242A] border border-[#2A2A30] text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] h-10 flex items-center justify-center font-mono font-extrabold text-white text-base">
                        {ticketQuantity}
                      </div>

                      <button
                        onClick={() => setTicketQuantity(prev => Math.min(selectedRaffleForPurchase.maxTicketsPerUser || 50, prev + 1))}
                        className="w-10 h-10 rounded-[6px] bg-[#18181C] hover:bg-[#24242A] border border-[#2A2A30] text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[1, 5, 10, 20].map(qty => (
                        <button
                          key={qty}
                          onClick={() => setTicketQuantity(qty)}
                          className={`py-1.5 rounded-[4px] border text-xs font-mono font-bold transition-colors cursor-pointer ${
                            ticketQuantity === qty
                              ? 'bg-[#FF0000] border-[#FF0000] text-white'
                              : 'bg-[#18181C] border-[#2A2A30] text-[#9CA3AF] hover:text-white'
                          }`}
                        >
                          +{qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Balance Breakdown */}
                  <div className="p-3 bg-[#18181C] border border-[#2A2A30] rounded-[8px] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9CA3AF]">Price per Ticket:</span>
                      <span className="font-mono text-white">{selectedRaffleForPurchase.ticketCost} PTS</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9CA3AF]">Total Entries:</span>
                      <span className="font-mono font-bold text-white">{ticketQuantity}x</span>
                    </div>

                    <div className="pt-2 border-t border-[#232328] flex items-center justify-between text-xs">
                      <span className="text-white font-bold">Total Points Required:</span>
                      <span className="font-mono font-extrabold text-base text-[#FF0000]">
                        {(ticketQuantity * selectedRaffleForPurchase.ticketCost).toLocaleString()} PTS
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                      <span>Your Balance After:</span>
                      <span className={`font-mono font-semibold ${
                        currentUser.balance - (ticketQuantity * selectedRaffleForPurchase.ticketCost) < 0
                          ? 'text-[#EF4444]'
                          : 'text-[#10B981]'
                      }`}>
                        {(currentUser.balance - (ticketQuantity * selectedRaffleForPurchase.ticketCost)).toLocaleString()} PTS
                      </span>
                    </div>
                  </div>

                  {/* Error / Warning Notice */}
                  {currentUser.balance < (ticketQuantity * selectedRaffleForPurchase.ticketCost) && (
                    <div className="p-2.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[6px] flex items-start space-x-2 text-[11px] text-[#EF4444]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span>Insufficient points balance. You need {((ticketQuantity * selectedRaffleForPurchase.ticketCost) - currentUser.balance).toLocaleString()} more PTS.</span>
                      </div>
                    </div>
                  )}

                  {purchaseResult && !purchaseResult.success && (
                    <div className="p-2.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[6px] text-xs text-[#EF4444]">
                      {purchaseResult.message}
                    </div>
                  )}

                  {/* Confirm CTA */}
                  <div className="pt-2">
                    <button
                      id="btn-confirm-raffle-entry"
                      onClick={handleConfirmPurchase}
                      disabled={isSubmitting || currentUser.balance < (ticketQuantity * selectedRaffleForPurchase.ticketCost)}
                      className="w-full py-2.5 bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-[#2A2A30] disabled:text-[#6B7280] disabled:cursor-not-allowed text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer redline-glow"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Confirm &amp; Issue {ticketQuantity} Ticket{ticketQuantity > 1 ? 's' : ''}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
