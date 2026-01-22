import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, Video, Zap, Clock } from 'lucide-react'
import { apiService } from '../lib/api'

export default function DailyMetrics({ user }) {
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [videoSessions, setVideoSessions] = useState({ count: 0, total_minutes: 0, categories: [] })
    const [extraEffort, setExtraEffort] = useState(false)

    // Morning Form State
    const [morningForm, setMorningForm] = useState({
        wake_time: '06:00',
        sleep_quality: 3,
        energy_level: 3,
        mood: 3,
        notes: ''
    })

    // Evening Form State
    const [eveningForm, setEveningForm] = useState({
        energy_level: 3,
        mood: 3,
        libido: 3,
        stress_level: 2,
        cramping: 'None',
        notes: ''
    })

    useEffect(() => {
        if (!user?.id) return
        loadMetrics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const loadMetrics = async () => {
        if (!user?.id) return
        const today = new Date().toISOString().split('T')[0]
        try {
            const data = await apiService.getDailyMetrics(today, user.id)
            if (data) {
                setMetrics(data)
                if (data.morning?.wake_time) setMorningForm(prev => ({ ...prev, ...data.morning }))
                if (data.evening?.energy_level) setEveningForm(prev => ({ ...prev, ...data.evening }))
                if (data.video_sessions) setVideoSessions(data.video_sessions)
                if (data.extra_effort) setExtraEffort(data.extra_effort)
            }
        } catch (error) {
            console.error("Failed to load metrics:", error)
        } finally {
            setLoading(false)
        }
    }

    const submitMorning = async () => {
        const today = new Date().toISOString().split('T')[0]
        try {
            await apiService.saveMorningCheckin({
                date: today,
                user_id: user.id,
                morning: morningForm
            })
            alert("Morning check-in saved!")
        } catch (e) {
            console.error(e)
        }
    }

    const submitEvening = async () => {
        const today = new Date().toISOString().split('T')[0]
        try {
            await apiService.saveEveningCheckin({
                date: today,
                user_id: user.id,
                evening: eveningForm
            })
            alert("Evening check-in saved!")
        } catch (e) {
            console.error(e)
        }
    }

    const MetricSlider = ({ label, value, onChange, min = 1, max = 5 }) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label>{label}</Label>
                <span className="text-sm text-muted-foreground">{value}/{max}</span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={1}
                onValueChange={(vals) => onChange(vals[0])}
            />
        </div>
    )

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Daily Check-in</CardTitle>
                        <CardDescription>Monitor your vitals and mindset</CardDescription>
                    </div>
                    {extraEffort && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                            <Zap className="w-3 h-3 mr-1" />
                            Extra Effort
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Video Sessions Summary */}
                {(videoSessions.count > 0 || videoSessions.total_minutes > 0) && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium">Today's Video Workouts</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {videoSessions.total_minutes} min
                            </span>
                            <span>{videoSessions.count} session{videoSessions.count !== 1 ? 's' : ''}</span>
                        </div>
                        {videoSessions.categories?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {videoSessions.categories.map((cat, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <Tabs defaultValue="morning">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="morning"><Sun className="w-4 h-4 mr-2" /> Morning</TabsTrigger>
                        <TabsTrigger value="evening"><Moon className="w-4 h-4 mr-2" /> Evening</TabsTrigger>
                    </TabsList>

                    <TabsContent value="morning" className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Wake Time</Label>
                                <input
                                    type="time"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={morningForm.wake_time}
                                    onChange={e => setMorningForm({ ...morningForm, wake_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <MetricSlider
                            label="Sleep Quality"
                            value={morningForm.sleep_quality}
                            onChange={v => setMorningForm({ ...morningForm, sleep_quality: v })}
                        />

                        <MetricSlider
                            label="Morning Energy"
                            value={morningForm.energy_level}
                            onChange={v => setMorningForm({ ...morningForm, energy_level: v })}
                        />

                        <div className="space-y-2">
                            <Label>Morning Notes / Dreams</Label>
                            <Textarea
                                placeholder="How did you sleep? Any dreams?"
                                value={morningForm.notes || ''}
                                onChange={e => setMorningForm({ ...morningForm, notes: e.target.value })}
                            />
                        </div>

                        <Button onClick={submitMorning} className="w-full">Save Morning Check-in</Button>
                    </TabsContent>

                    <TabsContent value="evening" className="space-y-4 pt-4">
                        <MetricSlider
                            label="Evening Energy"
                            value={eveningForm.energy_level}
                            onChange={v => setEveningForm({ ...eveningForm, energy_level: v })}
                        />
                        <MetricSlider
                            label="Mood"
                            value={eveningForm.mood}
                            onChange={v => setEveningForm({ ...eveningForm, mood: v })}
                        />
                        <MetricSlider
                            label="Libido"
                            value={eveningForm.libido}
                            onChange={v => setEveningForm({ ...eveningForm, libido: v })}
                        />
                        <MetricSlider
                            label="Stress Level"
                            value={eveningForm.stress_level}
                            onChange={v => setEveningForm({ ...eveningForm, stress_level: v })}
                        />

                        <div className="space-y-2">
                            <Label>Cramping</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={eveningForm.cramping}
                                onChange={e => setEveningForm({ ...eveningForm, cramping: e.target.value })}
                            >
                                <option value="None">None</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Evening Reflection</Label>
                            <Textarea
                                placeholder="How was the day?"
                                value={eveningForm.notes || ''}
                                onChange={e => setEveningForm({ ...eveningForm, notes: e.target.value })}
                            />
                        </div>

                        <Button onClick={submitEvening} className="w-full">Save Evening Check-in</Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
