require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytSearch = require('yt-search');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('FFmpeg Path from ffmpeg-static:', ffmpeg.path);
const ffmpegPath = ffmpeg.path && typeof ffmpeg.path === 'string' 
    ? ffmpeg.path 
    : 'C:/ffmpeg/ffmpeg.exe';
process.env.FFMPEG_PATH = ffmpegPath;
console.log('Using FFmpeg Path:', process.env.FFMPEG_PATH);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
});
const prefix = process.env.PREFIX || '!';

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log(`Command received: ${command} with args: ${args}`);

    if (command === 'play') {
        if (!args[0]) {
            return message.reply('Please provide a YouTube URL or search query (or "test" for a local file)!');
        }

        const voiceChannel = message.member.voice.channel;
        console.log('User Voice Channel:', voiceChannel ? voiceChannel.name : 'Not in a voice channel');

        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to play music!');
        }

        try {
            console.log('Attempting to join voice channel:', voiceChannel.name);
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            console.log('Successfully joined voice channel');
            connection.on('stateChange', (oldState, newState) => {
                console.log('Connection State Change:', oldState.status, '->', newState.status);
            });

            if (args[0] === 'test') {
                const testFile = path.resolve(__dirname, 'test.mp3');
                if (!fs.existsSync(testFile)) {
                    throw new Error('Test file test.mp3 not found! Add an .mp3 file to the bot directory.');
                }

                const player = createAudioPlayer();
                const resource = createAudioResource(fs.createReadStream(testFile));
                console.log('Audio resource created with test file');

                player.play(resource);
                console.log('Player started playing test file');
                connection.subscribe(player);
                console.log('Player subscribed to connection with test file');

                message.reply('Playing test audio file.');

                player.on('error', error => {
                    console.error('Audio Player Error with test file:', error.stack || error);
                    message.reply('An error occurred while playing the test file.');
                });

                player.on('stateChange', (oldState, newState) => {
                    console.log('Player State Change with test file:', oldState.status, '->', newState.status);
                    if (newState.status === AudioPlayerStatus.Playing) {
                        console.log('Test audio is now playing in the voice channel');
                    }
                    if (newState.status === AudioPlayerStatus.Idle) {
                        console.log('Test audio finished, cleaning up');
                        connection.destroy();
                        message.reply('Finished playing test file!');
                    }
                });
            } else {
                let url = args[0];
                if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                    console.log('Performing YouTube search:', args.join(' '));
                    const searchResults = await ytSearch(args.join(' '));
                    if (!searchResults.videos.length) throw new Error('No results found');
                    url = searchResults.videos[0].url;
                    console.log('Found URL:', url);
                }

                console.log('Streaming URL:', url);
                const stream = youtubedl.execStream(url, {
                    format: 'bestaudio/best',
                    output: '-',
                });
                console.log('Stream type: raw (piped to FFmpeg)');

                // Use FFmpeg to convert stream to Opus
                const ffmpegProcess = spawn(ffmpegPath, [
                    '-i', 'pipe:0',
                    '-acodec', 'libopus',
                    '-f', 'opus',
                    '-ar', '48000',
                    '-ab', '128k',
                    'pipe:1'
                ], { stdio: ['pipe', 'pipe', 'pipe'] });

                if (!ffmpegProcess || !ffmpegProcess.stdio) {
                    throw new Error('Failed to spawn FFmpeg process');
                }

                console.log('FFmpeg process spawned successfully');
                stream.stdout.pipe(ffmpegProcess.stdio[0]);
                console.log('Stream piped to FFmpeg');

                ffmpegProcess.on('error', (error) => {
                    console.error('FFmpeg Process Error:', error);
                });

                ffmpegProcess.stderr.on('data', (data) => {
                    console.log('FFmpeg stderr:', data.toString());
                });

                ffmpegProcess.stdout.on('data', (data) => {
                    console.log('FFmpeg stdout: Audio data flowing, length:', data.length);
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(ffmpegProcess.stdio[1], { inputType: 'opus' });
                console.log('Audio resource created with FFmpeg stream');

                player.play(resource);
                console.log('Player started playing with FFmpeg stream');
                connection.subscribe(player);
                console.log('Player subscribed to connection with FFmpeg stream');

                const info = await ytSearch({ videoId: url.split('v=')[1] }); // Use yt-search for info
                console.log('Video Info:', info.title);
                message.reply(`Now playing: ${info.title}`);

                player.on('error', error => {
                    console.error('Audio Player Error:', error.stack || error);
                    message.reply('An error occurred while playing the audio.');
                });

                player.on('stateChange', (oldState, newState) => {
                    console.log('Player State Change:', oldState.status, '->', newState.status);
                    if (newState.status === AudioPlayerStatus.Playing) {
                        console.log('Audio is now playing in the voice channel');
                    }
                    if (newState.status === AudioPlayerStatus.Idle) {
                        console.log('Audio finished, cleaning up');
                        connection.destroy();
                        ffmpegProcess.kill();
                        stream.kill();
                        message.reply('Finished playing!');
                    }
                });

            }

        } catch (error) {
            console.error('Play Command Error:', error.stack || error);
            message.reply('There was an error joining the voice channel or playing the audio.');
        }
    } else if (command === 'leave') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to make me leave!');
        }

        console.log('Leaving voice channel:', voiceChannel.name);
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.destroy();
        message.reply('Left the voice channel!');
    }
});

client.login(process.env.TOKEN);