import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { image, prompt } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "HUGGING_FACE_API_KEY not configured",
          message: "Add HUGGING_FACE_API_KEY to use image enhancement",
        },
        { status: 500 },
      )
    }

    // Convert base64 to blob if needed
    let imageBlob: Blob
    if (image.startsWith("data:")) {
      const base64Data = image.split(",")[1]
      const binaryData = Buffer.from(base64Data, "base64")
      imageBlob = new Blob([binaryData])
    } else {
      // If it's a URL, fetch it
      const imageResponse = await fetch(image)
      imageBlob = await imageResponse.blob()
    }

    // Use Hugging Face Inference API with Qwen-Image-Edit-MeiTu model
    const response = await fetch("https://api-inference.huggingface.co/models/valiantcat/Qwen-Image-Edit-MeiTu", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: image.startsWith("data:") ? image.split(",")[1] : await imageBlob.arrayBuffer(),
          prompt: prompt || "Enhance this food image to make it clearer, more vibrant, and appetizing",
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Hugging Face API error:", errorText)
      return NextResponse.json(
        {
          error: "Failed to enhance image",
          message: "The image enhancement service is currently unavailable. Please try again later.",
        },
        { status: response.status },
      )
    }

    // Get the enhanced image as blob
    const enhancedImageBlob = await response.blob()

    // Convert blob to base64
    const arrayBuffer = await enhancedImageBlob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const enhancedImageUrl = `data:${enhancedImageBlob.type};base64,${base64}`

    return NextResponse.json({
      success: true,
      enhancedImage: enhancedImageUrl,
      message: "Image enhanced successfully",
    })
  } catch (error) {
    console.error("Error enhancing image:", error)
    return NextResponse.json(
      {
        error: "Failed to enhance image",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
