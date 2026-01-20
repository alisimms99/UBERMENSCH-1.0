import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Pill, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Sun,
  Sunset,
  Moon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiService } from '../lib/api_simple'

export default function SupplementAdvisor({ user }) {
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const [activeView, setActiveView] = useState('analyze') // analyze, protocol, interaction
  
  // Analyze state
  const [concern, setConcern] = useState('')
  const [analysis, setAnalysis] = useState(null)
  
  // Protocol state
  const [protocol, setProtocol] = useState(null)
  
  // Interaction checker state
  const [selectedSupplements, setSelectedSupplements] = useState([])
  const [interactionResult, setInteractionResult] = useState(null)
  const [supplementInput, setSupplementInput] = useState('')

  useEffect(() => {
    checkAIAvailability()
  }, [])

  const checkAIAvailability = async () => {
    try {
      const response = await apiService.request('/supplements/advisor/availability', { method: 'GET' })
      setAiAvailable(response.available)
    } catch (error) {
      console.error('Failed to check AI availability:', error)
      setAiAvailable(false)
    }
  }

  const analyzeStack = async () => {
    setLoading(true)
    try {
      const response = await apiService.request('/supplements/advisor/analyze', {
        method: 'POST',
        body: {
          user_id: user.id,
          concern: concern || null
        }
      })
      
      if (response.success) {
        setAnalysis(response)
      }
    } catch (error) {
      console.error('Failed to analyze stack:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDailyProtocol = async () => {
    setLoading(true)
    try {
      const response = await apiService.request(`/supplements/advisor/daily-protocol?user_id=${user.id}`, {
        method: 'GET'
      })
      
      setProtocol(response)
    } catch (error) {
      console.error('Failed to get protocol:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkInteractions = async () => {
    if (selectedSupplements.length < 2) {
      alert('Please add at least 2 supplements to check')
      return
    }
    
    setLoading(true)
    try {
      const response = await apiService.request('/supplements/advisor/check-interaction', {
        method: 'POST',
        body: {
          user_id: user.id,
          supplements: selectedSupplements
        }
      })
      
      setInteractionResult(response)
    } catch (error) {
      console.error('Failed to check interactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSupplement = () => {
    if (supplementInput.trim() && !selectedSupplements.includes(supplementInput.trim())) {
      setSelectedSupplements([...selectedSupplements, supplementInput.trim()])
      setSupplementInput('')
    }
  }

  const removeSupplement = (supp) => {
    setSelectedSupplements(selectedSupplements.filter(s => s !== supp))
  }

  if (!aiAvailable) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span>Supplement Advisor Unavailable</span>
            </CardTitle>
            <CardDescription>
              The AI supplement advisor requires an OpenAI API key to function.
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
          <Pill className="w-8 h-8 text-blue-500" />
          <span>Supplement Advisor</span>
        </h1>
        <p className="text-muted-foreground">
          AI-powered supplement optimization, timing, and interaction analysis
        </p>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'analyze' ? 'default' : 'outline'}
          onClick={() => setActiveView('analyze')}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze Stack
        </Button>
        <Button
          variant={activeView === 'protocol' ? 'default' : 'outline'}
          onClick={() => setActiveView('protocol')}
        >
          <Clock className="w-4 h-4 mr-2" />
          Daily Protocol
        </Button>
        <Button
          variant={activeView === 'interaction' ? 'default' : 'outline'}
          onClick={() => setActiveView('interaction')}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Check Interactions
        </Button>
      </div>

      {/* Analyze Stack View */}
      {activeView === 'analyze' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Analyze Your Supplement Stack</CardTitle>
              <CardDescription>
                Get personalized recommendations based on your current supplements and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Any concerns or symptoms? (Optional)
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg bg-background"
                  rows={3}
                  placeholder="e.g., I've been feeling tired, my sleep is off, etc."
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={analyzeStack}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze My Stack
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Overall Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{analysis.analysis}</p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg">{rec.supplement}</h4>
                          <Badge variant={
                            rec.action === 'add' ? 'default' :
                            rec.action === 'remove' ? 'destructive' :
                            rec.action === 'adjust' ? 'secondary' : 'outline'
                          }>
                            {rec.action}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{rec.reasoning}</p>
                        {rec.timing && (
                          <p className="text-sm flex items-center text-blue-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {rec.timing}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {analysis.warnings && analysis.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span>Warnings & Considerations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-orange-500/10 border border-orange-500 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{warning.type}</p>
                          <p className="text-sm text-muted-foreground">{warning.message}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Follow-up Questions */}
              {analysis.questions && analysis.questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5 text-blue-500" />
                      <span>Follow-up Questions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.questions.map((question, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{question}</span>
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

      {/* Daily Protocol View */}
      {activeView === 'protocol' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Daily Supplement Protocol</CardTitle>
              <CardDescription>
                Optimal timing for your supplements throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full"
                onClick={getDailyProtocol}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Generate Daily Protocol
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Protocol Display */}
          {protocol && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Morning */}
              {protocol.morning && protocol.morning.length > 0 && (
                <ProtocolSection title="Morning" icon={Sun} items={protocol.morning} />
              )}

              {/* Afternoon */}
              {protocol.afternoon && protocol.afternoon.length > 0 && (
                <ProtocolSection title="Afternoon" icon={Sunset} items={protocol.afternoon} />
              )}

              {/* Evening */}
              {protocol.evening && protocol.evening.length > 0 && (
                <ProtocolSection title="Evening" icon={Moon} items={protocol.evening} />
              )}

              {/* Warnings */}
              {protocol.warnings && protocol.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span>Important Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {protocol.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{warning}</span>
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

      {/* Interaction Checker View */}
      {activeView === 'interaction' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Check Supplement Interactions</CardTitle>
              <CardDescription>
                Analyze potential interactions between supplements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add supplements to check (minimum 2)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg bg-background"
                    placeholder="e.g., Magnesium, Zinc, etc."
                    value={supplementInput}
                    onChange={(e) => setSupplementInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSupplement()}
                  />
                  <Button onClick={addSupplement}>Add</Button>
                </div>
              </div>

              {/* Selected Supplements */}
              {selectedSupplements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSupplements.map((supp, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {supp}
                      <button
                        onClick={() => removeSupplement(supp)}
                        className="ml-2 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={checkInteractions}
                disabled={loading || selectedSupplements.length < 2}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Check Interactions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Interaction Results */}
          {interactionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {interactionResult.safe ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                    )}
                    <span>{interactionResult.safe ? 'No Major Concerns' : 'Interactions Found'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interactionResult.interactions && interactionResult.interactions.length > 0 ? (
                    interactionResult.interactions.map((interaction, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          interaction.severity === 'high' ? 'bg-red-500/10 border-red-500' :
                          interaction.severity === 'medium' ? 'bg-orange-500/10 border-orange-500' :
                          'bg-yellow-500/10 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{interaction.pair}</h4>
                          <Badge variant={
                            interaction.severity === 'high' ? 'destructive' :
                            interaction.severity === 'medium' ? 'secondary' : 'outline'
                          }>
                            {interaction.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{interaction.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No significant interactions detected between the selected supplements.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function ProtocolSection({ title, icon: Icon, items }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-blue-500" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
            <Pill className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{item.supplement}</h4>
                <span className="text-sm text-muted-foreground">{item.dose}</span>
              </div>
              {item.with_food && (
                <p className="text-xs text-blue-600 mt-1">Take with food</p>
              )}
              {item.notes && (
                <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
