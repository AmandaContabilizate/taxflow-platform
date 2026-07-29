import { Composition } from 'remotion'
import { WelcomeVideo } from './welcome-remotion'

export const RemotionRoot = () => {
  return (
    <Composition
      id="WelcomeVideo"
      component={WelcomeVideo}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  )
}
