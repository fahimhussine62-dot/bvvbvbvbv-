const express = require('express');
const cors = require('cors');
const axios = require('axios');
const yts = require('yt-search');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/ytmp3', async (req, res) => {
    try {
        const query = req.query.url || req.query.query;
        if (!query) return res.json({ status: false, message: 'URL or Query is required' });

        let videoUrl = query;
        let title = '';
        let thumbnail = '';

        // ১. নাম দিয়ে সার্চ করলে ইউটিউব ইউআরএল বের করা
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const search = await yts(query);
            if (!search.videos.length) return res.json({ status: false, message: 'Song not found' });
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            thumbnail = search.videos[0].thumbnail;
        }

        // ২. Cobalt / YTDL API Engines দিয়ে ডাউনলোডার স্ট্রিম বাইপাস
        const cobaltRes = await axios.post('https://api.cobalt.tools/api/json', {
            url: videoUrl,
            downloadMode: 'audio',
            audioFormat: 'mp3'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 15000
        });

        if (cobaltRes.data && (cobaltRes.data.url || cobaltRes.data.picker)) {
            const downloadLink = cobaltRes.data.url || cobaltRes.data.picker[0].url;
            return res.json({
                status: true,
                creator: 'Amir',
                result: {
                    title: title || 'YouTube Song',
                    thumbnail: thumbnail,
                    download: downloadLink
                }
            });
        }

        throw new Error('Primary engine failed');

    } catch (err) {
        // ব্যাকআপ বাইপাস ইঞ্জিন
        try {
            const queryParam = req.query.url || req.query.query;
            const backupRes = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(queryParam)}`);
            if (backupRes.data && backupRes.data.result && backupRes.data.result.download) {
                return res.json({
                    status: true,
                    creator: 'Amir',
                    result: {
                        title: backupRes.data.result.title || 'YouTube Song',
                        thumbnail: backupRes.data.result.metadata?.thumbnail || '',
                        download: backupRes.data.result.download.url || backupRes.data.result.download
                    }
                });
            }
        } catch (e) {
            return res.json({ status: false, message: 'YouTube Blocked request. Please try again.' });
        }
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
