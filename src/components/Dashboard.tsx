/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Brain, 
  Battery, Cpu, Wifi, MapPin, Play, Square, AlertTriangle, 
  RefreshCw, Activity, ShieldAlert, HeartPulse, UserCheck, Flame
} from 'lucide-react';
import { RobotModel, DetectionModel, DetectionType, DETECTION_DISPLAY_NAMES } from '../types';

interface DashboardProps {
  robot: RobotModel;
  latestDetection: DetectionModel | null;
  onToggleCamera: (active: boolean) => void;
  onToggleMicrophone: (active: boolean) => void;
  onToggleSpeaker: (active: boolean) => void;
  onToggleAI: (active: boolean) => void;
  onToggleCharging: (charging: boolean) => void;
  onChangeRoom: (room: string) => void;
  onTriggerSimulatedDetection: (type: DetectionType) => void;
  onReconnect: () => void;
}

export default function Dashboard({
  robot,
  latestDetection,
  onToggleCamera,
  onToggleMicrophone,
  onToggleSpeaker,
  onToggleAI,
  onToggleCharging,
  onChangeRoom,
  onTriggerSimulatedDetection,
  onReconnect
}: DashboardProps) {
  const [streamActive, setStreamActive] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date());

  // Keep a running clock in the video feed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getWifiIcon = (strength: number) => {
    return <Wifi className={`h-5 w-5 ${strength > 80 ? 'text-cyan-400' : strength > 50 ? 'text-amber-400' : 'text-rose-400'}`} />;
  };

  const getBatteryIcon = (percentage: number, charging: boolean) => {
    let color = 'text-emerald-400';
    if (percentage < 25) color = 'text-rose-400 animate-pulse';
    else if (percentage < 60) color = 'text-amber-400';

    return (
      <div className="flex items-center gap-1.5 font-mono">
        <Battery className={`h-5 w-5 ${color} ${charging ? 'animate-bounce' : ''}`} />
        <span className="text-sm font-bold text-white">{percentage}%</span>
        {charging && <span className="text-xs text-amber-400 font-bold animate-pulse">⚡</span>}
      </div>
    );
  };

  // Check if current active detection belongs to the active room and is less than 12 seconds old
  const isDetectionHappening = latestDetection && 
    latestDetection.roomName === robot.currentRoom && 
    (Date.now() - new Date(latestDetection.timestamp).getTime() < 12000);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-container">
      {/* LEFT & MIDDLE: Camera Feed and Controls */}
      <div className="lg:col-span-2 space-y-6">
        {/* Live Feed Panel */}
        <div className="glass rounded-3xl overflow-hidden shadow-2xl relative group" id="camera-feed-panel">
          {/* Header Bar */}
          <div className="bg-white/3 px-5 py-4 border-b border-white/10 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {robot.isOnline && streamActive ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white/30"></span>
                )}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                {robot.isOnline ? `LIVE MONITOR FEED - ${robot.currentRoom.toUpperCase()}` : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 font-bold">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                {robot.currentRoom}
              </span>
              <span>{timestamp.toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
            </div>
          </div>

          {/* Video stream box */}
          <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
            {/* Scan lines / Camera grid effect */}
            <div className="absolute inset-0 pointer-events-none bg-camera-scanlines opacity-[0.06] z-10" />
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
              <div className="text-white text-sm font-bold bg-slate-950/80 px-2.5 py-1 rounded-xl backdrop-blur-md shadow border border-white/15 flex items-center gap-1.5 font-mono">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                REC
              </div>
            </div>

            {/* If robot offline */}
            {!robot.isOnline ? (
              <div className="text-center p-6 space-y-4 z-10">
                <div className="p-4 bg-white/5 rounded-full inline-block border border-white/15 animate-pulse">
                  <CameraOff className="h-10 w-10 text-white/50" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">GuardianBot Offline</h3>
                  <p className="text-white/60 text-sm max-w-sm mx-auto mt-1">
                    Check that the physical unit is plugged in, powered on, and connected to Wi-Fi.
                  </p>
                </div>
                <button 
                  onClick={onReconnect}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 mx-auto transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Attempt Connection
                </button>
              </div>
            ) : !robot.cameraActive || !streamActive ? (
              <div className="text-center p-6 space-y-4 z-10">
                <div className="p-4 bg-white/5 rounded-full inline-block border border-white/15">
                  <CameraOff className="h-10 w-10 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Camera Lens Shutter Closed</h3>
                  <p className="text-white/60 text-sm max-w-sm mx-auto mt-1">
                    Enable the robot camera to begin streaming the visual monitor feed.
                  </p>
                </div>
                <button 
                  onClick={() => { onToggleCamera(true); setStreamActive(true); }}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200"
                >
                  Open Camera Shutter
                </button>
              </div>
            ) : (
              /* ACTIVE STREAM SIMULATION */
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Beautiful CSS Dynamic Background mimicking a nursery/living room */}
                <div className="absolute inset-0 bg-slate-900 transition-colors duration-500 flex flex-col justify-between p-6">
                  {/* Backdrop room outline */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-slate-900/60 to-slate-950/90 pointer-events-none" />
                  
                  {/* Graphic representations depending on room */}
                  {robot.currentRoom === 'Nursery' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-80 h-80 rounded-full border border-dashed border-cyan-500/30 animate-spin-slow flex items-center justify-center">
                        <div className="w-60 h-60 rounded-full border border-dashed border-indigo-500/20" />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bounding Box Overlay for AI Detection */}
                  {isDetectionHappening && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className={`w-64 h-64 border-2 rounded-2xl flex flex-col justify-between p-3.5 animate-pulse ${
                        latestDetection!.severity === 'critical' ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 
                        latestDetection!.severity === 'warning' ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                      }`}>
                        {/* Bounding box corners */}
                        <div className="flex justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white ${
                            latestDetection!.severity === 'critical' ? 'bg-rose-600' : 
                            latestDetection!.severity === 'warning' ? 'bg-amber-600' : 'bg-cyan-600'
                          }`}>
                            {DETECTION_DISPLAY_NAMES[latestDetection!.type]} ({(latestDetection!.confidence * 100).toFixed(1)}%)
                          </span>
                          <span className="text-white text-[10px] font-bold bg-black/60 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                            TARGET CONFIRMED
                          </span>
                        </div>
                        
                        {/* Decorative scan overlay */}
                        <div className="text-center text-xs tracking-widest font-mono text-white font-bold py-1 uppercase opacity-90">
                          {latestDetection!.severity === 'critical' ? '⚠️ RISK DETECTED' : '🔍 ANALYZING'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cute Simulated Room Illustration Elements */}
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    {/* Room Art */}
                    <div className="text-center space-y-3 z-10">
                      {robot.currentRoom === 'Nursery' && (
                        <>
                          <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-full shadow-lg shadow-amber-400/30 mx-auto animate-bounce" />
                          <p className="text-slate-300 text-xs font-mono font-bold tracking-wider">Emma's Nursery Area</p>
                        </>
                      )}
                      {robot.currentRoom === 'Living Room' && (
                        <>
                          <div className="w-20 h-12 bg-indigo-950/60 rounded-xl border border-indigo-500/30 mx-auto" />
                          <p className="text-slate-300 text-xs font-mono font-bold tracking-wider">Living Room Main Lounge</p>
                        </>
                      )}
                      {robot.currentRoom === 'Bedroom' && (
                        <>
                          <div className="w-16 h-16 bg-teal-950/40 border border-teal-500/30 rounded-full mx-auto flex items-center justify-center">
                            <HeartPulse className="h-8 w-8 text-teal-400 animate-pulse" />
                          </div>
                          <p className="text-slate-300 text-xs font-mono font-bold tracking-wider">Bedtime Sleep Monitor Area</p>
                        </>
                      )}
                      {robot.currentRoom === 'Kitchen' && (
                        <>
                          <div className="w-14 h-14 bg-orange-950/40 border border-orange-500/20 rounded-lg mx-auto flex items-center justify-center">
                            <Flame className="h-7 w-7 text-orange-400 animate-pulse" />
                          </div>
                          <p className="text-slate-300 text-xs font-mono font-bold tracking-wider">Kitchen Safety Area</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Overlay on Stream Hover */}
          {robot.isOnline && robot.cameraActive && (
            <div className="bg-white/3 px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-300 text-xs flex items-center gap-1.5 font-bold">
                <Activity className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                AI Surveillance Active • Stationary Camera Feed
              </span>
              <button 
                onClick={() => setStreamActive(!streamActive)}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold rounded-xl transition-all duration-200"
              >
                {streamActive ? 'Pause Local Feed' : 'Resume Local Feed'}
              </button>
            </div>
          )}
        </div>

        {/* hardware toggles */}
        <div className="glass rounded-3xl p-6 shadow-xl space-y-4" id="robot-hardware-control">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-white text-lg">Companion Hardware Status</h3>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono uppercase tracking-wide">
              Guardian Bot Console
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Camera */}
            <button
              onClick={() => onToggleCamera(!robot.cameraActive)}
              disabled={!robot.isOnline}
              id="toggle-camera-btn"
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${
                !robot.isOnline ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed' :
                robot.cameraActive 
                  ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-300 hover:bg-cyan-500/25 shadow-lg shadow-cyan-500/10 font-bold' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {robot.cameraActive ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
              <span className="text-xs font-black uppercase tracking-wider">Camera</span>
              <span className="text-[10px] font-mono font-bold">{robot.cameraActive ? 'STREAMING' : 'MUTED'}</span>
            </button>

            {/* Microphone */}
            <button
              onClick={() => onToggleMicrophone(!robot.microphoneActive)}
              disabled={!robot.isOnline}
              id="toggle-mic-btn"
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${
                !robot.isOnline ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed' :
                robot.microphoneActive 
                  ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 hover:bg-emerald-500/25 shadow-lg shadow-emerald-500/10 font-bold' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {robot.microphoneActive ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              <span className="text-xs font-black uppercase tracking-wider">Microphone</span>
              <span className="text-[10px] font-mono font-bold">{robot.microphoneActive ? 'LISTENING' : 'MUTED'}</span>
            </button>

            {/* Speaker */}
            <button
              onClick={() => onToggleSpeaker(!robot.speakerActive)}
              disabled={!robot.isOnline}
              id="toggle-speaker-btn"
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${
                !robot.isOnline ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed' :
                robot.speakerActive 
                  ? 'bg-teal-500/15 border-teal-500/45 text-teal-300 hover:bg-teal-500/25 shadow-lg shadow-teal-500/10 font-bold' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {robot.speakerActive ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              <span className="text-xs font-black uppercase tracking-wider">Speaker</span>
              <span className="text-[10px] font-mono font-bold">{robot.speakerActive ? 'ACTIVE' : 'MUTED'}</span>
            </button>

            {/* AI continuous processing */}
            <button
              onClick={() => onToggleAI(!robot.aiActive)}
              disabled={!robot.isOnline}
              id="toggle-ai-btn"
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${
                !robot.isOnline ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed' :
                robot.aiActive 
                  ? 'bg-purple-500/15 border-purple-500/45 text-purple-300 hover:bg-purple-500/25 shadow-lg shadow-purple-500/10 font-bold' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              <Brain className={`h-6 w-6 ${robot.aiActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-black uppercase tracking-wider">AI Guard</span>
              <span className="text-[10px] font-mono font-bold">{robot.aiActive ? 'ENGAGED' : 'PAUSED'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Telemetry & Alert Simulator */}
      <div className="space-y-6">
        {/* Hardware telemetry metrics */}
        <div className="glass rounded-3xl p-6 shadow-xl space-y-4" id="hardware-telemetry">
          <h3 className="font-sans font-bold text-white text-lg">Companion Telemetry</h3>
          
          <div className="space-y-3 font-sans">
            {/* Online Status */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <span className="text-slate-300 text-sm font-bold">Robot Connection</span>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                robot.isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
              }`}>
                {robot.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Room Location Selection */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <label htmlFor="room-select" className="text-slate-300 text-sm font-bold">Nursery Station</label>
              <select
                id="room-select"
                value={robot.currentRoom}
                onChange={(e) => onChangeRoom(e.target.value)}
                disabled={!robot.isOnline}
                className="bg-slate-900/90 text-white text-xs font-bold py-1.5 px-3 border border-white/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition-all duration-200"
              >
                {['Nursery', 'Living Room', 'Bedroom', 'Kitchen'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Battery Telemetry */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <span className="text-slate-300 text-sm font-bold">Battery Reserve</span>
              <div className="flex items-center gap-3">
                {getBatteryIcon(robot.batteryPercentage, robot.isCharging)}
                {robot.isOnline && (
                  <button 
                    onClick={() => onToggleCharging(!robot.isCharging)}
                    className="text-[10px] bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-2 py-1 rounded-lg transition-all duration-150"
                  >
                    {robot.isCharging ? 'Unplug' : 'Plug in'}
                  </button>
                )}
              </div>
            </div>

            {/* CPU Temperature */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <span className="text-slate-300 text-sm font-bold">CPU Temperature</span>
              <div className="flex items-center gap-1.5">
                <Cpu className={`h-4.5 w-4.5 ${robot.cpuTemperature > 42 ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="font-mono text-sm font-bold text-white">
                  {robot.isOnline ? `${robot.cpuTemperature.toFixed(1)}°C` : '--'}
                </span>
              </div>
            </div>

            {/* Wifi strength */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <span className="text-slate-300 text-sm font-bold">WiFi Signal</span>
              <div className="flex items-center gap-2">
                {getWifiIcon(robot.wifiSignalStrength)}
                <span className="font-mono text-sm font-bold text-white">
                  {robot.isOnline ? `${robot.wifiSignalStrength}%` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EMERGENCY & INCIDENT SIMULATOR */}
        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-950/80 text-white rounded-3xl p-6 shadow-2xl border border-white/10 space-y-4 backdrop-blur-md" id="emergency-simulator">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse" />
            <h3 className="font-sans font-bold text-white text-base">AI Detection Simulator</h3>
          </div>
          
          <p className="text-white/60 text-xs leading-relaxed font-medium">
            Trigger simulated physical events to test GuardianBot's high-fidelity real-time notification engine, visual tracking overlays, and smart dashboard response.
          </p>

          <div className="space-y-4 pt-1 font-sans">
            {/* Critical Emergencies */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase font-mono block">Critical Hazards (Siren + Flash)</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.fire)}
                  disabled={!robot.isOnline}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flame className="h-4 w-4 text-rose-400" />
                  Smoke/Fire
                </button>
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.fallDetected)}
                  disabled={!robot.isOnline}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HeartPulse className="h-4 w-4 text-rose-400" />
                  Fall Detected
                </button>
              </div>
            </div>

            {/* Smart Voice/Presence warnings */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase font-mono block">Urgent Warnings</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.childCrying)}
                  disabled={!robot.isOnline}
                  className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Child Crying
                </button>
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.unknownPerson)}
                  disabled={!robot.isOnline}
                  className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Unknown Person
                </button>
              </div>
            </div>

            {/* Standard Presence / Routine activity */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">Routine Activity</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.childPresence)}
                  disabled={!robot.isOnline}
                  className="px-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-200 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Emma Presence
                </button>
                <button
                  onClick={() => onTriggerSimulatedDetection(DetectionType.motionDetected)}
                  disabled={!robot.isOnline}
                  className="px-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-200 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  Motion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
