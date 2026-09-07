import React, { useState, useRef, useEffect } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCheck,
  ShieldAlert,
  Award,
  Calendar,
  X
} from 'lucide-react';

interface AdminNotificationCenterProps {
  onSelectApprovalTab?: () => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  onSelectApprovalTab,
}) => {
  const { adminNotifications, markNotificationRead, clearAllNotifications } = useWeBet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = adminNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (notificationId: string) => {
    markNotificationRead(notificationId);
    setIsOpen(false);
    if (onSelectApprovalTab) {
      onSelectApprovalTab();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-admin-notifications"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-[8px] bg-[#131314] hover:bg-[#1A1A1E] border border-[#2A2A30] text-[#D1D5DB] hover:text-white transition-all cursor-pointer flex items-center justify-center"
        title="Admin Notifications & Winner Approval Alerts"
      >
        <Bell className="w-4 h-4 text-[#D1D5DB]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#FF0000] text-white text-[10px] font-mono font-bold rounded-full animate-pulse border border-[#0E0E0F]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131314] border border-[#2A2A30] rounded-[8px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3 bg-[#161619] border-b border-[#232328] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#FF0000]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Admin Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#FF0000]/20 text-[#FF0000] text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-[#9CA3AF] hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#1F1F24]">
            {adminNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#9CA3AF] text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                <span>No alerts. System operating normally.</span>
              </div>
            ) : (
              adminNotifications.map(notif => {
                const isWinnerApproval = notif.type === 'winner_approval';

                return (
                  <div
                    key={notif.id}
                    className={`p-3 text-xs transition-colors ${
                      !notif.isRead
                        ? 'bg-[#18181C]/90 border-l-2 border-[#FF0000]'
                        : 'bg-[#131314] opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5 font-bold text-white">
                        {isWinnerApproval ? (
                          <Award className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                        )}
                        <span className="truncate">{notif.title}</span>
                      </div>

                      <span className="text-[10px] text-[#6B7280] font-mono shrink-0">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[#9CA3AF] text-[11px] mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action Button */}
                    <div className="mt-2.5 flex items-center justify-between">
                      {notif.actionLabel && (
                        <button
                          onClick={() => handleAction(notif.id)}
                          className="px-2.5 py-1 bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-bold rounded-[4px] transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{notif.actionLabel}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {!notif.isRead && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-[10px] text-[#6B7280] hover:text-[#9CA3AF] ml-auto cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-[#0E0E0F] border-t border-[#1F1F24] text-center">
            <span className="text-[10px] text-[#6B7280]">
              Winners strictly held in escrow until approved by Admin.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
