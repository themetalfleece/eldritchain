import cors from "@fastify/cors";
import fastify from "fastify";
import { config } from "../config";
import { SummonEvent } from "../db/models";

const app = fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
});

// Register CORS
app.register(cors, {
  origin: true,
});

/** Health check */
app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

/** Get leaderboard */
app.get<{
  Querystring: { limit?: string };
}>("/api/leaderboard", async (req, reply) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "100") || 100, 1000);

    // Aggregate user stats from events
    const leaderboard = await SummonEvent.aggregate([
      {
        $group: {
          _id: "$address",
          totalSummons: { $sum: 1 },
          deityCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "deity"] }, 1, 0] },
          },
          epicCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "epic"] }, 1, 0] },
          },
          rareCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "rare"] }, 1, 0] },
          },
          commonCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "common"] }, 1, 0] },
          },
          lastSummonTime: { $max: "$timestamp" },
        },
      },
      {
        $sort: {
          deityCount: -1,
          epicCount: -1,
          rareCount: -1,
          commonCount: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          address: "$_id",
          totalSummons: 1,
          deityCount: 1,
          epicCount: 1,
          rareCount: 1,
          commonCount: 1,
          lastSummonTime: 1,
        },
      },
    ]);

    return {
      success: true,
      data: leaderboard,
      count: leaderboard.length,
    };
  } catch (error) {
    req.log.error(error, "Error fetching leaderboard");
    reply.status(500);
    return {
      success: false,
      error: "Failed to fetch leaderboard",
    };
  }
});

/** Get specific user stats */
app.get<{
  Params: { address: string };
}>("/api/user/:address", async (req, reply) => {
  try {
    const address = req.params.address.toLowerCase();

    // Get user stats from events
    const userStats = await SummonEvent.aggregate([
      { $match: { address } },
      {
        $group: {
          _id: "$address",
          totalSummons: { $sum: 1 },
          deityCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "deity"] }, 1, 0] },
          },
          epicCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "epic"] }, 1, 0] },
          },
          rareCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "rare"] }, 1, 0] },
          },
          commonCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "common"] }, 1, 0] },
          },
          lastSummonTime: { $max: "$timestamp" },
        },
      },
    ]);

    if (!userStats.length) {
      reply.status(404);
      return {
        success: false,
        error: "User not found",
      };
    }

    const stats = userStats[0];

    // Calculate rank
    const betterUsers = await SummonEvent.aggregate([
      {
        $group: {
          _id: "$address",
          deityCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "deity"] }, 1, 0] },
          },
          epicCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "epic"] }, 1, 0] },
          },
          rareCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "rare"] }, 1, 0] },
          },
          commonCount: {
            $sum: { $cond: [{ $eq: ["$rarity", "common"] }, 1, 0] },
          },
        },
      },
      {
        $match: {
          $or: [
            { deityCount: { $gt: stats.deityCount } },
            {
              deityCount: stats.deityCount,
              epicCount: { $gt: stats.epicCount },
            },
            {
              deityCount: stats.deityCount,
              epicCount: stats.epicCount,
              rareCount: { $gt: stats.rareCount },
            },
            {
              deityCount: stats.deityCount,
              epicCount: stats.epicCount,
              rareCount: stats.rareCount,
              commonCount: { $gt: stats.commonCount },
            },
          ],
        },
      },
      { $count: "count" },
    ]);

    const rank = betterUsers.length > 0 ? betterUsers[0].count + 1 : 1;

    return {
      success: true,
      data: {
        address: stats._id,
        totalSummons: stats.totalSummons,
        deityCount: stats.deityCount,
        epicCount: stats.epicCount,
        rareCount: stats.rareCount,
        commonCount: stats.commonCount,
        lastSummonTime: stats.lastSummonTime,
        rank,
      },
    };
  } catch (error) {
    req.log.error(error, "Error fetching user stats");
    reply.status(500);
    return {
      success: false,
      error: "Failed to fetch user stats",
    };
  }
});

/** Get user's summon history */
app.get<{
  Params: { address: string };
  Querystring: { limit?: string; skip?: string };
}>("/api/user/:address/history", async (req, reply) => {
  try {
    const address = req.params.address.toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || "50") || 50, 500);
    const skip = parseInt(req.query.skip || "0") || 0;

    const history = await SummonEvent.find({ address })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select("-_id -__v")
      .lean();

    const total = await SummonEvent.countDocuments({ address });

    return {
      success: true,
      data: history,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  } catch (error) {
    req.log.error(error, "Error fetching user history");
    reply.status(500);
    return {
      success: false,
      error: "Failed to fetch user history",
    };
  }
});

/** Get leaderboard stats */
app.get("/api/stats", async (req, reply) => {
  try {
    const totalSummons = await SummonEvent.countDocuments();
    const totalUsers = (await SummonEvent.distinct("address")).length;

    const topDeityCollector = await SummonEvent.aggregate([
      { $match: { rarity: "deity" } },
      {
        $group: {
          _id: "$address",
          deityCount: { $sum: 1 },
        },
      },
      { $sort: { deityCount: -1 } },
      { $limit: 1 },
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalSummons,
        topDeityCollector: topDeityCollector[0]
          ? {
              address: topDeityCollector[0]._id,
              deityCount: topDeityCollector[0].deityCount,
            }
          : null,
      },
    };
  } catch (error) {
    req.log.error(error, "Error fetching stats");
    reply.status(500);
    return {
      success: false,
      error: "Failed to fetch stats",
    };
  }
});

export async function startApiServer(): Promise<void> {
  try {
    await app.listen({ port: config.api.port, host: "0.0.0.0" });

    console.log(`🌐 API server running on http://localhost:${config.api.port}`);
    console.log(`   - Health: http://localhost:${config.api.port}/health`);
    console.log(`   - Leaderboard: http://localhost:${config.api.port}/api/leaderboard`);
    console.log(`   - User stats: http://localhost:${config.api.port}/api/user/:address`);
    console.log(
      `   - User history: http://localhost:${config.api.port}/api/user/:address/history\n`
    );
  } catch (error) {
    console.error("Failed to start API server:", error);
    process.exit(1);
  }
}
