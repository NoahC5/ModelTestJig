import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { useProgress } from '@react-three/drei';

const Minibot = React.memo(({ fbxUrl, jointPos }) => {
  const fbxRef = useRef();
  const fbx = useLoader(FBXLoader, fbxUrl);
  const { progress } = useProgress()
  useEffect(() => {
    console.log(`Loading FBX model: ${Math.round(progress)}%`);
  }, [progress]);

  // let jointNodes = {
  //   "Lj1": fbx.getObjectByName("ASM_L654321"),
  //   "Lj2": fbx.getObjectByName("ASM_L65432"),
  //   "Lj3": fbx.getObjectByName("ASM_L6543"),
  //   "Lj4": fbx.getObjectByName("ASM_L654"),
  //   "Lj5": fbx.getObjectByName("ASM_L65"),
  //   "Lj61": fbx.getObjectByName("ASM_L61"),
  //   "Lj62": fbx.getObjectByName("ASM_L62"),
  //   "Rj1": fbx.getObjectByName("ASM_R654321"),
  //   "Rj2": fbx.getObjectByName("ASM_R65432"),
  //   "Rj3": fbx.getObjectByName("ASM_R6543"),
  //   "Rj4": fbx.getObjectByName("ASM_R654"),
  //   "Rj5": fbx.getObjectByName("ASM_R65"),
  //   "Rj61": fbx.getObjectByName("RJ61"),
  //   "Rj62": fbx.getObjectByName("RJ62"),
  //   "CAMERA": fbx.getObjectByName("Camera_Tip"),
  // }

  let jointNodes = {
    "Lj1": fbx.getObjectByName("Lj1"),
    "Lj2": fbx.getObjectByName("Lj2"),
    "Lj3": fbx.getObjectByName("Lj3"),
    "Lj4": fbx.getObjectByName("Lj4"),
    "Lj5": fbx.getObjectByName("Lj5"),
    "Lj61": fbx.getObjectByName("Lj6_a"),
    "Lj62": fbx.getObjectByName("Lj6_b"),
    "Rj1": fbx.getObjectByName("Rj1"),
    "Rj2": fbx.getObjectByName("Rj2"),
    "Rj3": fbx.getObjectByName("Rj3"),
    "Rj4": fbx.getObjectByName("Rj4"),
    "Rj5": fbx.getObjectByName("Rj5"),
    "Rj61": fbx.getObjectByName("Rj6_a"),
    "Rj62": fbx.getObjectByName("Rj6_b"),
    "CAMERA": fbx.getObjectByName("Camera_Tip"),
  }

  let left_joint_offsets = [-90, 0, -90, 90, 0];
  let right_joint_offsets = [-90, 0, 90, -90, 0];

  const setPose = (pose) => {
    if (pose.length === 3) {
      jointNodes["Lj1"].rotation.z = (left_joint_offsets[0] + pose[0][0]) * Math.PI / 180;
      jointNodes["Lj2"].rotation.z = (left_joint_offsets[1] + pose[0][1]) * Math.PI / 180;
      jointNodes["Lj3"].rotation.z = (left_joint_offsets[2] + pose[0][2]) * Math.PI / 180;
      jointNodes["Lj4"].rotation.z = (left_joint_offsets[3] + pose[0][3]) * Math.PI / 180;
      jointNodes["Lj5"].rotation.z = (left_joint_offsets[4] + pose[0][4]) * Math.PI / 180;
      jointNodes["Lj61"].rotation.z = ((pose[0][5]) * Math.PI / 180) / 100;
      jointNodes["Lj62"].rotation.z = ((pose[0][5]) * Math.PI / 180) / 100;

      jointNodes["Rj1"].rotation.z = (right_joint_offsets[0] + pose[1][0]) * Math.PI / 180;
      jointNodes["Rj2"].rotation.z = (right_joint_offsets[1] + pose[1][1]) * Math.PI / 180;
      jointNodes["Rj3"].rotation.z = (right_joint_offsets[2] + pose[1][2]) * Math.PI / 180;
      jointNodes["Rj4"].rotation.z = (right_joint_offsets[3] + pose[1][3]) * Math.PI / 180;
      jointNodes["Rj5"].rotation.z = (right_joint_offsets[4] + pose[1][4]) * Math.PI / 180;
      jointNodes["Rj61"].rotation.z = ((pose[1][5]) * Math.PI / 180) / 100;
      jointNodes["Rj62"].rotation.z = ((pose[1][5]) * Math.PI / 180) / 100;

      jointNodes["CAMERA"].rotation.z = (pose[2][0]) * Math.PI / 180;
      jointNodes["CAMERA"].rotation.x = -(pose[2][1]) * Math.PI / 180;
    }
    else {
      console.log("Invalid pose");
    }
  };

  useEffect(() => {
    if (jointPos[0].length === 0) {
      // Set a default valid pose if jointPos is empty
      const defaultPose = [
        [0, 0, 0, 0, 0, 0], // Left joint values
        [0, 0, 0, 0, 0, 0], // Right joint values
        [0, 0] // Camera values
      ];
      setPose(defaultPose);
    } else {
      setPose(jointPos);
    }
  }, [jointPos]);

  if(fbx) {

      return (
        <group>
          <ambientLight intensity={3} />
          <directionalLight
            position={[5, 10, 5]} // Position the light to where it makes sense for your scene
            castShadow={true}
            intensity={2}
          />
          
          <group 
            ref={fbxRef} 
            rotation={[0, -2, 0]} 
            position={[-3, -18, -45]} 
            scale={[1, 1, 1]}>
    
            <primitive object={fbx} position={[0, 0, -3]} />
          
          </group>
        </group>
      );
  } else {
    return (
      <group>
        <ambientLight />
        <mesh>
          <boxGeometry args={[5,5,5]} />
          <meshBasicMaterial color={'red'} />
        </mesh>
      </group>
    )
  }

});

export default Minibot;