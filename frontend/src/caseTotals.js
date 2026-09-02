import { isRngOption, rngSummary } from "./rngCelebration";

export function caseTotalsFromSlots(slots, optionsById) {
  let total_weeks = 0;
  let total_sg_cost = 0;
  let total_normal_cans = 0;
  let total_limited_cans = 0;
  const reward_counts = {};
  (slots || []).forEach((slot) => {
    const option = optionsById[slot.option_id];
    const weeks = Number(slot.weeks) || 0;
    if (!option || weeks <= 0) return;
    total_weeks += weeks;
    total_sg_cost += (Number(option.sg_cost) || 0) * weeks;
    if (isRngOption(option)) {
      const summary = rngSummary(option.floors);
      total_normal_cans += summary.spentNormal * weeks;
      total_limited_cans += summary.spentLimited * weeks;
    }
    Object.entries(option.reward_counts || {}).forEach(([type, value]) => {
      const amount = Number(value) || 0;
      if (amount) {
        reward_counts[type] = (reward_counts[type] || 0) + amount * weeks;
      }
    });
  });
  return {
    total_weeks,
    total_sg_cost,
    total_normal_cans,
    total_limited_cans,
    reward_counts,
  };
}
