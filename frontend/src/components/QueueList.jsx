import QueueItemCard from './QueueItem';

export default function QueueList({ queue, onVote, onRemove, isOwner }) {
  if (queue.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Queue is empty</div>
        <div style={{ fontSize: '0.85rem' }}>Search for a song above to add it!</div>
      </div>
    );
  }

  return (
    <div>
      {queue.map((item, i) => (
        <QueueItemCard
          key={item.id}
          item={item}
          rank={i + 1}
          onVote={onVote}
          onRemove={onRemove}
          isOwner={isOwner}
        />
      ))}
    </div>
  );
}
