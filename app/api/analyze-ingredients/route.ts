import { type NextRequest, NextResponse } from "next/server"

async function analyzeWithHuggingFace(imageData: string, apiKey: string) {
  try {
    // Convert base64 to blob if needed
    let imageBlob: Blob
    if (imageData.startsWith("data:")) {
      const base64Data = imageData.split(",")[1]
      const binaryData = atob(base64Data)
      const bytes = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i)
      }
      imageBlob = new Blob([bytes], { type: "image/jpeg" })
    } else {
      // If it's a URL, fetch the image
      const response = await fetch(imageData)
      imageBlob = await response.blob()
    }

    // Use Hugging Face's food classification model
    const response = await fetch("https://api-inference.huggingface.co/models/nateraw/food", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: imageBlob,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Hugging Face API error:", response.status, errorText)
      throw new Error(`Hugging Face API error: ${response.statusText}`)
    }

    const results = await response.json()
    console.log("[v0] Hugging Face results:", results)

    // Extract food items from classification results
    const ingredients = results
      .filter((item: any) => item.score > 0.1) // Filter by confidence
      .map((item: any) => {
        // Clean up the label (remove underscores, numbers, etc.)
        return item.label.toLowerCase().replace(/_/g, " ").replace(/\d+/g, "").trim()
      })
      .slice(0, 10)

    return {
      ingredients,
      confidence: "high",
      source: "huggingface",
    }
  } catch (error) {
    console.error("[v0] Hugging Face error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const huggingfaceKey = process.env.Huggingface || process.env.HUGGING_FACE_API_KEY

    console.log("[v0] Hugging Face API key available:", !!huggingfaceKey)

    if (huggingfaceKey) {
      try {
        console.log("[v0] Using Hugging Face API for ingredient detection")
        const result = await analyzeWithHuggingFace(image, huggingfaceKey)

        if (result.ingredients.length > 0) {
          return NextResponse.json({
            ingredients: result.ingredients,
            confidence: result.confidence,
            message: "AI-powered detection using Hugging Face food classification model",
            source: "huggingface",
          })
        }
      } catch (error) {
        console.error("[v0] Hugging Face failed:", error)
        return NextResponse.json(
          {
            error: "Hugging Face API failed",
            message: error instanceof Error ? error.message : "Unknown error",
            details: "Please check your Hugging Face API key and try again",
          },
          { status: 500 },
        )
      }
    }

    console.log("[v0] No Hugging Face API key available, using smart fallback")
    return NextResponse.json({
      ingredients: ["tomatoes", "cheese", "basil", "olive oil", "garlic", "onions"],
      confidence: "low",
      message: "AI detection unavailable. Add HUGGING_FACE_API_KEY for AI-powered detection. Using sample ingredients.",
      fallback: true,
      source: "fallback",
    })
  } catch (error) {
    console.error("[v0] Error analyzing ingredients:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      },
      { status: 500 },
    )
  }
}
