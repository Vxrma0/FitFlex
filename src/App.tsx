import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, Download, Settings } from 'lucide-react';

const AIExercisePoseAnalyzer = () => {
  // ==================== STATE VARIABLES ====================
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState('Detecting...');
  const [reps, setReps] = useState(0);
  const [formQuality, setFormQuality] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in frame');
  const [sessionTimer, setSessionTimer] = useState(0);

  // ==================== REFERENCES (for hardware access) ====================
  const videoRef = useRef<HTMLVideoElement>(null);           // Hidden video from webcam
  const canvasRef = useRef<HTMLCanvasElement>(null);          // Where we draw the skeleton
  const poseRef = useRef<any>(null);            // MediaPipe pose detector
  const cameraRef = useRef<any>(null);          // Webcam stream

  // Track rep counting
  const repCountRef = useRef({
    bicepCurls: 0,
    pushups: 0,
    squats: 0,
    latPulldowns: 0
  });

  const exerciseStateRef = useRef({
    bicepCurls: { 
      phase: 'ready',      // what stage of the movement we're in
      angles: [],          // store all angles during the rep
      startTime: null      // when did this rep start?
    }
  });

  // ==================== UTILITY FUNCTIONS ====================
  
  // Calculate angle between three points (shoulder-elbow-wrist)
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // Calculate distance between two points
  const calculateDistance = (a: any, b: any) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };

  // ==================== EXERCISE DETECTION ====================
  // This figure out WHAT exercise you're doing by looking at your arm angles
  const detectExercise = (landmarks: any) => {
    if (!landmarks || landmarks.length < 33) return 'Detecting...';

    const shoulder = landmarks[11];  // Left shoulder
    const elbow = landmarks[13];     // Left elbow
    const wrist = landmarks[15];     // Left wrist
    const hip = landmarks[23];       // Left hip
    const knee = landmarks[25];      // Left knee
    const ankle = landmarks[27];     // Left ankle

    // If we can't see your joints clearly, keep detecting
    if (shoulder.visibility < 0.5 || elbow.visibility < 0.5) return 'Detecting...';

    // Calculate arm angle (fully extended = 180°, fully bent = 30°)
    const armAngle = calculateAngle(shoulder, elbow, wrist);
    const elbowShoulderDistance = calculateDistance(elbow, shoulder);

    // If arm is bent and elbow is close to shoulder = bicep curl
    if (armAngle < 90 && elbowShoulderDistance > 20) return 'Bicep Curls';
    
    return 'Bicep Curls'; // Default for now
  };

  // ==================== BICEP CURL FAULT DETECTION ====================
  // This is the MAGIC - detects if your form is good or bad
  const analyzeBicepCurls = (landmarks: any) => {
    const shoulder = landmarks[11];
    const elbow = landmarks[13];
    const wrist = landmarks[15];
    
    // Calculate the angle at the elbow
    const armAngle = calculateAngle(shoulder, elbow, wrist);
    const state = exerciseStateRef.current.bicepCurls;

    // Store angles during movement
    if (!state.angles) state.angles = [];
    if (!state.startTime) state.startTime = Date.now();

    state.angles.push(armAngle);
    if (state.angles.length > 30) state.angles.shift(); // Only keep last 30 frames

    // Calculate Range of Motion (ROM)
    const minAngle = Math.min(...state.angles);
    const maxAngle = Math.max(...state.angles);
    const romValue = maxAngle - minAngle;

    // ============ STATE MACHINE ============
    // Track the movement phases: ready → descending → bottom → ascending → ready
    
    if (state.phase === 'ready' && armAngle < 100) {
      // Started lowering the weight
      state.phase = 'descending';
      state.startTime = Date.now();
      state.angles = [armAngle];
    } 
    else if (state.phase === 'descending' && armAngle > 140) {
      // Reached bottom of curl
      state.phase = 'bottom';
    } 
    else if (state.phase === 'bottom' && armAngle < 120) {
      // Started raising the weight
      state.phase = 'ascending';
    } 
    else if (state.phase === 'ascending' && armAngle > 100) {
      // Completed the rep! Now check for faults
      state.phase = 'ready';

      const repDuration = (Date.now() - state.startTime) / 1000; // seconds

      // ========== FAULT DETECTION ==========
      let faultMessage = '';
      let isGood = true;

      // FAULT 1: Too Fast (less than 1 second)
      if (repDuration < 1.0) {
        faultMessage = '⚠️ Too Fast - Control the weight (2+ sec per rep)';
        isGood = false;
      } 
      // FAULT 2: Incomplete ROM (less than 70 degrees)
      else if (romValue < 70) {
        faultMessage = '⚠️ Incomplete ROM - Go all the way down (70°+ required)';
        isGood = false;
      } 
      // GOOD REP!
      else {
        faultMessage = '✅ Perfect Rep! Great form!';
        repCountRef.current.bicepCurls += 1; // Count the rep
        isGood = true;
      }

      setFeedback(faultMessage);
      setReps(repCountRef.current.bicepCurls);

      // Reset for next rep
      state.angles = [];
      state.startTime = null;
    }

    // Calculate form quality score (0-100)
    const romScore = romValue > 90 ? 100 : (romValue / 90) * 100;
    // Default speed score if rep not completed yet
    let speedScore = 50;
    
    // Use the stored startTime to calculate duration (only if we're in the middle of a rep)
    if (state.startTime) {
      const currentRepDuration = (Date.now() - state.startTime) / 1000;
      speedScore = currentRepDuration > 2.0 ? 100 : (currentRepDuration / 2.0) * 100;
    }
    
    const quality = (romScore + speedScore) / 2;

    return { quality: Math.min(100, quality), angle: armAngle, rom: romValue };
  };

  // ==================== INITIALIZE WEBCAM & MEDIAPIPE ====================
  useEffect(() => {
    if (!isSessionActive) return; // Don't run if session isn't active

    const initPose = async () => {
      try {
        // Load MediaPipe from the internet (free service)
        const scriptPose = document.createElement('script');
        scriptPose.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1633989127/pose.min.js';
        scriptPose.async = true;

        const scriptCamera = document.createElement('script');
        scriptCamera.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.4.1633989127/camera_utils.js';
        scriptCamera.async = true;

        const scriptDrawing = document.createElement('script');
        scriptDrawing.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.4.1633989127/drawing_utils.js';
        scriptDrawing.async = true;

        let scriptsLoaded = 0;
        const checkAllLoaded = () => {
          scriptsLoaded++;
          if (scriptsLoaded === 3) startMediaPipe();
        };

        scriptPose.onload = checkAllLoaded;
        scriptCamera.onload = checkAllLoaded;
        scriptDrawing.onload = checkAllLoaded;

        document.body.appendChild(scriptPose);
        document.body.appendChild(scriptCamera);
        document.body.appendChild(scriptDrawing);
      } catch (error) {
        console.error('Error loading MediaPipe:', error);
        setFeedback('Error loading pose detection. Check console.');
      }
    };

    const startMediaPipe = () => {
      const Pose = (window as any).Pose;
      const Camera = (window as any).Camera;
      
      // Create a new Pose detector
      poseRef.current = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1633989127/${file}`
      });

      // When MediaPipe detects a pose, this function runs
      poseRef.current.onResults(onPoseResults);
      
      // Start the webcam
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720
      });

      cameraRef.current.start();
    };

    initPose();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isSessionActive]);

  // ==================== WHEN POSE IS DETECTED ====================
  // This runs 30x per second with live pose data
  const onPoseResults = (results: any) => {
    if (!results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;

    // Figure out what exercise you're doing
    const exercise = detectExercise(landmarks);
    setCurrentExercise(exercise);

    // Calculate how confident we are about the pose
    const avgConfidence = landmarks.reduce((sum: any, lm: any) => sum + (lm.visibility || 0), 0) / landmarks.length;
    setConfidence(Math.round(avgConfidence * 100));

    // Analyze the movement based on exercise type
    let quality = 0;
    if (exercise === 'Bicep Curls') {
      const analysis = analyzeBicepCurls(landmarks);
      quality = analysis.quality;
    }

    setFormQuality(Math.round(quality));

    // Draw the live skeleton on the canvas
    drawSkeletonOverlay(results, quality);
  };

  // ==================== DRAW THE SKELETON ====================
  // This is what you SEE - the skeleton overlay on your video
  const drawSkeletonOverlay = (results: any, quality: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !results.image) return;

    const ctx = canvas.getContext('2d');

    // Draw the webcam video frame
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Choose color based on form quality
    const skeletonColor = quality > 75 ? '#00FFFF' : '#FF00FF'; // Cyan if good, Magenta if bad

    const landmarks = results.poseLandmarks;

    // Define which joints connect to which (the "bones")
    const connections = [
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 12],           // Shoulders
      [11, 23], [12, 24], // Shoulders to hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
      [23, 24]            // Hips
    ];

    // Draw the bones (lines between joints)
    ctx.strokeStyle = skeletonColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = skeletonColor;
    ctx.shadowBlur = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([start, end]: [number, number]) => {
      const startLm = landmarks[start];
      const endLm = landmarks[end];

      // Only draw if we can clearly see both joints
      if (startLm?.visibility > 0.5 && endLm?.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startLm.x * canvas.width, startLm.y * canvas.height);
        ctx.lineTo(endLm.x * canvas.width, endLm.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw the joints (circles at each body point)
    landmarks.forEach((landmark: any) => {
      if (landmark.visibility > 0.5) {
        ctx.fillStyle = skeletonColor;
        ctx.shadowColor = skeletonColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          6, // radius of circle
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });

    ctx.shadowColor = 'transparent';
  };

  // ==================== START/STOP SESSION ====================
  const startSession = () => {
    setIsSessionActive(true);
    setReps(0);
    setFeedback('Starting session! Do some bicep curls in front of the camera.');
    repCountRef.current = { bicepCurls: 0, pushups: 0, squats: 0, latPulldowns: 0 };
  };

  const endSession = () => {
    setIsSessionActive(false);
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    setFeedback('Session ended! Great workout!');
  };

  // ==================== TIMER ====================
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFormStatus = () => {
    if (formQuality >= 85) return { text: 'Excellent', color: '#00FFFF' };
    if (formQuality >= 70) return { text: 'Good', color: '#33FFD6' };
    if (formQuality >= 55) return { text: 'Fair', color: '#FFB800' };
    return { text: 'Needs Work', color: '#FF00FF' };
  };

  const formStatus = getFormStatus();

  // ==================== UI RENDERING ====================
  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#FFFFFF', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px', borderBottom: '2px solid #FF00FF', paddingBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 0 20px #00FFFF' }}>
            ⚡ FitFlex Ultra - AI Exercise Analyzer
          </h1>
          <p style={{ color: '#999', fontSize: '14px' }}>Real-time pose detection with live feedback</p>
        </div>

        {/* MAIN CONTENT - TWO COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          {/* LEFT: VIDEO FEED AND SKELETON */}
          <div>
            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '2px solid #FF00FF',
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9'
            }}>
              {/* Hidden video element (we don't see this, it's just for capture) */}
              <video
                ref={videoRef}
                style={{ display: 'none' }}
              />

              {/* Canvas - this is what you SEE (video + skeleton overlay) */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: 'scaleX(-1)', // Mirror horizontally (like a mirror)
                  display: 'block'
                }}
              />

              {/* Status overlay on top of video */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #00FFFF'
              }}>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
                  Exercise: <span style={{ color: '#00FFFF', fontWeight: 'bold' }}>{currentExercise}</span>
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
                  Confidence: <span style={{ color: '#00FFFF', fontWeight: 'bold' }}>{confidence}%</span>
                </p>
              </div>
            </div>

            {/* CONTROL BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={startSession}
                disabled={isSessionActive}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: isSessionActive ? '#555' : '#00FFFF',
                  color: isSessionActive ? '#999' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isSessionActive ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play size={18} /> Start Session
              </button>

              <button
                onClick={endSession}
                disabled={!isSessionActive}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: !isSessionActive ? '#555' : '#FF00FF',
                  color: !isSessionActive ? '#999' : '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: !isSessionActive ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Square size={18} /> End Session
              </button>
            </div>
          </div>

          {/* RIGHT: STATS PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* REP COUNTER */}
            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '2px solid #FF00FF',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                Reps
              </h2>
              <p style={{ fontSize: '56px', fontWeight: 'bold', color: '#00FFFF', margin: '0' }}>
                {reps}
              </p>
            </div>

            {/* TIMER */}
            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '2px solid #00FFFF',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                Time
              </h2>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#00FFFF', margin: '0', fontFamily: 'monospace' }}>
                {formatTime(sessionTimer)}
              </p>
            </div>

            {/* FORM QUALITY */}
            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '2px solid ' + formStatus.color,
              padding: '24px',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                Form Quality
              </h2>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: formStatus.color, margin: '0' }}>
                {formQuality}%
              </p>
              <p style={{ fontSize: '12px', color: formStatus.color, marginTop: '8px' }}>
                {formStatus.text}
              </p>
            </div>

            {/* FEEDBACK MESSAGE */}
            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              border: '2px solid #FF00FF',
              padding: '16px',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: feedback.includes('⚠️') ? '#FF6B6B' : '#00FFFF', margin: '0' }}>
                {feedback}
              </p>
            </div>
          </div>
        </div>

        {/* SESSION STATUS */}
        <div style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '12px',
          border: '2px solid ' + (isSessionActive ? '#00FFFF' : '#666'),
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#999', margin: '0' }}>
            Session Status: <span style={{
              color: isSessionActive ? '#00FFFF' : '#FF00FF',
              fontWeight: 'bold'
            }}>
              {isSessionActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIExercisePoseAnalyzer;
