import crypto from "crypto";

import { Skill } from "../models/Skill.js";
import { BoostTransaction } from "../models/BoostTransaction.js";
import { expirePastBoosts } from "../utils/boostUtils.js";

// ----------------------------------------------------
// FEATURE 1 CONFIGURATION
// ----------------------------------------------------

const BOOST_DURATION_DAYS = 7;
const BOOST_PRICE = 100;
const BOOST_CURRENCY = "BDT";
const MAX_ACTIVE_BOOSTS = 3;

// ----------------------------------------------------
// HELPER: ADD DAYS
// ----------------------------------------------------

function addDays(date, days) {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

// ----------------------------------------------------
// HELPER: CREATE UNIQUE TRANSACTION REFERENCE
// ----------------------------------------------------

function createTransactionReference() {
  return `BOOST-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

// ----------------------------------------------------
// HELPER: GET EFFECTIVE BOOST STATUS
// ----------------------------------------------------

function getEffectiveBoostStatus(skill) {
  if (
    skill.boost?.status === "active" &&
    skill.boost?.expiresAt &&
    new Date(skill.boost.expiresAt) <=
      new Date()
  ) {
    return "expired";
  }

  return (
    skill.boost?.status ||
    "inactive"
  );
}

// ----------------------------------------------------
// HELPER: COUNT ACTIVE BOOSTS
// ----------------------------------------------------

async function getActiveBoostCount(userId) {
  const now = new Date();

  return Skill.countDocuments({
    owner: userId,
    type: "teach",

    "boost.status": "active",

    "boost.expiresAt": {
      $gt: now
    }
  });
}

// ----------------------------------------------------
// ACTIVATE A NEW BOOST
// ----------------------------------------------------

export const activateBoost = async (
  req,
  res
) => {
  try {
    // ---------------------------------------------
    // First clean up any expired boosts owned by
    // this user so they do not wrongly occupy one
    // of the 3 active boost slots.
    // ---------------------------------------------

    await expirePastBoosts({
      owner: req.user.id
    });

    // ---------------------------------------------
    // Find the requested skill and enforce ownership.
    // ---------------------------------------------

    const skill = await Skill.findOne({
      _id: req.params.skillId,
      owner: req.user.id
    });

    if (!skill) {
      return res.status(404).json({
        message:
          "Skill listing not found."
      });
    }

    // ---------------------------------------------
    // Only teaching skills can be boosted.
    // ---------------------------------------------

    if (skill.type !== "teach") {
      return res.status(400).json({
        message:
          "Only skills you can teach can be boosted."
      });
    }

    // ---------------------------------------------
    // Prevent duplicate activation.
    // ---------------------------------------------

    const currentStatus =
      getEffectiveBoostStatus(skill);

    if (
      currentStatus === "active" &&
      skill.boost?.expiresAt &&
      new Date(skill.boost.expiresAt) >
        new Date()
    ) {
      return res.status(400).json({
        message:
          "This skill already has an active boost. Use renew instead."
      });
    }

    // ---------------------------------------------
    // Enforce maximum 3 active boosts per user.
    // ---------------------------------------------

    const activeBoostCount =
      await getActiveBoostCount(
        req.user.id
      );

    if (
      activeBoostCount >=
      MAX_ACTIVE_BOOSTS
    ) {
      return res.status(400).json({
        message:
          `You can have a maximum of ${MAX_ACTIVE_BOOSTS} active featured listings at the same time.`
      });
    }

    // ---------------------------------------------
    // Create demo payment + boost dates.
    // ---------------------------------------------

    const boostStartsAt =
      new Date();

    const boostExpiresAt =
      addDays(
        boostStartsAt,
        BOOST_DURATION_DAYS
      );

    const transactionReference =
      createTransactionReference();

    // ---------------------------------------------
    // Save transaction history.
    // ---------------------------------------------

    const transaction =
      await BoostTransaction.create({
        user: req.user.id,

        skill: skill._id,

        action: "activate",

        amount: BOOST_PRICE,

        currency:
          BOOST_CURRENCY,

        paymentMethod:
          "Demo Payment",

        paymentStatus:
          "completed",

        transactionReference,

        boostStartsAt,

        boostExpiresAt
      });

    // ---------------------------------------------
    // Update the skill's current boost state.
    // ---------------------------------------------

    skill.boost = {
      status: "active",

      startedAt:
        boostStartsAt,

      expiresAt:
        boostExpiresAt,

      lastRenewedAt: null,

      lastTransactionReference:
        transactionReference
    };

    await skill.save();

    // ---------------------------------------------
    // Return limit information too.
    // ---------------------------------------------

    const updatedActiveBoostCount =
      activeBoostCount + 1;

    return res.status(201).json({
      message:
        `Payment successful. Skill listing boosted for ${BOOST_DURATION_DAYS} days.`,

      skill,

      transaction,

      boostLimit: {
        active:
          updatedActiveBoostCount,

        maximum:
          MAX_ACTIVE_BOOSTS,

        remaining:
          Math.max(
            0,
            MAX_ACTIVE_BOOSTS -
              updatedActiveBoostCount
          )
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// RENEW AN EXISTING BOOST
// ----------------------------------------------------

export const renewBoost = async (
  req,
  res
) => {
  try {
    // ---------------------------------------------
    // First clean expired boosts so slot counting
    // is always based on the real current state.
    // ---------------------------------------------

    await expirePastBoosts({
      owner: req.user.id
    });

    // ---------------------------------------------
    // Find the skill and enforce ownership.
    // ---------------------------------------------

    const skill = await Skill.findOne({
      _id: req.params.skillId,
      owner: req.user.id
    });

    if (!skill) {
      return res.status(404).json({
        message:
          "Skill listing not found."
      });
    }

    if (skill.type !== "teach") {
      return res.status(400).json({
        message:
          "Only skills you can teach can be boosted."
      });
    }

    const now = new Date();

    // ---------------------------------------------
    // Check whether this listing is already active.
    // ---------------------------------------------

    const isCurrentlyActive =
      skill.boost?.status ===
        "active" &&
      skill.boost?.expiresAt &&
      new Date(
        skill.boost.expiresAt
      ) > now;

    // ---------------------------------------------
    // Renewing an already-active boost does not use
    // another slot.
    //
    // Renewing an expired boost makes it active
    // again, so a free slot must exist.
    // ---------------------------------------------

    if (!isCurrentlyActive) {
      const activeBoostCount =
        await getActiveBoostCount(
          req.user.id
        );

      if (
        activeBoostCount >=
        MAX_ACTIVE_BOOSTS
      ) {
        return res.status(400).json({
          message:
            `You already have ${MAX_ACTIVE_BOOSTS} active featured listings. You cannot reactivate this expired boost until a slot becomes available.`
        });
      }
    }

    // ---------------------------------------------
    // If still active:
    // add 7 days to current expiry.
    //
    // If expired:
    // start from now.
    // ---------------------------------------------

    const currentExpiry =
      skill.boost?.expiresAt &&
      new Date(
        skill.boost.expiresAt
      ) > now
        ? new Date(
            skill.boost.expiresAt
          )
        : now;

    const newExpiry =
      addDays(
        currentExpiry,
        BOOST_DURATION_DAYS
      );

    const transactionReference =
      createTransactionReference();

    // ---------------------------------------------
    // Save renewal transaction.
    // ---------------------------------------------

    const transaction =
      await BoostTransaction.create({
        user: req.user.id,

        skill: skill._id,

        action: "renew",

        amount: BOOST_PRICE,

        currency:
          BOOST_CURRENCY,

        paymentMethod:
          "Demo Payment",

        paymentStatus:
          "completed",

        transactionReference,

        boostStartsAt:
          currentExpiry,

        boostExpiresAt:
          newExpiry
      });

    // ---------------------------------------------
    // Update current boost state.
    // ---------------------------------------------

    skill.boost.status =
      "active";

    if (!skill.boost.startedAt) {
      skill.boost.startedAt =
        now;
    }

    skill.boost.expiresAt =
      newExpiry;

    skill.boost.lastRenewedAt =
      now;

    skill.boost.lastTransactionReference =
      transactionReference;

    await skill.save();

    // ---------------------------------------------
    // Count active boosts after renewal.
    // ---------------------------------------------

    const activeBoostCount =
      await getActiveBoostCount(
        req.user.id
      );

    return res.status(201).json({
      message:
        `Payment successful. Boost renewed for another ${BOOST_DURATION_DAYS} days.`,

      skill,

      transaction,

      boostLimit: {
        active:
          activeBoostCount,

        maximum:
          MAX_ACTIVE_BOOSTS,

        remaining:
          Math.max(
            0,
            MAX_ACTIVE_BOOSTS -
              activeBoostCount
          )
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// ----------------------------------------------------
// GET MY BOOST TRANSACTIONS
// ----------------------------------------------------

export const getMyBoostTransactions = async (
  req,
  res
) => {
  try {
    const transactions =
      await BoostTransaction.find({
        user: req.user.id
      })
        .populate(
          "skill",
          "skillName type proficiency"
        )
        .sort({
          createdAt: -1
        });

    return res.json(
      transactions
    );
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};