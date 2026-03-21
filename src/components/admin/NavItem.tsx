import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  active?: boolean;
  onClick: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, sublabel, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-3.5 text-xs font-black w-full rounded-2xl transition-all tracking-widest group ${
      active 
        ? 'bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 translate-x-1' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-[#ea580c]'} transition-colors`}>
      {icon}
    </span>
    <div className="flex flex-col items-start leading-none">
      <span>{label}</span>
      {sublabel && <span className={`text-[9px] mt-0.5 ${active ? 'text-orange-200' : 'text-gray-500'}`}>{sublabel}</span>}
    </div>
  </button>
);
