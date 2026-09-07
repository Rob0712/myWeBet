import React, { useState, useEffect } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Raffle, RaffleTicket, RaffleFulfillmentStatus } from '../../types';
import {
  Gift,
  Ticket,
  Trophy,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  ExternalLink,
  ShieldCheck,
  Flame,
  X,
  Shuffle,
  Users
} from 'lucide-react';

export const RaffleAdminManager: React.FC = () => {
  const {
    raffles,
    raffleTickets,
    drawRaffleWinner,
    createRaffle,
    cancelRaffle,
    updateRaffleFulfillment,
    allUsers
  } = useWeBet();

  // State for Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<Raffle['category']>('Gaming & Tech');
  const [newDescription, setNewDescription] = useState('');
  const [newPrizeValue, setNewPrizeValue] = useState<number>(450);
  const [newWholesaleCost, setNewWholesaleCost] = useState<number>(380);
  const [newTicketCost, setNewTicketCost] = useState<number>(100);
  const [newMinThreshold, setNewMinThreshold] = useState<number>(600);
  const [newMaxPerUser, setNewMaxPerUser] = useState<number>(40);
  const [newDaysDuration, setNewDaysDuration] = useState<number>(7);
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80');
  const [newIsWeeklySpecial, setNewIsWeeklySpecial] = useState(true);

  // State for Draw Modal (Interactive Random Draw Spinner)
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [selectedRaffleForDraw, setSelectedRaffleForDraw] = useState<Raffle | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [highlightedTicket, setHighlightedTicket] = useState<RaffleTicket | null>(null);
  const [drawCompleteWinner, setDrawCompleteWinner] = useState<{ winnerName: string; ticketNumber: number } | null>(null);

  // State for Fulfillment Modal
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
  const [selectedRaffleForFulfillment, setSelectedRaffleForFulfillment] = useState<Raffle | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<RaffleFulfillmentStatus>('pending_contact');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Financial & Treasury Metrics
  const totalRafflePointsBurned = raffleTickets.reduce((sum, t) => sum + t.ticketCost, 0);
  const totalRetailPrizeValue = raffles.reduce((sum, r) => sum + r.prizeValue, 0);
  const totalWholesaleCost = raffles.reduce((sum, r) => sum + (r.wholesaleCost || r.prizeValue * 0.85), 0);
  
  // Point equivalent valuation ($0.01 per 100 PTS = $0.0001 per PTS or 100 PTS = $1.00 in platform economy)
  const estimatedPointsGrossValue = totalRafflePointsBurned * 0.01;
  const netMarginSpread = estimatedPointsGrossValue - totalWholesaleCost;

  // Preset Image Options for fast creation
  const presetImages = [
    { label: 'Next-Gen Gaming', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80' },
    { label: 'Football Jersey', url: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Digital Gift Cards', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80' },
    { label: 'Smart Watch / Tech', url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80' },
    { label: 'Gaming Laptop / PC', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80' },
  ];

  // Open interactive draw
  const handleOpenDrawModal = (raffle: Raffle) => {
    setSelectedRaffleForDraw(raffle);
    setDrawCompleteWinner(null);
    setHighlightedTicket(null);
    setIsRolling(false);
    setIsDrawModalOpen(true);
  };

  // Trigger exciting animated random draw
  const handleTriggerRandomDraw = () => {
    if (!selectedRaffleForDraw) return;
    const pool = raffleTickets.filter(t => t.raffleId === selectedRaffleForDraw.id);
    if (pool.length === 0) return;

    setIsRolling(true);
    let counter = 0;
    const totalRolls = 25;
    const interval = setInterval(() => {
      counter++;
      const randomTkt = pool[Math.floor(Math.random() * pool.length)];
      setHighlightedTicket(randomTkt);

      if (counter >= totalRolls) {
        clearInterval(interval);
        setIsRolling(false);
        // Execute draw in context
        const result = drawRaffleWinner(selectedRaffleForDraw.id, randomTkt.id);
        if (result.success) {
          setDrawCompleteWinner({
            winnerName: result.winnerName,
            ticketNumber: randomTkt.ticketNumber,
          });
        }
      }
    }, 100);
  };

  // Open fulfillment editor
  const handleOpenFulfillmentModal = (raffle: Raffle) => {
    setSelectedRaffleForFulfillment(raffle);
    setFulfillmentStatus(raffle.fulfillmentStatus || 'pending_contact');
    setFulfillmentNotes(raffle.fulfillmentNotes || '');
    setTrackingNumber(raffle.trackingNumber || '');
    setIsFulfillmentModalOpen(true);
  };

  const handleSaveFulfillment = () => {
    if (!selectedRaffleForFulfillment) return;
    updateRaffleFulfillment(
      selectedRaffleForFulfillment.id,
      fulfillmentStatus,
      fulfillmentNotes,
      trackingNumber
    );
    setIsFulfillmentModalOpen(false);
  };

  const handleCreateRaffleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const endsAtDate = new Date();
    endsAtDate.setDate(endsAtDate.getDate() + newDaysDuration);

    createRaffle({
      title: newTitle,
      subtitle: newSubtitle || `${newCategory} weekly special draw`,
      category: newCategory,
      description: newDescription || `Official weekly raffle for ${newTitle}.`,
      prizeValue: Number(newPrizeValue),
      wholesaleCost: Number(newWholesaleCost),
      prizeImage: newImageUrl,
      ticketCost: Number(newTicketCost),
      minTicketsThreshold: Number(newMinThreshold),
      maxTicketsPerUser: Number(newMaxPerUser),
      endsAt: endsAtDate.toISOString(),
      isWeeklySpecial: newIsWeeklySpecial,
      featuredBadge: newIsWeeklySpecial ? 'Weekly Major' : undefined,
    });

    // Reset and close
    setNewTitle('');
    setNewSubtitle('');
    setNewDescription('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131314] border border-[#232328] p-5 rounded-[10px]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Raffle &amp; Prize Manager
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Manage weekly prize draws, conduct provably fair winner drawings, track wholesale prize liabilities, and dispatch shipments.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-create-new-raffle"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer redline-glow"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Prize Draw</span>
        </button>
      </div>

      {/* Treasury & Liability Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131314] border border-[#232328] p-4 rounded-[8px] space-y-1">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span>Total Points Burned</span>
            <Ticket className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalRafflePointsBurned.toLocaleString()} <span className="text-xs text-[#9CA3AF]">PTS</span>
          </div>
          <span className="text-[10px] text-[#10B981] font-mono">
            {raffleTickets.length} total tickets purchased
          </span>
        </div>

        <div className="bg-[#131314] border border-[#232328] p-4 rounded-[8px] space-y-1">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span>Wholesale Prize Liabilities</span>
            <DollarSign className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${totalWholesaleCost.toLocaleString()} <span className="text-xs text-[#9CA3AF]">USD</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">
            ${totalRetailPrizeValue.toLocaleString()} combined retail value
          </span>
        </div>

        <div className="bg-[#131314] border border-[#232328] p-4 rounded-[8px] space-y-1">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span>Active Draws</span>
            <Gift className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {raffles.filter(r => r.status === 'active').length} <span className="text-xs text-[#9CA3AF]">Live</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">
            {raffles.filter(r => r.status === 'completed').length} completed draws
          </span>
        </div>

        <div className="bg-[#131314] border border-[#232328] p-4 rounded-[8px] space-y-1">
          <div className="flex items-center justify-between text-[#9CA3AF] text-xs">
            <span>Reserve Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#10B981]">
            100% Guaranteed
          </div>
          <span className="text-[10px] text-[#9CA3AF]">
            Zero draw execution until threshold or admin authorized
          </span>
        </div>
      </div>

      {/* RAFFLE MANAGEMENT TABLE */}
      <div className="bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
        <div className="p-4 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>All Scheduled &amp; Active Prize Draws</span>
            <span className="px-2 py-0.5 rounded-full bg-[#232328] text-xs font-mono text-[#9CA3AF]">
              {raffles.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#232328] bg-[#111113] text-[#9CA3AF] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Prize Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price / Value</th>
                <th className="py-3 px-3">Ticket Pool &amp; Threshold</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Winner Details</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]">
              {raffles.map(raffle => {
                const isCompleted = raffle.status === 'completed';
                const isCancelled = raffle.status === 'cancelled';
                const percent = Math.min(100, Math.round((raffle.totalTicketsSold / raffle.minTicketsThreshold) * 100));
                const ticketsInRaffle = raffleTickets.filter(t => t.raffleId === raffle.id);

                return (
                  <tr key={raffle.id} className="hover:bg-[#18181C] transition-colors">
                    {/* Prize Item with thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={raffle.prizeImage}
                          alt={raffle.title}
                          className="w-12 h-12 rounded-[6px] object-cover bg-[#1F1F24] shrink-0 border border-[#2A2A30]"
                        />
                        <div className="space-y-0.5 min-w-0 max-w-xs">
                          <div className="font-bold text-white truncate text-xs">
                            {raffle.title}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF] truncate">
                            {raffle.subtitle}
                          </div>
                          {raffle.isWeeklySpecial && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-[#FF0000]/20 text-[#FF4D4D] text-[9px] font-extrabold uppercase font-mono">
                              Weekly Special
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-[#D1D5DB]">
                      <span className="px-2 py-0.5 rounded bg-[#1C1C21] border border-[#2A2A30] text-[10px] font-medium">
                        {raffle.category}
                      </span>
                    </td>

                    {/* Price / Value */}
                    <td className="py-3 px-3 font-mono">
                      <div className="text-white font-bold">{raffle.ticketCost} PTS</div>
                      <div className="text-[10px] text-[#10B981]">${raffle.prizeValue} Retail</div>
                      <div className="text-[10px] text-[#9CA3AF]">Cost: ${raffle.wholesaleCost || Math.round(raffle.prizeValue * 0.85)}</div>
                    </td>

                    {/* Tickets Pool & Threshold */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 w-36">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold text-white">{raffle.totalTicketsSold}</span>
                          <span className="text-[#6B7280]">/ {raffle.minTicketsThreshold}</span>
                        </div>
                        <div className="w-full bg-[#232328] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#FF0000] to-[#F59E0B] h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-[#9CA3AF]">
                          {percent >= 100 ? (
                            <span className="text-[#10B981] font-bold">Reserve reached ({percent}%)</span>
                          ) : (
                            <span>{percent}% of threshold</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-[10px] font-bold font-mono uppercase">
                          Drawn &bull; Completed
                        </span>
                      ) : isCancelled ? (
                        <span className="px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 text-[10px] font-bold font-mono uppercase">
                          Cancelled (Refunded)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 text-[10px] font-bold font-mono uppercase">
                          Active &bull; Open
                        </span>
                      )}
                    </td>

                    {/* Winner Details */}
                    <td className="py-3 px-3">
                      {isCompleted && raffle.winnerName ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold text-white text-xs">
                            <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                            <span>{raffle.winnerName}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#F59E0B]">
                            Ticket #{raffle.winnerTicketNumber}
                          </div>
                          {raffle.fulfillmentStatus && (
                            <div className="text-[10px] text-[#10B981] font-mono uppercase font-semibold">
                              {raffle.fulfillmentStatus.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6B7280] text-[11px] italic">Not drawn yet</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {!isCompleted && !isCancelled && (
                          <>
                            <button
                              id={`btn-draw-raffle-${raffle.id}`}
                              onClick={() => handleOpenDrawModal(raffle)}
                              className="px-2.5 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs rounded-[4px] transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Conduct Provably-Fair Winner Draw"
                            >
                              <Shuffle className="w-3 h-3" />
                              <span>Draw Winner</span>
                            </button>

                            <button
                              id={`btn-cancel-raffle-${raffle.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel "${raffle.title}"? All player tickets will be refunded 100% immediately.`)) {
                                  cancelRaffle(raffle.id, 'Admin manual cancellation');
                                }
                              }}
                              className="p-1.5 bg-[#1F1F24] hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#9CA3AF] rounded-[4px] transition-colors cursor-pointer"
                              title="Cancel Draw & 100% Refund Players"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            id={`btn-fulfill-raffle-${raffle.id}`}
                            onClick={() => handleOpenFulfillmentModal(raffle)}
                            className="px-2.5 py-1.5 bg-[#1F1F24] hover:bg-[#2A2A30] text-[#D1D5DB] hover:text-white font-semibold text-xs rounded-[4px] transition-colors flex items-center space-x-1 border border-[#2A2A30] cursor-pointer"
                          >
                            <Package className="w-3 h-3 text-[#10B981]" />
                            <span>Fulfillment</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INTERACTIVE PROVABLY-FAIR WINNER DRAW */}
      {isDrawModalOpen && selectedRaffleForDraw && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131314] border border-[#2A2A30] rounded-[10px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-[6px] bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Provably-Fair Draw Engine</h3>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">
                    Random Winner Selection for "{selectedRaffleForDraw.title}"
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded hover:bg-[#232328] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              {/* Prize Highlight */}
              <div className="space-y-2">
                <img
                  src={selectedRaffleForDraw.prizeImage}
                  alt={selectedRaffleForDraw.title}
                  className="w-24 h-24 rounded-[10px] object-cover mx-auto border-2 border-[#F59E0B]"
                />
                <h4 className="text-base font-extrabold text-white">
                  {selectedRaffleForDraw.title}
                </h4>
                <div className="flex items-center justify-center space-x-3 text-xs text-[#9CA3AF]">
                  <span>Pool: <strong>{selectedRaffleForDraw.totalTicketsSold} Tickets</strong></span>
                  <span>&bull;</span>
                  <span>Retail: <strong className="text-[#10B981]">${selectedRaffleForDraw.prizeValue}</strong></span>
                </div>
              </div>

              {/* Rolling Animation Display */}
              <div className="p-5 rounded-[10px] bg-[#0E0E0F] border border-[#2A2A30] space-y-3">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF]">
                  {drawCompleteWinner ? 'OFFICIAL VERIFIED WINNER' : isRolling ? 'SELECTING TICKET AT RANDOM...' : 'READY TO DRAW'}
                </div>

                {drawCompleteWinner ? (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <Trophy className="w-12 h-12 text-[#FFD700] mx-auto animate-bounce" />
                    <div className="text-2xl font-extrabold text-white">
                      {drawCompleteWinner.winnerName}
                    </div>
                    <div className="inline-block px-3 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-mono font-bold text-sm border border-[#F59E0B]/40">
                      Winning Ticket #{drawCompleteWinner.ticketNumber}
                    </div>
                  </div>
                ) : isRolling && highlightedTicket ? (
                  <div className="space-y-2">
                    <Shuffle className="w-8 h-8 text-[#3B82F6] mx-auto animate-spin" />
                    <div className="text-xl font-bold text-white font-mono">
                      {highlightedTicket.userName}
                    </div>
                    <div className="text-sm font-mono text-[#F59E0B]">
                      Ticket #{highlightedTicket.ticketNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#9CA3AF] py-3">
                    Click below to trigger the verified random drawing algorithm from all {selectedRaffleForDraw.totalTicketsSold} entries.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3">
                {!drawCompleteWinner ? (
                  <button
                    id="btn-execute-draw"
                    onClick={handleTriggerRandomDraw}
                    disabled={isRolling || selectedRaffleForDraw.totalTicketsSold === 0}
                    className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#2A2A30] disabled:text-[#6B7280] text-black font-extrabold text-sm rounded-[6px] transition-all flex items-center space-x-2 cursor-pointer shadow-lg"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>{isRolling ? 'Selecting...' : 'Roll & Draw Winner Now'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsDrawModalOpen(false)}
                    className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-[6px] transition-colors cursor-pointer"
                  >
                    Done &bull; Return to Manager
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PRIZE DRAW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-[#131314] border border-[#2A2A30] rounded-[10px] w-full max-w-lg shadow-2xl overflow-hidden my-6">
            <div className="p-4 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#FF0000]/20 text-[#FF0000] flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Weekly Prize Draw</h3>
                  <span className="text-[10px] text-[#9CA3AF]">
                    Launch a new raffle backed by guaranteed wholesale inventory
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded hover:bg-[#232328] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRaffleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Prize Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Xbox Series X + 1-Yr Game Pass Ultimate"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as Raffle['category'])}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  >
                    <option value="Gaming & Tech">Gaming &amp; Tech</option>
                    <option value="Sports Memorabilia">Sports Memorabilia</option>
                    <option value="Gift Cards">Digital Gift Cards</option>
                    <option value="Luxury & Lifestyle">Luxury &amp; Lifestyle</option>
                    <option value="VIP Experience">VIP Match Tickets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Duration (Days)
                  </label>
                  <select
                    value={newDaysDuration}
                    onChange={e => setNewDaysDuration(Number(e.target.value))}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  >
                    <option value={1}>1 Day (Flash Draw)</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (1 Week Major)</option>
                    <option value={14}>14 Days (Bi-weekly)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Retail Prize Value ($ USD)
                  </label>
                  <input
                    type="number"
                    value={newPrizeValue}
                    onChange={e => setNewPrizeValue(Number(e.target.value))}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Wholesale Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    value={newWholesaleCost}
                    onChange={e => setNewWholesaleCost(Number(e.target.value))}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Ticket Cost (Points) *
                  </label>
                  <input
                    type="number"
                    value={newTicketCost}
                    onChange={e => setNewTicketCost(Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Min Reserve Tickets Threshold
                  </label>
                  <input
                    type="number"
                    value={newMinThreshold}
                    onChange={e => setNewMinThreshold(Number(e.target.value))}
                    placeholder="e.g. 600"
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Prize Image URL
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                  required
                />

                {/* Preset image buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presetImages.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setNewImageUrl(p.url)}
                      className="px-2 py-1 rounded bg-[#18181C] hover:bg-[#232328] text-[10px] text-[#9CA3AF] hover:text-white border border-[#2A2A30] transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer redline-glow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Launch Prize Draw in Arena</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRIZE FULFILLMENT & DISPATCH */}
      {isFulfillmentModalOpen && selectedRaffleForFulfillment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131314] border border-[#2A2A30] rounded-[10px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Prize Fulfillment &amp; Dispatch</h3>
                  <span className="text-[10px] text-[#9CA3AF]">
                    Winner: {selectedRaffleForFulfillment.winnerName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsFulfillmentModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded hover:bg-[#232328] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Delivery Status
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={e => setFulfillmentStatus(e.target.value as RaffleFulfillmentStatus)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                >
                  <option value="pending_contact">Pending Contact / Awaiting Address</option>
                  <option value="claimed">Address Confirmed &bull; Preparing Shipment</option>
                  <option value="dispatched">Dispatched / Tracking Code Issued</option>
                  <option value="delivered">Confirmed Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Tracking Code / Digital Voucher Key
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. UPS-8942-EX or AMZN-GIFT-9912"
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={fulfillmentNotes}
                  onChange={e => setFulfillmentNotes(e.target.value)}
                  placeholder="e.g. Recipient emailed via alex@webet.io. Digital voucher sent."
                  rows={3}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-white text-xs focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveFulfillment}
                  className="w-full py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-colors cursor-pointer"
                >
                  Save &amp; Update Fulfillment Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
