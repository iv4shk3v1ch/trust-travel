interface ProgressBarProps {
  progress: number;
  className?: string;
  fillClassName?: string;
}

export function ProgressBar({ progress, className = '', fillClassName = '' }: ProgressBarProps) {
  return (
    <div className={className}>
      <div 
        className={fillClassName}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
