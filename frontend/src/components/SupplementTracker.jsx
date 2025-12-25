import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Pill, Clock, RefreshCw } from 'lucide-react'
import { apiService } from '../lib/api' // We will update this

export default function SupplementTracker({ user }) {
    const [supplements, setSupplements] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('schedule')

    useEffect(() => {
        if (!user?.id) return
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const loadData = async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const dateStr = new Date().toISOString().split('T')[0]
            const [suppsData, logsData] = await Promise.all([
                apiService.getSupplements(user.id),
                apiService.getSupplementLogs(dateStr, user.id)
            ])
            setSupplements(suppsData)
            setLogs(logsData)
        } catch (error) {
            console.error("Failed to load supplements:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (suppId, currentStatus) => {
        // Optimistic update could be done here
        try {
            const now = new Date()
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

            const newLog = await apiService.logSupplement({
                user_id: user.id,
                supplement_id: suppId,
                date: new Date().toISOString().split('T')[0],
                time_taken: timeStr,
                taken: !currentStatus
            })

            setLogs(prev => [...prev, newLog])
            // Refresh to get updated inventory
            loadData()
        } catch (error) {
            console.error("Failed to log supplement:", error)
        }
    }

    const getLogForSupp = (suppId) => {
        return logs.find(l => l.supplement_id === suppId)
    }

    const groupedSupplements = {
        morning: supplements.filter(s => s.schedule?.times?.includes('morning')),
        day: supplements.filter(s => s.schedule?.times?.includes('with_meal') || s.schedule?.times?.includes('afternoon')),
        evening: supplements.filter(s => s.schedule?.times?.includes('evening')),
        weekly: supplements.filter(s => s.schedule?.frequency === 'weekly')
    }

    if (loading) return <div>Loading supplements...</div>

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Pill className="w-5 h-5 text-blue-500" />
                            Supplement Stack
                        </CardTitle>
                        <CardDescription>Track your daily intake</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="space-y-4">
                        {['morning', 'day', 'evening'].map(period => (
                            groupedSupplements[period].length > 0 && (
                                <div key={period} className="space-y-2">
                                    <h3 className="text-sm font-semibold capitalize text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> {period}
                                    </h3>
                                    <div className="space-y-2">
                                        {groupedSupplements[period].map(supp => {
                                            const log = getLogForSupp(supp.id)
                                            const isTaken = !!log?.taken

                                            return (
                                                <div key={supp.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            id={`supp-${supp.id}`}
                                                            checked={isTaken}
                                                            onCheckedChange={() => handleToggle(supp.id, isTaken)}
                                                            disabled={isTaken} // Optional: disable if already taken? Or allow toggle off?
                                                        />
                                                        <div>
                                                            <label htmlFor={`supp-${supp.id}`} className={`font-medium cursor-pointer ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                                                                {supp.name}
                                                            </label>
                                                            <div className="text-xs text-muted-foreground">
                                                                {supp.dosage} • {supp.form}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isTaken && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {log.time_taken}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        ))}

                        {groupedSupplements.weekly.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="text-sm font-semibold text-muted-foreground">Weekly</h3>
                                {groupedSupplements.weekly.map(supp => {
                                    const log = getLogForSupp(supp.id)
                                    const isTaken = !!log?.taken
                                    return (
                                        <div key={supp.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isTaken}
                                                    onCheckedChange={() => handleToggle(supp.id, isTaken)}
                                                />
                                                <div>
                                                    <div className={`font-medium ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                                                        {supp.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {supp.dosage}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="inventory">
                        <div className="space-y-4">
                            {supplements.map(supp => (
                                <div key={supp.id} className="flex justify-between items-center p-2 border-b last:border-0">
                                    <div>
                                        <div className="font-medium">{supp.name}</div>
                                        <div className="text-xs text-muted-foreground">{supp.brand}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${supp.inventory?.quantity_remaining <= supp.inventory?.reorder_threshold ? 'text-red-500' : ''}`}>
                                            {supp.inventory?.quantity_remaining || 0} left
                                        </div>
                                        {supp.inventory?.quantity_remaining <= supp.inventory?.reorder_threshold && (
                                            <Badge variant="destructive" className="text-[10px] h-4">Restock</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full mt-4" variant="outline">
                                <Plus className="w-4 h-4 mr-2" /> Add Supplement
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
