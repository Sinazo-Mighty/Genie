# Hugging Face API Integration

This app uses Hugging Face's AI models for ingredient detection and image enhancement.

## Setup Instructions

### 1. Get Your Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in to your account
3. Go to your [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name (e.g., "Cooking App")
6. Select "Read" permission
7. Click "Generate token"
8. Copy your API key (starts with `hf_...`)

### 2. Add the API Key to Your Project

In the v0 interface:
1. Click on the **sidebar menu** on the left
2. Select **"Vars"** (Environment Variables)
3. Click **"Add Variable"**
4. Enter:
   - **Name:** `HUGGING_FACE_API_KEY`
   - **Value:** Your Hugging Face API key (e.g., `hf_xxxxxxxxxxxxx`)
5. Click **"Save"**

### 3. How It Works

The app uses two Hugging Face models:

#### Ingredient Detection (`nateraw/food`)
- Identifies food ingredients from uploaded images
- Classifies food items with confidence scores
- Provides accurate ingredient detection

#### Image Enhancement (`valiantcat/Qwen-Image-Edit-MeiTu`)
- Enhances food photos before analysis
- Improves lighting, clarity, and vibrancy
- Makes images more appetizing and easier to analyze

**Fallback System:**
1. **First:** Tries Hugging Face API (if key is available)
2. **Second:** Falls back to OpenAI Vision API (if key is available)
3. **Third:** Uses sample ingredients as fallback

### 4. Benefits of Hugging Face

- **Specialized:** Uses models specifically trained for food recognition
- **Free tier:** Generous free usage limits
- **Fast:** Quick inference times
- **Accurate:** High accuracy for food classification
- **Image Enhancement:** Improve photo quality before analysis

### 5. Alternative: OpenAI

If you prefer OpenAI's GPT-4 Vision:
- Add `OPENAI_API_KEY` instead
- The app will automatically use it as a fallback

## Features

### AI Ingredient Scanner
- Upload or capture images of ingredients
- AI automatically detects what ingredients are visible
- Get recipe suggestions based on detected ingredients

### Image Enhancement
- Click "Enhance Image with AI" to improve photo quality
- Makes food photos clearer and more vibrant
- Better image quality = better ingredient detection

## Troubleshooting

**Model Loading Error:**
- The first request might take longer as the model loads
- Subsequent requests will be faster

**Low Confidence Results:**
- Ensure the image is clear and well-lit
- Make sure ingredients are visible and not obscured
- Try using the "Enhance Image" feature first
- Try uploading a higher quality image

**API Rate Limits:**
- Free tier has rate limits
- Consider upgrading for higher usage

**Image Enhancement Not Working:**
- Ensure `HUGGING_FACE_API_KEY` is set
- Check that the image is under 5MB
- The enhancement process may take 10-30 seconds
