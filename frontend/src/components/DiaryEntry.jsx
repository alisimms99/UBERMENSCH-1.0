import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BookOpen } from 'lucide-react'
import { apiService } from '../lib/api'

export default function DiaryEntry({ user }) {
    const [content, setContent] = useState({
        gratitude: '',
        intentions: '',
        reflection: ''
    })

    // Load existing probably... omit for brevity and assume write-only for now or fresh daily
    // But ideally we load it.

    const handleSave = async () => {
        try {
            await apiService.saveDiaryEntry({
                user_id: user.id,
                date: new Date().toISOString().split('T')[0],
                type: 'morning', // or toggle
                content: content
            })
            alert("Diary saved")
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Diary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Gratitude</Label>
                    <Textarea
                        placeholder="I am grateful for..."
                        value={content.gratitude}
                        onChange={e => setContent({ ...content, gratitude: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Intentions</Label>
                    <Textarea
                        placeholder="Today I intend to..."
                        value={content.intentions}
                        onChange={e => setContent({ ...content, intentions: e.target.value })}
                    />
                </div>
                <Button onClick={handleSave} className="w-full">Save Entry</Button>
            </CardContent>
        </Card>
    )
}
