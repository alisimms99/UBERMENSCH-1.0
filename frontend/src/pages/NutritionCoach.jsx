import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Utensils, 
  Clock, 
  AlertTriangle,
  ChefHat,
  Calendar,
  Search,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiService } from '../lib/api_simple'

export default function NutritionCoach({ user }) {
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const [activeView, setActiveView] = useState('meal') // meal, plan, analyze
  
  // Meal suggestion state
  const [mealType, setMealType] = useState('lunch')
  const [timeToCook, setTimeToCook] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [goalFocus, setGoalFocus] = useState('')
  const [mealSuggestion, setMealSuggestion] = useState(null)
  
  // Daily plan state
  const [calorieTarget, setCalorieTarget] = useState('')
  const [mealsPerDay, setMealsPerDay] = useState('3')
  const [dailyPlan, setDailyPlan] = useState(null)
  
  // Analyze meal state
  const [mealDescription, setMealDescription] = useState('')
  const [mealAnalysis, setMealAnalysis] = useState(null)

  useEffect(() => {
    checkAIAvailability()
  }, [])

  const checkAIAvailability = async () => {
    try {
      const response = await apiService.request('/nutrition/coach/availability', { method: 'GET' })
      setAiAvailable(response.available)
    } catch (error) {
      console.error('Failed to check AI availability:', error)
      setAiAvailable(false)
    }
  }

  const suggestMeal = async () => {
    setLoading(true)
    try {
      const ingredientsList = ingredients ? ingredients.split(',').map(i => i.trim()).filter(i => i) : []
      
      const response = await apiService.request('/nutrition/coach/meal-suggestion', {
        method: 'POST',
        body: {
          user_id: user.id,
          meal_type: mealType,
          time_to_cook: timeToCook ? parseInt(timeToCook) : null,
          ingredients_available: ingredientsList,
          goal_focus: goalFocus || null
        }
      })
      
      if (response.success) {
        setMealSuggestion(response)
      }
    } catch (error) {
      console.error('Failed to suggest meal:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyPlan = async () => {
    setLoading(true)
    try {
      const response = await apiService.request('/nutrition/coach/daily-plan', {
        method: 'POST',
        body: {
          user_id: user.id,
          calorie_target: calorieTarget ? parseInt(calorieTarget) : null,
          meals_per_day: parseInt(mealsPerDay)
        }
      })
      
      if (response.success) {
        setDailyPlan(response)
      }
    } catch (error) {
      console.error('Failed to generate daily plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeMeal = async () => {
    if (!mealDescription.trim()) {
      alert('Please describe your meal')
      return
    }
    
    setLoading(true)
    try {
      const response = await apiService.request('/nutrition/coach/analyze-meal', {
        method: 'POST',
        body: {
          user_id: user.id,
          description: mealDescription
        }
      })
      
      if (response.success) {
        setMealAnalysis(response)
      }
    } catch (error) {
      console.error('Failed to analyze meal:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!aiAvailable) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span>Nutrition Coach Unavailable</span>
            </CardTitle>
            <CardDescription>
              The AI nutrition coach requires an OpenAI API key to function.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please configure the OPENAI_API_KEY environment variable to use this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
          <Utensils className="w-8 h-8 text-green-500" />
          <span>Nutrition Coach</span>
        </h1>
        <p className="text-muted-foreground">
          AI-powered meal suggestions, daily plans, and nutrition analysis
        </p>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'meal' ? 'default' : 'outline'}
          onClick={() => setActiveView('meal')}
        >
          <ChefHat className="w-4 h-4 mr-2" />
          Meal Suggestion
        </Button>
        <Button
          variant={activeView === 'plan' ? 'default' : 'outline'}
          onClick={() => setActiveView('plan')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Daily Plan
        </Button>
        <Button
          variant={activeView === 'analyze' ? 'default' : 'outline'}
          onClick={() => setActiveView('analyze')}
        >
          <Search className="w-4 h-4 mr-2" />
          Analyze Meal
        </Button>
      </div>

      {/* Meal Suggestion View */}
      {activeView === 'meal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Get a Meal Suggestion</CardTitle>
              <CardDescription>
                Personalized meal ideas based on your goals and constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Meal Type</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-background"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Time to Cook (minutes)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg bg-background"
                    placeholder="e.g., 30"
                    value={timeToCook}
                    onChange={(e) => setTimeToCook(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Ingredients (comma-separated, optional)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg bg-background"
                  placeholder="e.g., chicken, rice, broccoli"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Goal Focus (optional)</label>
                <select
                  className="w-full p-2 border rounded-lg bg-background"
                  value={goalFocus}
                  onChange={(e) => setGoalFocus(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="protein">High Protein</option>
                  <option value="low-carb">Low Carb</option>
                  <option value="energy">Energy Boost</option>
                  <option value="recovery">Post-Workout Recovery</option>
                </select>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={suggestMeal}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest Meal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Meal Suggestion Result */}
          {mealSuggestion && mealSuggestion.meal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{mealSuggestion.meal.name}</span>
                    <div className="flex space-x-2">
                      {mealSuggestion.meal.prep_time && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Prep: {mealSuggestion.meal.prep_time}min
                        </Badge>
                      )}
                      {mealSuggestion.meal.cook_time && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Cook: {mealSuggestion.meal.cook_time}min
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>{mealSuggestion.meal.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Macros */}
                  {mealSuggestion.meal.macros && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <MacroCard label="Calories" value={mealSuggestion.meal.macros.calories} />
                      <MacroCard label="Protein" value={`${mealSuggestion.meal.macros.protein}g`} />
                      <MacroCard label="Carbs" value={`${mealSuggestion.meal.macros.carbs}g`} />
                      <MacroCard label="Fat" value={`${mealSuggestion.meal.macros.fat}g`} />
                    </div>
                  )}

                  {/* Ingredients */}
                  {mealSuggestion.meal.ingredients && (
                    <div>
                      <h4 className="font-semibold mb-2">Ingredients</h4>
                      <ul className="space-y-1">
                        {mealSuggestion.meal.ingredients.map((ingredient, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Instructions */}
                  {mealSuggestion.meal.instructions && (
                    <div>
                      <h4 className="font-semibold mb-2">Instructions</h4>
                      <ol className="space-y-2">
                        {mealSuggestion.meal.instructions.map((step, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="font-medium text-green-500">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Reasoning */}
                  {mealSuggestion.reasoning && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-600">Why This Meal?</h4>
                      <p className="text-sm">{mealSuggestion.reasoning}</p>
                    </div>
                  )}

                  {/* Alternatives */}
                  {mealSuggestion.alternatives && mealSuggestion.alternatives.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Alternative Options</h4>
                      <div className="space-y-2">
                        {mealSuggestion.alternatives.map((alt, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <h5 className="font-medium">{alt.name}</h5>
                            <p className="text-sm text-muted-foreground">{alt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Daily Plan View */}
      {activeView === 'plan' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Generate Daily Meal Plan</CardTitle>
              <CardDescription>
                Get a complete day of meals optimized for your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Calorie Target (optional)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg bg-background"
                    placeholder="e.g., 2000"
                    value={calorieTarget}
                    onChange={(e) => setCalorieTarget(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Meals Per Day</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-background"
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(e.target.value)}
                  >
                    <option value="2">2 meals</option>
                    <option value="3">3 meals</option>
                    <option value="4">4 meals</option>
                  </select>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={generateDailyPlan}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Generate Daily Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Daily Plan Result */}
          {dailyPlan && dailyPlan.plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Total Macros */}
              {dailyPlan.plan.total_macros && (
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Totals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <MacroCard label="Calories" value={dailyPlan.plan.total_macros.calories} />
                      <MacroCard label="Protein" value={`${dailyPlan.plan.total_macros.protein}g`} />
                      <MacroCard label="Carbs" value={`${dailyPlan.plan.total_macros.carbs}g`} />
                      <MacroCard label="Fat" value={`${dailyPlan.plan.total_macros.fat}g`} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meals */}
              {dailyPlan.plan.meals && dailyPlan.plan.meals.map((meal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{meal.meal_type}</span>
                      {meal.time && <Badge variant="outline">{meal.time}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-foreground">{meal.suggestion}</p>
                    {meal.macros && (
                      <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-sm">
                        <div>
                          <p className="text-muted-foreground">Cal</p>
                          <p className="font-semibold">{meal.macros.calories}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Protein</p>
                          <p className="font-semibold">{meal.macros.protein}g</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Carbs</p>
                          <p className="font-semibold">{meal.macros.carbs}g</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fat</p>
                          <p className="font-semibold">{meal.macros.fat}g</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              {dailyPlan.plan.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{dailyPlan.plan.notes}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Analyze Meal View */}
      {activeView === 'analyze' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Analyze Your Meal</CardTitle>
              <CardDescription>
                Describe what you ate and get instant nutrition feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meal Description
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg bg-background"
                  rows={4}
                  placeholder="e.g., I had 2 eggs, 3 strips of bacon, and a slice of toast with butter"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={analyzeMeal}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze Meal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Result */}
          {mealAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Estimated Macros */}
              {mealAnalysis.estimated_macros && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estimated Macros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <MacroCard label="Calories" value={mealAnalysis.estimated_macros.calories} />
                      <MacroCard label="Protein" value={`${mealAnalysis.estimated_macros.protein}g`} />
                      <MacroCard label="Carbs" value={`${mealAnalysis.estimated_macros.carbs}g`} />
                      <MacroCard label="Fat" value={`${mealAnalysis.estimated_macros.fat}g`} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback */}
              {mealAnalysis.feedback && (
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{mealAnalysis.feedback}</p>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {mealAnalysis.suggestions && mealAnalysis.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Suggestions for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mealAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function MacroCard({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
