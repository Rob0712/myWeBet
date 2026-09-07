import React, { useState } from 'react';
import { WeBetProvider, useWeBet } from './context/WeBetContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { NotificationToast } from './components/common/NotificationToast';
import { PlayerLobby } from './components/player/PlayerLobby';
import { MyBetsView } from './components/player/MyBetsView';
import { WalletView } from './components/player/WalletView';
import { CreateBetModal } from './components/player/CreateBetModal';
import { DepositModal } from './components/player/DepositModal';
import { KYCModal } from './components/player/KYCModal';
import { ResponsibleGamingModal } from './components/player/ResponsibleGamingModal';
import { RaffleArenaView } from './components/player/RaffleArenaView';
import { AgentDashboard } from './components/agent/AgentDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Match } from './types';

const MainApp: React.FC = () => {
  const { currentRole } = useWeBet();
  const [activePlayerTab, setActivePlayerTab] = useState<'lobby' | 'my-bets' | 'raffles' | 'wallet'>('lobby');

  // Modal states
  const [isCreateBetOpen, setIsCreateBetOpen] = useState(false);
  const [selectedMatchForBet, setSelectedMatchForBet] = useState<Match | undefined>(undefined);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isResponsibleGamingOpen, setIsResponsibleGamingOpen] = useState(false);

  const handleOpenCreateBet = (match?: Match) => {
    setSelectedMatchForBet(match);
    setIsCreateBetOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#FF0000] selection:text-white">
      {/* Header with Navigation & Role Switcher */}
      <Header
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenKYC={() => setIsKYCOpen(true)}
        onOpenResponsibleGaming={() => setIsResponsibleGamingOpen(true)}
        activePlayerTab={activePlayerTab}
        setActivePlayerTab={setActivePlayerTab}
      />

      {/* Main Role Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {currentRole === 'player' && (
          <>
            {activePlayerTab === 'lobby' && (
              <PlayerLobby onOpenCreateBet={handleOpenCreateBet} />
            )}
            {activePlayerTab === 'my-bets' && <MyBetsView />}
            {activePlayerTab === 'raffles' && (
              <RaffleArenaView onOpenDeposit={() => setIsDepositOpen(true)} />
            )}
            {activePlayerTab === 'wallet' && (
              <WalletView onOpenDeposit={() => setIsDepositOpen(true)} />
            )}
          </>
        )}

        {currentRole === 'agent' && <AgentDashboard />}

        {currentRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Modals */}
      <CreateBetModal
        isOpen={isCreateBetOpen}
        onClose={() => setIsCreateBetOpen(false)}
        preselectedMatch={selectedMatchForBet}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />

      <KYCModal
        isOpen={isKYCOpen}
        onClose={() => setIsKYCOpen(false)}
      />

      <ResponsibleGamingModal
        isOpen={isResponsibleGamingOpen}
        onClose={() => setIsResponsibleGamingOpen(false)}
      />

      {/* Live Toast Alerts */}
      <NotificationToast />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <WeBetProvider>
      <MainApp />
    </WeBetProvider>
  );
}
