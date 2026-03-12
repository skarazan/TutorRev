export default function LevelBadge({ level }) {
  const styles = {
    Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Intermediate: 'bg-coffee-500/15 text-coffee-300 border-coffee-500/30',
    Advanced: 'bg-java-600/15 text-java-400 border-java-600/30',
  };

  const className = styles[level] || styles.Beginner;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${className}`}>
      {level || 'Unknown'}
    </span>
  );
}
