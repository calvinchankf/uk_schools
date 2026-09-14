/**
 * In-feed ad slot, styled to sit inline with school cards in the list.
 *
 * Placeholder only for now — swap the inner markup for a real ad network
 * tag (AdSense <ins>, Carbon script, etc.) or a direct-sold creative once
 * one is chosen. `slotId` is passed through so a future network call can
 * target/identify each slot distinctly (e.g. AdSense data-ad-slot).
 */
const AdCard = ({ slotId }) => {
  return (
    <div className="ad-card" data-ad-slot={slotId}>
      <span className="ad-card-label">Advertisement</span>
      <div className="ad-card-body">
        <div className="ad-card-placeholder">Ad slot {slotId}</div>
      </div>
    </div>
  );
};

export default AdCard;
