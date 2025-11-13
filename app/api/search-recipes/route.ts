export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""

  try {
    let results = []

    if (query) {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`)
      const data = await response.json()
      results = data.meals || []

      // If no results by name, try searching by first letter (Google-like behavior)
      if (results.length === 0 && query.length > 0) {
        const firstLetter = query.charAt(0)
        const letterResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${firstLetter}`)
        const letterData = await letterResponse.json()
        results = letterData.meals || []
      }
    } else if (category && category !== "All") {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(category)}`,
      )
      const data = await response.json()
      const categoryMeals = data.meals || []

      const detailedMeals = await Promise.all(
        categoryMeals.slice(0, 20).map(async (meal: any) => {
          const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
          const detailData = await detailResponse.json()
          return detailData.meals?.[0] || meal
        }),
      )
      results = detailedMeals
    } else {
      const randomMeals = []
      for (let i = 0; i < 12; i++) {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php")
        const data = await response.json()
        if (data.meals?.[0]) {
          randomMeals.push(data.meals[0])
        }
      }
      results = randomMeals
    }

    // Transform TheMealDB format to our format with complete details
    const transformedRecipes = results.slice(0, 20).map((meal: any) => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory || "Other",
      area: meal.strArea || "International",
      instructions: meal.strInstructions || "Detailed instructions not available",
      thumbnail: meal.strMealThumb || "/placeholder.svg",
      ingredients: extractIngredients(meal),
      tags: [meal.strCategory, meal.strArea].filter(Boolean),
      cookTime: "30 mins",
      difficulty: "Medium",
    }))

    return Response.json(transformedRecipes)
  } catch (error) {
    console.error("Recipe search error:", error)
    return Response.json([])
  }
}

// Helper function to extract ingredients from TheMealDB format
function extractIngredients(meal: any) {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (ingredient) {
      ingredients.push({
        name: ingredient,
        measure: measure || "to taste",
      })
    }
  }
  return ingredients
}
