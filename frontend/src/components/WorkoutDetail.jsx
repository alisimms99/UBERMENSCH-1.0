import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, BarChart, ArrowLeft } from 'lucide-react'
import { apiService } from '../lib/api'

export default function WorkoutDetail({ user }) {
    const { templateId } = useParams()
    const navigate = useNavigate()
    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTemplate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId])

    const loadTemplate = async () => {
        try {
            const data = await apiService.getWorkoutTemplate(templateId)
            setTemplate(data)
        } catch (error) {
            console.error("Failed to load template:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStart = () => {
        navigate(`/workout/session/${templateId}`)
    }

    if (loading) return <div className="p-6">Loading...</div>
    if (!template) return <div className="p-6">Template not found</div>

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl mb-2">{template.name}</CardTitle>
                            <CardDescription className="text-lg">{template.description}</CardDescription>
                        </div>
                        <Button size="lg" onClick={handleStart} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Play className="w-5 h-5 mr-2" /> Start Workout
                        </Button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {template.estimated_duration_min}-{template.estimated_duration_max} min
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 capitalize">
                            <BarChart className="w-4 h-4" /> {template.difficulty_level}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-semibold mb-4">Workout Structure</h3>
                    <div className="space-y-4">
                        {template.exercises.map((item, index) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-lg">{item.exercise.name}</h4>
                                        <Badge variant="secondary" className="capitalize">{item.phase}</Badge>
                                    </div>

                                    <div className="text-sm text-muted-foreground flex gap-4">
                                        {item.exercise.is_timed ? (
                                            <span>{item.target_duration_seconds} sec</span>
                                        ) : (
                                            <span>{item.target_reps} reps</span>
                                        )}
                                        <span>{item.target_sets} sets</span>
                                    </div>
                                    {item.exercise.description && (
                                        <p className="text-sm text-muted-foreground mt-2">{item.exercise.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
