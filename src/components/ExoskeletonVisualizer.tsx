import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { useAnalysisStore } from '../store';

export const ExoskeletonVisualizer = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  
  const { updateMetrics, isRecording } = useAnalysisStore();

  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationFrameId: number;

    const initDetector = async () => {
      try {
        // Set up TensorFlow.js WebGL backend
        await import('@tensorflow/tfjs-backend-webgl');
        const tf = await import('@tensorflow/tfjs');
        await tf.setBackend('webgl');
        await tf.ready();

        // Create BlazePose detector with lite model for mobile/Raspberry Pi optimization
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose,
          { runtime: 'tfjs', modelType: 'lite' }
        );

        setIsModelLoading(false);

        const detectPose = async () => {
          if (
            webcamRef.current?.video && 
            webcamRef.current.video.readyState === 4 && 
            canvasRef.current &&
            detector
          ) {
            const video = webcamRef.current.video;
            const poses = await detector.estimatePoses(video);
            
            if (poses[0]) {
              drawExoskeleton(poses[0], canvasRef.current, video);
              updateJointAngles(poses[0]);
            }
          }
          animationFrameId = requestAnimationFrame(detectPose);
        };

        detectPose();
      } catch (error) {
        console.error('Error initializing pose detector:', error);
        setModelError('Failed to load pose detection model');
        setIsModelLoading(false);
      }
    };

    if (isRecording) {
      initDetector();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (detector) {
        detector.dispose();
      }
    };
  }, [isRecording, updateMetrics]);

  const updateJointAngles = (pose: poseDetection.Pose) => {
    // Extract keypoints for angle calculation
    const keypoints = pose.keypoints;
    
    // Get relevant keypoints (using BlazePose landmark indices)
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    const leftElbow = keypoints.find(k => k.name === 'left_elbow');
    const rightElbow = keypoints.find(k => k.name === 'right_elbow');
    const leftWrist = keypoints.find(k => k.name === 'left_wrist');
    const rightWrist = keypoints.find(k => k.name === 'right_wrist');
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const rightKnee = keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

    // Calculate angles
    const calculateAngle = (p1: any, p2: any, p3: any) => {
      if (!p1 || !p2 || !p3) return 180;
      const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
      let angle = Math.abs((radians * 180) / Math.PI);
      if (angle > 180) angle = 360 - angle;
      return Math.round(angle);
    };

    // Update joint angles in store
    const angles: Record<string, number> = {};
    
    if (leftElbow && leftShoulder && leftWrist) {
      angles.leftElbow = calculateAngle(leftShoulder, leftElbow, leftWrist);
    }
    if (rightElbow && rightShoulder && rightWrist) {
      angles.rightElbow = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }
    if (leftKnee && leftHip && leftAnkle) {
      angles.leftKnee = calculateAngle(leftHip, leftKnee, leftAnkle);
    }
    if (rightKnee && rightHip && rightAnkle) {
      angles.rightKnee = calculateAngle(rightHip, rightKnee, rightAnkle);
    }
    if (leftHip && leftShoulder && leftKnee) {
      angles.leftHip = calculateAngle(leftShoulder, leftHip, leftKnee);
    }
    if (rightHip && rightShoulder && rightKnee) {
      angles.rightHip = calculateAngle(rightShoulder, rightHip, rightKnee);
    }

    updateMetrics({ jointAngles: angles });
  };

  const drawExoskeleton = (
    pose: poseDetection.Pose, 
    canvas: HTMLCanvasElement, 
    video: HTMLVideoElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !pose) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Ideal Form Overlay (Semi-transparent)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;

    // Get keypoints array
    const keypoints = pose.keypoints;

    // Draw keypoints with confidence > 0.5
    keypoints.forEach((keypoint) => {
      if ((keypoint.score || 0) > 0.5) {
        const x = canvas.width - keypoint.x; // Mirror x coordinate
        const y = keypoint.y;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ffcc'; // Neon cyan
        ctx.fill();
        
        // Draw confidence score
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${(keypoint.score! * 100).toFixed(0)}%`, x + 10, y);
      }
    });

    // Define skeleton connections manually for BlazePose
    const connections = [
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7], // Face outline
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10], // Eyes
      // Upper body
      [11, 12], // Shoulders
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      // Lower body
      [11, 23], [12, 24], // Torso
      [23, 24], // Hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
    ];

    // Draw connections
    connections.forEach(([startIdx, endIdx]) => {
      const startKeypoint = keypoints[startIdx];
      const endKeypoint = keypoints[endIdx];
      
      if ((startKeypoint?.score || 0) > 0.5 && (endKeypoint?.score || 0) > 0.5) {
        const x1 = canvas.width - startKeypoint.x;
        const y1 = startKeypoint.y;
        const x2 = canvas.width - endKeypoint.x;
        const y2 = endKeypoint.y;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  if (!isRecording) {
    return (
      <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🎥</div>
          <p className="text-lg">Start a session to begin pose detection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-lg">
      {isModelLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ffcc] mx-auto mb-4"></div>
            <p className="text-[#00ffcc]">Loading AI Model...</p>
          </div>
        </div>
      )}
      
      {modelError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center text-red-400">
            <p>{modelError}</p>
          </div>
        </div>
      )}
      
      <Webcam
        ref={webcamRef}
        className="absolute w-full h-full object-cover"
        videoConstraints={{ 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }}
        mirrored={true}
      />
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full object-cover z-10"
      />
    </div>
  );
};
