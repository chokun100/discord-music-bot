module.exports = {
    apps: [
        {
            name: 'discord-music-bot',
            script: 'index.js',
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
            },
            // Auto-restart settings
            autorestart: true,
            restart_delay: 5000,
            max_restarts: 10,
            // Logging
            error_file: './logs/error.log',
            out_file: './logs/output.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        },
    ],
};
