import { CircularProgress } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three'; // Import the Three.js library
import { Html } from '@react-three/drei';
import { log } from '@/logger/logger.ts';

const logger = log.getLogger('ThreeDeeUtils');

// let mainModel;

export function normalizeModel(model, scaleFactor) {
  // Calculate the size of the model

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z);

  // Scale the model to fit within the desired scale factor
  const scale = scaleFactor / maxDimension;
  model.scale.set(scale, scale, scale);

  // Calculate the center of the bounding box
  const box2 = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const size2 = new THREE.Vector3();
  box2.getSize(size2);

  box2.getCenter(center);

  // Translate the model to center it at the origin (0,0,0)
  model.position.sub(center);
  // Adjust the model position so its bottom aligns with y=0
  const height = size2.y;

  // Adjust the position to align the bottom of the model with y = 0
  model.position.y += height / 2;

  return model;
}

export function ModelLoader() {
  return (
    <Html
      center
      sprite
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <CircularProgress />
    </Html>
  );
}

export const Model = ({ objUrl, type, setFinishedLoading }) => {
  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (objUrl) {
      setLoading(true);
      let loader = null;
      if (type === 2) {
        loader = new OBJLoader();
      } else if (type === 3) {
        loader = new FBXLoader();
      } else if (type === 4) {
        loader = new GLTFLoader();
      }
      loader.load(
        objUrl,
        (loadedObj) => {
          if (type === 4) {
            setObj(loadedObj.scene);
            setFinishedLoading(true);
          } else setObj(loadedObj);
          setLoading(false);
        },
        undefined,
        (error) => {
          logger.error('Error loading OBJ file:', error);
        },
      );
    }
  }, [objUrl]);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.5, 0.5, 0.5),
    // roughness: 0.2,
    // metalness: 0.8,
  });

  // Apply the material to each mesh in the object's children
  useEffect(() => {
    if (obj) {
      if (type != 4) {
        obj.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }

      normalizeModel(obj, 4.5);
    }
  }, [obj]);

  useEffect(() => {
    if (obj) {
      if (type === 4) {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (!child.material) child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }
    }
  }, [obj]);

  // useEffect(() => {
  //   if (obj) {
  //     mainModel = obj;
  //   }
  // }, [obj]);

  if (loading) {
    return <ModelLoader />; // Show loader when the object is loading
  }
  if (obj) {
    // eslint-disable-next-line react/no-unknown-property -- Three.js properties
    return <primitive receiveShadow castShadow object={obj} />;
  } else return null;
};
