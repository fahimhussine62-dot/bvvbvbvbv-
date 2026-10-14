const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search'); // সার্চ করার জন্য

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/ytmp3', async (req, res) => {
    try {
        const query = req.query.url || req.query.query;
        if (!query) return res.json({ status: false, message: 'Name or URL is required' });

        let videoUrl = query;

        // যদি লিঙ্ক না হয়ে গানের নাম হয়, তবে সার্চ করবে
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const search = await yts(query);
            if (!search.videos.length) return res.json({ status: false, message: 'Song not found' });
            videoUrl = search.videos[0].url;
        }

        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

        return res.json({
            status: true,
            creator: 'Amir',
            result: {
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails.pop()?.url,
                download: format.url
            }
        });
    } catch (err) {
        return res.json({ status: false, message: err.message });
    }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
