import ticketIcon from "../assets/monster-ticket.png";
import { formatNumber } from "../rewards";

export default function MonsterTicketAmount({
  value,
  className = "",
  iconOnly = false,
}) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img
        src={ticketIcon}
        alt={iconOnly ? "" : "Monster ticket"}
        className="csg-icon"
      />
      {iconOnly ? null : <strong>{formatNumber(Math.round(value || 0))}</strong>}
    </span>
  );
}
