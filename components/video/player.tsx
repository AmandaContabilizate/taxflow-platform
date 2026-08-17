'use client'

import { Player, type PlayerRef } from '@remotion/player'
import { useRef, useState } from 'react'
import { WelcomeVideo } from './welcome-remotion'

export function RemotionPlayer() {
  const playerRef = useRef<PlayerRef>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    playerRef.current?.play(e)
    setIsPlaying(true)
  }

  const handleToggle = () => {
    if (isPlaying) {
      playerRef.current?.pause()
    } else {
      playerRef.current?.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Player
        ref={playerRef}
        component={WelcomeVideo}
        durationInFrames={1200}
        compositionWidth={390}
        compositionHeight={770}
        fps={30}
        style={{ width: '100%', height: '100%' }}
        controls
        loop
        acknowledgeRemotionLicense
        numberOfSharedAudioTags={5}
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClickCapture={handlePlay}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(16, 185, 129, 0.9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              transition: 'all 0.2s ease',
            }}
          >
            ▶
          </div>
        </button>
      )}
    </div>
  )
}
