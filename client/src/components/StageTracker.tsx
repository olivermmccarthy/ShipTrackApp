type StageEvent = { status: string };

const FORWARD_STAGES = [
  'CREATED',
  'COLLECTED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

const STAGE_LABELS: Record<string, string> = {
  CREATED: 'Created',
  COLLECTED: 'Collected',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

function getReachedIndex(events: StageEvent[], status: string) {
  let idx = 0;
  for (const e of events) {
    const i = FORWARD_STAGES.indexOf(
      e.status as (typeof FORWARD_STAGES)[number],
    );
    if (i > idx) idx = i;
  }
  const statusIdx = FORWARD_STAGES.indexOf(
    status as (typeof FORWARD_STAGES)[number],
  );
  if (statusIdx > idx) idx = statusIdx;
  return idx;
}

export default function StageTracker({
  status,
  events,
}: {
  status: string;
  events: StageEvent[];
}) {
  const interrupted = status === 'DELAYED' || status === 'EXCEPTION';
  // When interrupted, ignore the current status itself (it's not a forward
  // stage) and work out how far the real event history actually got.
  const reachedIndex = getReachedIndex(events, interrupted ? '' : status);

  return (
    <ol className="stage-tracker" aria-label="Shipment progress">
      {FORWARD_STAGES.map((stage, i) => {
        const isPast = i < reachedIndex;
        const isCurrent = i === reachedIndex;
        const isFinalDelivered =
          stage === 'DELIVERED' && isCurrent && !interrupted;
        const isDoneVisual = isPast || isFinalDelivered;
        const isPulsing = isCurrent && !interrupted && !isFinalDelivered;
        const isInterruptedHere = isCurrent && interrupted;

        const state = isDoneVisual
          ? 'stage-done'
          : isInterruptedHere
            ? 'stage-interrupted'
            : isPulsing
              ? 'stage-current'
              : 'stage-upcoming';

        const leftFilled = i <= reachedIndex ? 'conn-left-filled' : '';
        const rightFilled = i < reachedIndex ? 'conn-right-filled' : '';

        const stateText = isInterruptedHere
          ? `${status === 'DELAYED' ? 'Delayed' : 'Exception'} at this stage`
          : isDoneVisual
            ? 'Completed'
            : isPulsing
              ? 'Current stage'
              : 'Upcoming';

        return (
          <li
            key={stage}
            className={`stage-item ${state} ${leftFilled} ${rightFilled}`}
          >
            <div className={`stage-node ${state}`}>
              {isDoneVisual && <span className="stage-check">✓</span>}
              {isPulsing && (
                <span className="stage-pulse-dot" aria-hidden="true" />
              )}
            </div>
            <div className="stage-label">{STAGE_LABELS[stage]}</div>
            {isInterruptedHere && (
              <div
                className={`stage-sublabel stage-sublabel-${status.toLowerCase()}`}
              >
                {status === 'DELAYED' ? 'Delayed' : 'Exception'}
              </div>
            )}
            <span className="visually-hidden">{stateText}</span>
          </li>
        );
      })}
    </ol>
  );
}
