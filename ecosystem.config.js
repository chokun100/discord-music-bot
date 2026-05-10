module.exports = {
    apps: [
        {
            name: 'momuxic',
            script: 'index.js',
            watch: false,

            // Memory & restart
            max_memory_restart: '400M',
            autorestart: true,
            restart_delay: 5000,
            max_restarts: 20,

            // Environment
            env: {
                NODE_ENV: 'production',
            },

            // Logging
            error_file: './logs/error.log',
            out_file: './logs/output.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            log_type: 'json',

            // Performance — Oracle Free Tier (1 OCPU, 1GB RAM)
            node_args: '--max-old-space-size=384',

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 10000,

            // Cron restart — restart daily at 5 AM to prevent memory leaks
            cron_restart: '0 5 * * *',
        },
    ],
};
