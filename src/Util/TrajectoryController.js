export const TrajectoryController = (sendJsonMessage, setPlayingState) => {
    const state = {
      timeoutIds: [],
      isPlaying: false,
      currentIndex: 0,
      currentTrajectory: null,
      startTime: null,
      pauseTime: null,
      elapsedTime: 0, // Tracks elapsed time for precise resume
    };
  
    const sendFrame = (frame, index) => {
      if (!state.isPlaying) return; // Prevent sending if not playing
  
      // Send robot pose
      sendJsonMessage({
        method: "set_mira_pose",
        params: {
          left: frame.slice(0, 6).map(Number),
          right: frame.slice(6, 12).map(Number),
        },
        jsonrpc: "2.0",
      });
      // Send camera pose
      sendJsonMessage({
        method: "set_camera_pose",
        params: {
          north: Number(frame[13]),
          east: Number(frame[12]),
        },
        jsonrpc: "2.0",
      });
      state.currentIndex = index;
    };
  
    const clearAllTimeouts = () => {
      state.timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
      state.timeoutIds = [];
    };
  
    const scheduleFrames = (frames, startIndex, initialDelay = 0) => {
      frames.forEach((frame, index) => {
        const actualIndex = startIndex + index;
        const timeoutId = setTimeout(() => {
          sendFrame(frame, actualIndex);
          // If we've reached the end
          if (actualIndex === state.currentTrajectory.data.length - 1) {
            state.isPlaying = false;
            setPlayingState(false);
            state.startTime = null;
            state.pauseTime = null;
          }
        }, initialDelay + index * 10);
        state.timeoutIds.push(timeoutId);
      });
    };
  
    const sendTrajectory = (trajectory) => {
      clearAllTimeouts();
  
      state.currentTrajectory = trajectory;
      state.isPlaying = true;
      setPlayingState(true);
      state.currentIndex = 0;
      state.startTime = Date.now();
      state.pauseTime = null;
      state.elapsedTime = 0;
  
      scheduleFrames(trajectory.data, 0);
    };
  
    const pauseTrajectory = () => {
      if (!state.isPlaying) return;
  
      state.isPlaying = false;
      setPlayingState(false);
      state.pauseTime = Date.now();
      state.elapsedTime += state.pauseTime - state.startTime;
      clearAllTimeouts();
  
      console.log("Paused at index:", state.currentIndex);
    };
  
    const resumeTrajectory = () => {
      if (!state.currentTrajectory) {
        console.log("No trajectory to resume");
        return;
      }
  
      if (state.currentIndex >= state.currentTrajectory.data.length - 1) {
        console.log("Trajectory already completed");
        return;
      }
  
      state.isPlaying = true;
      setPlayingState(true);
  
      const remainingFrames = state.currentTrajectory.data.slice(
        state.currentIndex + 1
      );
      const elapsedTime = Date.now() - state.pauseTime; // Calculate delay since pause
      state.startTime = Date.now() - state.elapsedTime;
  
      scheduleFrames(remainingFrames, state.currentIndex + 1, elapsedTime);
    };
  
    const cancelTrajectory = () => {
      clearAllTimeouts();
      state.isPlaying = false;
      setPlayingState(false);
      state.currentIndex = 0;
      state.currentTrajectory = null;
      state.startTime = null;
      state.pauseTime = null;
      state.elapsedTime = 0;
    };
  
    const getStatus = (trajectory) => ({
      isPlaying: state.isPlaying,
      currentIndex: state.currentIndex,
      totalFrames: trajectory?.data.length || 0,
      progress: trajectory?.data.length
        ? (state.currentIndex / (trajectory.data.length - 1)) * 100
        : 0,
    });
  
    return {
      sendTrajectory,
      pauseTrajectory,
      resumeTrajectory,
      cancelTrajectory,
      getStatus,
    };
  };
  