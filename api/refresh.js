// api/refresh.js
export default async function handler(req, res) {
    // allow github pages to talk to this endpoint
    res.setHeader('Access-Control-Allow-Origin', 'https://astrong.xyz');
    
    const spotifyRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
        })
    });
    
    const data = await spotifyRes.json();
    return res.status(200).json(data);
}