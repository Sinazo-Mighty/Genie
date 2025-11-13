export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ error: "No recipe ID provided" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    const data = await response.json()

    if (!data.meals || data.meals.length === 0) {
      return Response.json({ error: "Recipe not found" }, { status: 404 })
    }

    const meal = data.meals[0]

    const ingredients = []
    for (let i = 1; i <= 20; i++) {
      const ingredientKey = `strIngredient${i}`
      const measureKey = `strMeasure${i}`

      if (meal[ingredientKey] && meal[ingredientKey].trim()) {
        ingredients.push({
          name: meal[ingredientKey],
          measure: meal[measureKey] || "1 unit",
        })
      }
    }

    const recipe = {
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      thumbnail: meal.strMealThumb,
      ingredients: ingredients,
      tags: [meal.strCategory, meal.strArea],
      cookTime: "30 mins",
      difficulty: "Medium",
    }

    return Response.json(recipe)
  } catch (error) {
    console.error("Error fetching recipe details:", error)
    return Response.json({ error: "Failed to fetch recipe details" }, { status: 500 })
  }
}
