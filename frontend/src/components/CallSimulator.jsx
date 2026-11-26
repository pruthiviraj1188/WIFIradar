import React, { useState, useEffect } from 'react'

const CallSimulator = ({ contacts, onCallComplete }) => {
  const [currentCallIndex, setCurrentCallIndex] = useState(0)
  const [callStatus, setCallStatus] = useState('initiating') // initiating, ringing, connected, completed
  const [callLogs, setCallLogs] = useState([])
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    if (!contacts || contacts.length === 0) return

    const simulateCall = async () => {
      const contact = contacts[currentCallIndex]
      
      // Initiating
      setCallStatus('initiating')
      setCallLogs(prev => [...prev, {
        contact: contact.name,
        status: 'Initiating call...',
        time: new Date().toLocaleTimeString(),
        color: 'text-yellow-600'
      }])
      
      await sleep(1500)
      
      // Ringing
      setCallStatus('ringing')
      setCallLogs(prev => [...prev, {
        contact: contact.name,
        status: `Calling ${contact.phone}...`,
        time: new Date().toLocaleTimeString(),
        color: 'text-blue-600'
      }])
      
      await sleep(2000)
      
      // Connected
      setCallStatus('connected')
      setCallLogs(prev => [...prev, {
        contact: contact.name,
        status: 'Connected - Playing emergency message',
        time: new Date().toLocaleTimeString(),
        color: 'text-green-600'
      }])
      
      // Count down call duration
      for (let i = 0; i < 8; i++) {
        setTimer(i + 1)
        await sleep(500)
      }
      
      // Completed
      setCallStatus('completed')
      setCallLogs(prev => [...prev, {
        contact: contact.name,
        status: '✓ Call completed successfully',
        time: new Date().toLocaleTimeString(),
        color: 'text-green-700 font-semibold'
      }])
      
      await sleep(1000)
      
      // Move to next contact or finish
      if (currentCallIndex < contacts.length - 1) {
        setCurrentCallIndex(currentCallIndex + 1)
        setTimer(0)
      } else {
        // All calls completed
        setCallLogs(prev => [...prev, {
          contact: 'System',
          status: `🎉 All ${contacts.length} emergency contacts notified!`,
          time: new Date().toLocaleTimeString(),
          color: 'text-green-700 font-bold'
        }])
        if (onCallComplete) {
          onCallComplete()
        }
      }
    }

    simulateCall()
  }, [currentCallIndex, contacts])

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  if (!contacts || contacts.length === 0) {
    return null
  }

  const currentContact = contacts[currentCallIndex]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-signal-alert text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold">Emergency Call System Active</h2>
          </div>
          <p className="text-sm mt-1 opacity-90">
            Contacting emergency contacts - Fall detected
          </p>
        </div>

        {/* Current Call Display */}
        <div className="p-6 border-b">
          <div className="text-center">
            {/* Phone Icon Animation */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-signal-alert/10 mb-4">
              <div className={`text-5xl ${callStatus === 'ringing' ? 'animate-bounce' : ''}`}>
                📞
              </div>
            </div>

            {/* Contact Info */}
            <h3 className="text-2xl font-bold text-ink mb-2">
              {currentContact?.name || 'Unknown'}
            </h3>
            <p className="text-lg font-mono text-ink-secondary mb-1">
              {currentContact?.phone || ''}
            </p>
            <p className="text-sm text-ink-muted mb-4">
              {currentContact?.relation || 'Emergency Contact'}
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-subtle">
              {callStatus === 'initiating' && (
                <>
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">Initiating call...</span>
                </>
              )}
              {callStatus === 'ringing' && (
                <>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                  <span className="text-sm font-medium">Ringing...</span>
                </>
              )}
              {callStatus === 'connected' && (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Connected - {timer}s</span>
                </>
              )}
              {callStatus === 'completed' && (
                <>
                  <span className="w-2 h-2 bg-green-700 rounded-full"></span>
                  <span className="text-sm font-medium">Call completed ✓</span>
                </>
              )}
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="text-sm text-ink-muted mb-2">
                Contact {currentCallIndex + 1} of {contacts.length}
              </div>
              <div className="w-full bg-subtle rounded-full h-2">
                <div 
                  className="bg-signal-alert h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentCallIndex + 1) / contacts.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Message Preview */}
        {callStatus === 'connected' && (
          <div className="px-6 py-4 bg-green-50 border-b">
            <div className="text-sm">
              <div className="font-semibold text-green-800 mb-2">
                🔊 Playing Automated Message:
              </div>
              <div className="text-green-700 italic">
                "Emergency alert! This is WiFi Radar automated system. 
                A fall has been detected in Living Room. 
                The person has not recovered for 30 seconds. 
                Please check on them immediately..."
              </div>
            </div>
          </div>
        )}

        {/* Call Logs */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-semibold text-ink mb-3">Call Log:</h4>
          <div className="space-y-2">
            {callLogs.map((log, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 text-sm animate-fade-in"
              >
                <span className="text-ink-muted font-mono text-xs whitespace-nowrap">
                  {log.time}
                </span>
                <span className="font-medium text-ink-secondary">
                  {log.contact}:
                </span>
                <span className={log.color}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-subtle border-t">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>System: WiFi Radar Emergency Response</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallSimulator
