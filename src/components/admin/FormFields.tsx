import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div className="w-full">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2 block">
      {label}
    </label>
    <input 
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-[#F8F9FB] text-[#0B132B] font-bold text-sm px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#ea580c]/50 transition-all border-none"
    />
  </div>
);

interface ColorFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ColorField: React.FC<ColorFieldProps> = ({ label, name, value, onChange }) => (
  <div className="w-full">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2 block">
      {label}
    </label>
    <div className="flex items-center gap-3 bg-[#F8F9FB] p-2 rounded-2xl">
      <input 
        type="color"
        name={name}
        value={value}
        onChange={onChange}
        className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent"
      />
      <input 
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent text-xs font-black uppercase text-gray-500 outline-none"
      />
    </div>
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}

import { ChevronDown } from 'lucide-react';

export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options }) => (
  <div className="w-full relative">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2 block">
      {label}
    </label>
    <div className="relative">
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-[#F8F9FB] text-[#0B132B] font-bold text-sm px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#ea580c]/50 transition-all border-none appearance-none cursor-pointer"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);
