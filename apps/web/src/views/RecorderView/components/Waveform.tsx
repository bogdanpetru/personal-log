interface WaveformProps {
  levels: number[];
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 40;
const GAP = 1;

export function Waveform({ levels, className }: WaveformProps) {
  const barWidth = levels.length > 0 ? WIDTH / levels.length : 0;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={className}
    >
      {levels.map((level, index) => {
        const height = Math.max(1.5, level * HEIGHT);
        const x = index * barWidth + GAP / 2;
        return (
          <rect
            key={index}
            x={x}
            y={(HEIGHT - height) / 2}
            width={Math.max(0, barWidth - GAP)}
            height={height}
            rx={0.75}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
