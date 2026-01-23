// controllers/aiController.js
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini (Brain) for Prompt Enhancement
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. UNSPLASH SUGGESTIONS (Search Logic) ---
export const suggestImages = async (req, res) => {
    const { searchTerm } = req.query;
    if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required.' });
    }
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=4&orientation=landscape`;
    try {
        const response = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.results) { return res.json([]); }
        const imageDetails = data.results.map(photo => ({
            id: photo.id, url: photo.urls.regular, artistName: photo.user.name,
            artistUrl: photo.user.links.html, downloadUrl: photo.links.download_location,
        }));
        res.json(imageDetails);
    } catch (error) {
        console.error('Unsplash Error:', error);
        res.status(500).json({ message: 'Failed to fetch images.' });
    }
};

export const trackDownload = async (req, res) => {
    const { downloadUrl } = req.body;
    if (!downloadUrl) { return res.status(400).json({ message: 'URL required.' }); }
    try {
        await fetch(downloadUrl, { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
        res.status(200).json({ message: 'tracked' });
    } catch (error) {
        res.status(500).json({ message: 'Tracking failed' });
    }
};

// --- 2. HIGH QUALITY GENERATION (Gemini + Pollinations Flux) ---
export const generateImage = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        let finalPrompt = prompt;

        // A. GEMINI ENHANCEMENT (Write a Pro Prompt)
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log(`🧠 Gemini enhancing prompt...`);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                const enhancementRequest = `
                    Refine this event description into a high-quality image generation prompt.
                    Keywords: photorealistic, 4k, cinematic lighting, vibrant colors, poster style.
                    Keep it under 40 words. No quotes.
                    Input: "${prompt}"
                `;
                
                const result = await model.generateContent(enhancementRequest);
                finalPrompt = result.response.text().trim();
                console.log(`✨ Pro Prompt: "${finalPrompt}"`);
            } catch (e) {
                console.warn("Gemini skipped, using original.");
            }
        }

        // B. POLLINATIONS GENERATION (Flux Model - Best Quality Free)
        console.log(`🎨 Rendering with Pollinations (Flux)...`);
        
        // Random seed ensures we don't get cached results (helps avoid some rate limits)
        const seed = Math.floor(Math.random() * 1000000000); 
        const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?seed=${seed}&width=1280&height=720&model=flux&nologo=true`;

        const imageRes = await fetch(aiUrl);
        
        if (!imageRes.ok) {
            throw new Error(`Pollinations Error: ${imageRes.statusText}`);
        }
        
        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        // C. CLOUDINARY UPLOAD
        console.log("☁️ Uploading to Cloudinary...");
        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            folder: 'evently_ai_generated',
            resource_type: 'image',
        });

        res.json({ 
            success: true, 
            imageUrl: uploadResponse.secure_url,
            enhancedPrompt: finalPrompt
        });

    } catch (error) {
        console.error("AI Gen Failed:", error.message);
        
        // D. FINAL FALLBACK (Unsplash)
        console.log("⚠️ Generator failed. Using Unsplash fallback...");
        return fallbackToUnsplash(prompt, res);
    }
};

const fallbackToUnsplash = async (prompt, res) => {
    try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`;
        const unsplashRes = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
        const unsplashData = await unsplashRes.json();
        
        if (unsplashData.results && unsplashData.results.length > 0) {
            res.json({
                success: true,
                imageUrl: unsplashData.results[0].urls.regular,
                isFallback: true
            });
        } else {
            res.status(500).json({ message: 'Could not generate or find an image.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'All image services unavailable.' });
    }
};