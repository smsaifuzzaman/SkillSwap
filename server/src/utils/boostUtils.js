import { Skill } from "../models/Skill.js";

// ----------------------------------------------------
// FEATURE 1:
// MARK PAST ACTIVE BOOSTS AS EXPIRED
// ----------------------------------------------------

export async function expirePastBoosts(filter = {}) {
  const now = new Date();

  const result = await Skill.updateMany(
    {
      ...filter,

      "boost.status": "active",

      "boost.expiresAt": {
        $ne: null,
        $lte: now
      }
    },
    {
      $set: {
        "boost.status": "expired"
      }
    }
  );

  return result;
}