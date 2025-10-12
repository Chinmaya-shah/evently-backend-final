// controllers/aiController.js
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import FormData from 'form-data'; // We need this to handle the API request correctly

// This function for Unsplash suggestions remains unchanged
export const suggestImages = async (req, res) => {
    const { searchTerm } = req.query;
    if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required.' });
    }
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=4&orientation=landscape`;
    try {
        const response = await fetch(unsplashUrl, { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Unsplash API error: ${response.statusText} - ${errorBody}`);
        }
        const data = await response.json();
        if (!data.results) { return res.json([]); }
        const imageDetails = data.results.map(photo => ({
            id: photo.id, url: photo.urls.regular, artistName: photo.user.name,
            artistUrl: photo.user.links.html, downloadUrl: photo.links.download_location,
        }));
        res.json(imageDetails);
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error);
        res.status(500).json({ message: 'Failed to fetch images.' });
    }
};

// This function for download tracking remains unchanged
export const trackDownload = async (req, res) => {
    const { downloadUrl } = req.body;
    if (!downloadUrl) { return res.status(400).json({ message: 'Download URL is required.' }); }
    try {
        await fetch(downloadUrl, { headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } });
        res.status(200).json({ message: 'Download tracked.' });
    } catch (error) {
        console.error('Error tracking Unsplash download:', error);
        res.status(500).json({ message: 'Failed to track download.' });
    }
};

// --- THIS IS THE NEW, CORRECTED FUNCTION FOR AI IMAGE GENERATION ---
// @desc    Generate an image from a text prompt using Stability AI
// @route   POST /api/ai/generate-image
// @access  Private/Organizer
export const generateImage = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'A prompt is required.' });
    }

    const STABILITY_AI_URL = `https://api.stability.ai/v2beta/stable-image/generate/sd3`;

    try {
        console.log(`[AI Gen] Sending prompt to Stability AI: "${prompt}"`);

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('output_format', 'png'); // We want a standard PNG image

        // 1. Call the new AI Artist (Stability AI)
        const aiResponse = await fetch(STABILITY_AI_URL, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
                'Accept': 'image/*' // We expect an image back
            },
            body: formData
        });

        if (!aiResponse.ok) {
            const errorBody = await aiResponse.text();
            throw new Error(`Stability AI API error: ${aiResponse.statusText} - ${errorBody}`);
        }

        // The response is the raw image data, which we need to convert to Base64
        const imageBuffer = await aiResponse.buffer();
        const base64ImageData = imageBuffer.toString('base64');

        console.log('[AI Gen] Image data received from Stability AI.');

        // 2. Take the new artwork to the Photo Lab (Cloudinary)
        const uploadedResponse = await cloudinary.uploader.upload(
            `data:image/png;base64,${base64ImageData}`,
            {
                folder: 'evently_ai_generated',
                resource_type: 'image',
            }
        );

        console.log('[AI Gen] Image successfully uploaded to Cloudinary.');

        // 3. Deliver the final, permanent URL back to the frontend
        res.status(200).json({ imageUrl: uploadedResponse.secure_url });

    } catch (error) {
        console.error("AI Image Generation Error:", error);
        res.status(500).json({ message: 'Failed to generate image.' });
    }
};