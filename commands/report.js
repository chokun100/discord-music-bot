const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { reply } = require('../utils/embed');

module.exports = {
    name: 'report',
    aliases: ['bug', 'feedback'],
    description: 'Report a bug to the bot developers',
    slashOptions: [
        { name: 'issue', type: 'string', description: 'Detailed description of the bug (10-1000 chars)', required: true },
    ],
    async execute(message, args, client) {
        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุรายละเอียด', 'กรุณาอธิบายบั๊กที่พบ!\nUsage: `!report <รายละเอียดบั๊ก>`');
        }

        const description = args.join(' ');

        // Validate report length
        if (description.length < 10) {
            return reply.error(message, 'ข้อความสั้นเกินไป', 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร');
        }

        if (description.length > 1000) {
            return reply.error(message, 'ข้อความยาวเกินไป', 'กรุณาระบุรายละเอียดไม่เกิน 1,000 ตัวอักษร');
        }

        // Check if the bug report channel is configured
        if (!config.bugReportChannelId) {
            return reply.error(message, 'ยังไม่เปิดใช้งาน', 'ระบบรายงานบั๊กยังไม่ได้กำหนดช่องทาง กรุณาติดต่อผู้พัฒนา');
        }

        try {
            // Find the bug report channel
            const reportChannel = await client.channels.fetch(config.bugReportChannelId).catch(() => null);

            if (!reportChannel) {
                console.error(`❌ Bug report channel not found: ${config.bugReportChannelId}`);
                return reply.error(message, 'ส่งรายงานไม่ได้', 'ไม่พบช่องทางสำหรับส่งรายงานบั๊ก');
            }

            // Create the report embed
            const reportEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('🐛 รายงานบั๊กใหม่')
                .setDescription(description)
                .addFields(
                    {
                        name: '👤 ผู้รายงาน',
                        value: `${message.author.tag} (ID: ${message.author.id})`,
                        inline: true,
                    },
                    {
                        name: '🏠 เซิร์ฟเวอร์',
                        value: `${message.guild.name} (ID: ${message.guild.id})`,
                        inline: true,
                    },
                    {
                        name: '📍 ช่อง',
                        value: `#${message.channel.name}`,
                        inline: true,
                    }
                )
                .setFooter({ text: `รายงานจาก ${message.guild.name}` })
                .setTimestamp();

            // Send to the report channel
            await reportChannel.send({ embeds: [reportEmbed] });

            // Confirm to the user
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ ส่งรายงานบั๊กเรียบร้อย!')
                .setDescription(
                    'รายงานของคุณถูกส่งไปยังทีมพัฒนาเรียบร้อยแล้ว ขอบคุณที่ช่วยเราปรับปรุงบอทให้ดีขึ้น!\n\n' +
                    `คุณสามารถเข้าร่วม [Support Server](${config.supportServerInvite}) เพื่อติดตามหรือสอบถามเพิ่มเติมได้`
                )
                .setTimestamp();

            message.reply({ embeds: [confirmEmbed] });
        } catch (error) {
            console.error(`❌ Report error in guild ${message.guild.id}:`, error);
            reply.error(message, 'ส่งรายงานไม่ได้', 'เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
        }
    },
};
