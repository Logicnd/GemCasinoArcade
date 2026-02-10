
import { SlotSymbol } from '@/lib/economy';

interface Props {
  symbol: SlotSymbol;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SlotSymbolIcon({ symbol, size = 'md', className = '' }: Props) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div 
      className={`flex items-center justify-center bg-zinc-800 rounded-lg border border-zinc-700 shadow-inner ${className}`}
      title={symbol.name}
    >
      <span className={`${sizeClasses[size]} filter drop-shadow-md`}>
        {symbol.icon}
      </span>
    </div>
  );
}
