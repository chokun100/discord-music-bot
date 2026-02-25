const { ShardingManager } = require('discord.js');
require('dotenv').config();

// ─── Sharding Entry Point (Phase 2) ─────────────────────────────────────────
// Use this instead of index.js when your bot reaches 2,000+ servers.
// Run: node shard.js
//
// This automatically splits your bot across multiple processes (shards),
// each handling a subset of servers. Discord REQUIRES sharding at 2,500 guilds.
// ─────────────────────────────────────────────────────────────────────────────

const manager = new ShardingManager('./index.js', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto', // Discord will tell us how many shards we need
    respawn: true,       // Auto-restart crashed shards
});

manager.on('shardCreate', (shard) => {
    console.log(`🚀 Shard ${shard.id} launched`);

    shard.on('disconnect', () => {
        console.warn(`⚠️ Shard ${shard.id} disconnected`);
    });

    shard.on('reconnecting', () => {
        console.log(`🔄 Shard ${shard.id} reconnecting...`);
    });

    shard.on('death', (process) => {
        console.error(`💀 Shard ${shard.id} died (PID: ${process.pid}). Respawning...`);
    });
});

manager.spawn().then(() => {
    console.log(`✅ All shards spawned successfully`);
}).catch((error) => {
    console.error('❌ Failed to spawn shards:', error);
});
