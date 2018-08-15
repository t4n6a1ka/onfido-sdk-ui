// @flow
import * as React from 'react'
import { h, Component } from 'preact'
import Error from '../Error'
import Spinner from '../Spinner'
import LivenessCamera from '../Camera/LivenessCamera'
import type { CameraType } from '../Camera/CameraTypes'
import type { ChallengeType } from './Challenge'
import { performHttpReq } from '../utils/http'
import { currentSeconds } from '../utils'

const serverError = { name: 'SERVER_ERROR', type: 'error' }

type State = {
  id: string,
  challenges: Array<ChallengeType>,
  hasError: boolean,
  hasLoaded: boolean,
  startedAt: number,
  switchSeconds?: number,
};

const initialState = {
  id: '',
  challenges: [],
  hasLoaded: false,
  hasError: false,
  startedAt: 0
};

export default class Liveness extends Component<CameraType, State> {

  state: State = {
    ...initialState,
  }

  componentDidMount() {
    this.loadChallenges()
  }

  loadChallenges = () => {
    this.setState({...initialState})
    const options = {
      endpoint: `${process.env.FACE_TORII_URL || ''}/challenge`,
      contentType: 'application/json',
      token: `Bearer ${this.props.token}`
    }
    performHttpReq(options, this.handleResponse, this.handleError)
  }

  handleResponse = (response: Object) => {
    const {challenge, id} = response.data
    this.setState({ challenges: challenge, id, hasLoaded: true })
  }

  handleError = () => {
    this.setState({ hasLoaded: true, hasError: true })
  }

  handleChallengeSwitch = () => {
    if (this.state.startedAt) {
      this.setState({ switchSeconds: currentSeconds() - this.state.startedAt })
    }
  }

  handleVideoRecordingStart = () => {
    this.setState({ startedAt: currentSeconds() })
  }

  handleVideoRecorded = (blob: ?Blob) => {
    const { challenges, id, switchSeconds } = this.state
    this.props.onVideoRecorded(blob, {
      challenges, id, switchSeconds,
    })
  }

  render() {
    const { i18n = {} } = this.props
    const { hasLoaded, hasError, challenges } = this.state

    return (
      <div>{
        hasLoaded ?
          <LivenessCamera {...{
            ...this.props,
            hasError,
            cameraError: hasError ? serverError : undefined,
            challenges,
            onVideoRecorded: this.handleVideoRecorded,
            onVideoRecordingStart: this.handleVideoRecordingStart,
            onSwitchChallenge: this.handleChallengeSwitch,
            onRedo: this.loadChallenges,
          }} />
          :
          <Spinner />
      }
      </div>
    )
  }
}
