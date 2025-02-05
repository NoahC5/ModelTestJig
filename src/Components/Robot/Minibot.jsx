import React, { useRef, useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useProgress } from "@react-three/drei";

// Constants
const JOINTS = {
  LEFT:  ["ASM_L654321", "ASM_L65432", "ASM_L6543", "ASM_L654", "ASM_L65", "ASM_L61", "ASM_L62"],
  RIGHT: ["ASM_R654321", "ASM_R65432", "ASM_R6543", "ASM_R654", "ASM_R65", "RJ61", "RJ62"],
  CAMERA: "Camera_Tip",
};

const JOINT_OFFSETS = {
  LEFT: [-90, 0, -90, 90, 0],
  RIGHT: [-90, 0, 90, -90, 0],
};

const DEFAULT_POSE = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0],
];

// Helper functions
const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;



const Lighting = () => (
  <>
    <ambientLight intensity={3} />
    <directionalLight
      position={[5, 10, 5]}
      castShadow={true}
      intensity={2}
    />
  </>
);

const Minibot = React.memo(({ fbxFile, jointPos, setMessage }) => {
  const fbxRef = useRef();
  const { progress } = useProgress();
  
  // Load and parse FBX
  const fbx = useMemo(() => {
    if (!fbxFile) return null;
    const loader = new FBXLoader();
    return loader.parse(fbxFile);
  }, [fbxFile]);

  // Log loading progress
  useEffect(() => {
    console.log(`Loading FBX model: ${Math.round(progress)}%`);
  }, [progress]);

  const validateJoints = (fbx, joints) => {
    console.log(fbx)
    const missingJoints = joints.filter(joint => !fbx.getObjectByName(joint));
    if (missingJoints.length > 0) {
      console.error(`Missing joints: ${missingJoints.join(', ')}`);
      setMessage(`Missing joints: ${missingJoints.join(', ')}`)
      return false;
    }
    return true;
  };

  // Joint management
  const getJointNodes = (fbx) => {
    const allJoints = [...JOINTS.LEFT, ...JOINTS.RIGHT, JOINTS.CAMERA];
    if (!validateJoints(fbx, allJoints)) return null;
    
    return allJoints.reduce((acc, joint) => {
      acc[joint] = fbx.getObjectByName(joint);
      return acc;
    }, {});
  };

  const setPose = (jointNodes, pose) => {
    if (!jointNodes || pose.length !== 3) {
      console.error("Invalid pose or joint nodes");
      return;
    }

    // Set left joint rotations
    JOINTS.LEFT.forEach((joint, index) => {
      if (index < 5) {
        jointNodes[joint].rotation.z = degreesToRadians(JOINT_OFFSETS.LEFT[index] + pose[0][index]);
      } else if (index === 5 || index === 6) {
        jointNodes[joint].rotation.z = degreesToRadians(pose[0][5]) / 100;
      }
    });

    // Set right joint rotations
    JOINTS.RIGHT.forEach((joint, index) => {
      if (index < 5) {
        jointNodes[joint].rotation.z = degreesToRadians(JOINT_OFFSETS.RIGHT[index] + pose[1][index]);
      } else if (index === 5 || index === 6) {
        jointNodes[joint].rotation.z = degreesToRadians(pose[1][5]) / 100;
      }
    });

    // Set camera rotations
    const camera = jointNodes["Camera_Tip"];
    console.log(camera)
    if (camera) {
      camera.rotation.z = degreesToRadians(pose[2][0]);
      camera.rotation.x = degreesToRadians(-pose[2][1]);
    }
  };

  // Update pose when fbx or jointPos changes
  useEffect(() => {
    if (!fbx) return;
    
    const jointNodes = getJointNodes(fbx);
    if (!jointNodes) return;
    
    const poseToApply = jointPos[0].length === 0 ? DEFAULT_POSE : jointPos;
    setPose(jointNodes, poseToApply);
  }, [fbx, jointPos]);

  if (!fbx) return null;

  return (
    <group>
      <Lighting />
      <OrbitControls />
      <group
        ref={fbxRef}
        rotation={[0, -2, 0]}
        position={[-3, -5, -15]}
        scale={[1, 1, 1]}
      >
        <primitive object={fbx} position={[0, 0, -3]} />
      </group>
    </group>
  );
});

export default Minibot;