import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100/50 ${className}`}>
    {children}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <h3 className={`text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${className}`}>
    <span className="w-8 h-[2px] bg-gray-100"></span>
    {children}
  </h3>
);
