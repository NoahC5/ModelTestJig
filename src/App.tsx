import React, { useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import "./App.css";
import _Minibot from "./Components/Robot/Minibot";
import { useGamepads } from "react-gamepads";
import { Box, Typography } from "@mui/material";
import Dropzone from "react-dropzone";
import Papa from "papaparse";
import useWebSocket from "react-use-websocket";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ButtonBase from "@mui/material/ButtonBase";
import {
  SportsEsports,
} from "@mui/icons-material";
import { TrajectoryController } from "./Util/TrajectoryController";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const Minibot = _Minibot as unknown as React.JSXElementConstructor<{
  fbxUrl: string;
  jointPos: number[][];
  trajectory?: Object;
}>;

const ButtonStyle = {
  opacity: 0.7,
  position: "absolute",
  width: "125px",
  height: "125px",
  borderRadius: "48%",
  fontSize: 24,
};

function App() {
  const [trajectory, setTrajectory] = useState({ data: [] });
  const [jointPos, setJointPos] = useState<number[][]>([[], [], []]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gamepads, setGamepads] = useState({});
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [fbxUrl, setFbxUrl] = useState("robot.fbx");
  const [sweepTrajectory, setSweepTrajectory] = useState({ data: [] })
  const [reachTrajectory, setReachTrajectory] = useState({ data: [] })
  const [cameraTrajectory, setCameraTrajectory] = useState({ data: [] })

  useGamepads((gamepads) => setGamepads(gamepads));

  useEffect(() => {
    window.addEventListener("gamepadconnected", () => {
      console.log("this is happening!");
      setGamepadConnected(true);
    });
    window.addEventListener("gamepaddisconnected", () => {
      console.log("now this");
      setGamepadConnected(false);
    });
    
    fetch('trajectories/camera.txt').then((res) => {
      if(!res.ok) {
        console.error("error loading camera trajectory")
      } else {
        return res.text()
      }
    }).then((text) => {
      const parsedData = Papa.parse(text)
      setCameraTrajectory({data: parsedData.data})
    })

    fetch('trajectories/bothArms_Reach_V6.txt').then((res) => {
      if(!res.ok) {
        console.error("error loading camera trajectory")
      } else {
        return res.text()
      }
    }).then((text) => {
      const parsedData = Papa.parse(text)
      setReachTrajectory({data: parsedData.data})
    })

    fetch('trajectories/bothArms_Sweep_V5.txt').then((res) => {
      if(!res.ok) {
        console.error("error loading camera trajectory")
      } else {
        return res.text()
      }
    }).then((text) => {
      const parsedData = Papa.parse(text)
      setSweepTrajectory({data: parsedData.data})
    })

  }, []);

  useEffect(() => {
    console.log(gamepadConnected);
  }, [gamepadConnected]);

  const onDrop = useCallback((acceptedFiles: any) => {
    setIsDragging(false);
    const file = acceptedFiles[0];
    const reader = new FileReader();

    console.log(acceptedFiles);
    if (file.type === "text/plain") {
      console.log("File is a text file");
    } else if (file.name.toLowerCase().endsWith(".fbx")) {
      console.log("File is an FBX file");
    } else {
      console.log("Unsupported file type");
    }

    reader.onload = () => {
      const parsedData = Papa.parse(reader.result as string);
      setTrajectory({ data: parsedData.data });
    };
    reader.readAsText(file);
  }, []);

  const { sendJsonMessage } = useWebSocket("ws://127.0.0.1:8081", {
    share: true,
    shouldReconnect: () => true,
    reconnectInterval: 1000,
    reconnectAttempts: 999999,
    retryOnError: true,
    filter: () => false,
    onOpen: () => {
      setIsConnected(true);
      sendJsonMessage({
        method: "set_lightring",
        params: {
          red: 0,
          green: 0,
          blue: 255,
          effect: "Breathe",
          effect_param: 0.5,
        },
        jsonrpc: "2.0",
      });
    },
    onError: (e) => console.log("Drawer ws error:", e),
    onClose: () => setIsConnected(false),
  });

  const controller = TrajectoryController(sendJsonMessage, setIsPlaying);

  useEffect(() => {
    if (trajectory.data.length > 0) {
      let currentFrame = 0;
      animationTimer.current = setInterval(() => {
        if (currentFrame < trajectory.data.length) {
          const frame = trajectory.data[currentFrame];
          const jointPos = [
            frame.slice(0, 6).map(Number),
            frame.slice(6, 12).map(Number),
            frame.slice(12, 14).map(Number),
          ];
          setJointPos(jointPos);
          currentFrame += 2;
        } else {
          currentFrame = 0;
        }
      }, 20);

      return () => {
        if (animationTimer.current) {
          clearInterval(animationTimer.current);
        }
      };
    }
  }, [trajectory]);

  if (controller.getStatus(trajectory).isPlaying) {
    console.log("playing");
  }

  // const sendTrajectory = () => {
  //   console.log("sending", trajectory.data);
  //   trajectory.data.forEach((frame, index) => {
  //     setTimeout(() => {
  //       sendJsonMessage({
  //         method: "set_mira_pose",
  //         params: {
  //           left: frame.slice(0, 6).map(Number),
  //           right: frame.slice(6, 12).map(Number),
  //         },
  //         jsonrpc: "2.0",
  //       });
  //       sendJsonMessage({
  //         method: "set_camera_pose",
  //         params: {
  //           north: Number(frame[13]),
  //           east: Number(frame[12]),
  //         },
  //         jsonrpc: "2.0",
  //       });
  //     }, index * 10);
  //   });
  // };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        id="center"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          position: "relative",
          backgroundColor: "#191e24",
          overflow: "hidden",
        }}
      >
        <Canvas
          className={isConnected ? "canvas" : "blinking"}
          style={{ border: "0px solid red", height: "500px", width: "100%" }}
        >
          <Minibot
            fbxUrl={fbxUrl}
            jointPos={jointPos}
            trajectory={trajectory}
          />
        </Canvas>
        <Dropzone
          onDrop={onDrop}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          {({ getRootProps, getInputProps }) => (
            <Box
              {...getRootProps()}
              sx={{
                position: "absolute",
                border: isDragging
                  ? "3px solid transparent"
                  : "3px dashed gray",

                backgroundColor: isDragging
                  ? "rgba(169, 169, 169, 0.3)"
                  : "transparent",
                width: "650px",
                height: "650px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border 0.3s ease, background-color 0.3s ease",
                animation: "spin 2s linear infinite",
              }}
            >
              <input {...getInputProps()} />
            </Box>
          )}
        </Dropzone>
        {/* <Button onClick={() => sendTrajectory()}>test</Button> */}
      </Box>

      {!isConnected && (
        <Box
          sx={{
            position: "absolute",
            border: "0px solid blue",
            top: 30,
            left: 30,
            display: "flex",
            color: "white",
            alignItems: "center",
          }}
        >
          <Typography fontFamily={"Poppins"} fontSize={36} color={"white"}>
            Connecting to API
          </Typography>
        </Box>
      )}
      {/* 
      <Grow
        in={trajectory.data.length > 0}
        timeout={1000}
        mountOnEnter
        unmountOnExit
      >
        {isPlaying ? (
          <ButtonBase
            sx={{
              ...ButtonStyle,
              backgroundColor: "#66a84c",
              bottom: 100,
              right: 150,
            }}
            onClick={() => controller.pauseTrajectory()}
          >
            <Box>
              <PauseRounded sx={{ fontSize: "100px", color: "#d1ffbf" }} />
            </Box>
          </ButtonBase>
        ) : (
          <ButtonBase
            sx={{
              ...ButtonStyle,
              backgroundColor: "#66a84c",
              bottom: 100,
              right: 150,
            }}
            onClick={() => controller.sendTrajectory(trajectory)}
          >
            <Box>
              <PlayArrowRounded sx={{ fontSize: "100px", color: "#d1ffbf" }} />
            </Box>
          </ButtonBase>
        )}
      </Grow>
      <Grow
        in={trajectory.data.length > 0}
        timeout={1000}
        mountOnEnter
        unmountOnExit
      >
        <ButtonBase
          sx={{
            ...ButtonStyle,
            backgroundColor: "#a84c4c",
            bottom: 100,
            left: 150,
          }}
          onClick={() => setTrajectory({ data: [] })}
        >
          <Box>
            <CloseRounded sx={{ fontSize: "100px", color: "#ffbfbf" }} />
          </Box>
        </ButtonBase>
      </Grow> */}

      {/* <Grow
        in={gamepadConnected}
        timeout={1000}
        mountOnEnter
        unmountOnExit
      >
        <ButtonBase
          sx={{
            ...ButtonStyle,
            backgroundColor: "#3864ab",
            top: 100,
            right: 150,
          }}
          onClick={() => setTrajectory({ data: [] })}
        >
          <Box>
            <SportsEsports sx={{ fontSize: "100px", color: "white" }} />
          </Box>
        </ButtonBase>
      </Grow> */}

      <ButtonBase
        sx={{
          ...ButtonStyle,
          backgroundColor: "#3864ab",
          top: 200,
          left: 80,
        }}
        onClick={() => setTrajectory(reachTrajectory)}
      >
        <Box>
          <SportsEsports sx={{ fontSize: "100px", color: "white" }} />
        </Box>
      </ButtonBase>

      <ButtonBase
        sx={{
          ...ButtonStyle,
          backgroundColor: "#3864ab",
          top: 400,
          left: 80,
        }}
        onClick={() => setTrajectory(sweepTrajectory)}
      >
        <Box>
          <SportsEsports sx={{ fontSize: "100px", color: "white" }} />
        </Box>
      </ButtonBase>

      <ButtonBase
        sx={{
          ...ButtonStyle,
          backgroundColor: "#3864ab",
          top: 600,
          left: 80,
        }}
        onClick={() => setTrajectory(cameraTrajectory)}
      >
        <Box>
          <SportsEsports sx={{ fontSize: "100px", color: "white" }} />
        </Box>
      </ButtonBase>
    </ThemeProvider>
  );
}

export default App;
