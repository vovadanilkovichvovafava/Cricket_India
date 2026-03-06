// Тонкая полоска в цветах индийского флага — декоративный элемент
export default function TricolorBar({ className = '' }) {
  return (
    <div className={`flex h-[3px] overflow-hidden rounded-full ${className}`}>
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#138808]" />
    </div>
  );
}
