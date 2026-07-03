/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, LayoutDashboard, Compass, Bell, 
  Volume2, BarChart2, Settings as SettingsIcon, LogOut, 
  ShieldAlert, Flame, HeartPulse, X, Check, VolumeX, AlertTriangle
} from 'lucide-react';
import { 
  RobotModel, DetectionModel, UserModel, DetectionType, 
  DetectionSeverity, RobotStatus 
} from './types';
import Dashboard from './components/Dashboard';
import DetectionsFeed from './components/DetectionsFeed';
import VoicePlayground from './components/VoicePlayground';
import Metrics from './components/Metrics';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'voice' | 'metrics' | 'settings'>('dashboard');

  // --- 1. STATE INITIALIZATION (Mimics Riverpod states) ---
  const [user, setUser] = useState<UserModel | null>({
    id: 'usr_001',
    name: 'Sarah Vance',
    email: 'sarah@guardianbot.ai',
    phone: '+1 (555) 012-3456',
    avatarUrl: null,
    childName: 'Emma',
    childAge: 4,
    isProfileSetup: true
  });

  const [robot, setRobot] = useState<RobotModel>({
    id: 'rbt_guardian_a1',
    name: 'Guardian A1',
    isOnline: true,
    batteryPercentage: 84,
    cpuTemperature: 38.5,
    currentRoom: 'Nursery',
    wifiSignalStrength: 92,
    isCharging: false,
    cameraActive: true,
    microphoneActive: true,
    speakerActive: true,
    aiActive: true,
    lastUpdated: new Date().toISOString()
  });

  const [detections, setDetections] = useState<DetectionModel[]>([
    {
      id: 'det_001',
      type: DetectionType.childPresence,
      confidence: 0.982,
      timestamp: new Date(Date.now() - 120000).toISOString(), // 2 mins ago
      severity: DetectionSeverity.normal,
      isActive: false,
      roomName: 'Nursery'
    },
    {
      id: 'det_002',
      type: DetectionType.motionDetected,
      confidence: 0.875,
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
      severity: DetectionSeverity.normal,
      isActive: false,
      roomName: 'Living Room'
    },
    {
      id: 'det_003',
      type: DetectionType.childCrying,
      confidence: 0.934,
      timestamp: new Date(Date.now() - 720000).toISOString(), // 12 mins ago
      severity: DetectionSeverity.warning,
      isActive: false,
      roomName: 'Nursery'
    }
  ]);

  const [latestDetection, setLatestDetection] = useState<DetectionModel | null>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState<DetectionModel | null>(null);

  // --- 2. TELEMETRY STREAM SIMULATOR (Drift every 5 seconds) ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (!robot.isOnline) return;

      setRobot(prev => {
        const nextBattery = prev.isCharging
          ? Math.min(100, prev.batteryPercentage + 1)
          : Math.max(0, prev.batteryPercentage - 1);

        const nextTemp = 36.0 + (4.0 * (nextBattery % 3) / 3.0);
        const nextWifi = Math.min(99, Math.max(70, prev.wifiSignalStrength + (nextBattery % 3) - 1));

        return {
          ...prev,
          batteryPercentage: nextBattery,
          cpuTemperature: nextTemp,
          wifiSignalStrength: nextWifi,
          lastUpdated: new Date().toISOString()
        };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [robot.isOnline]);

  // --- 3. INCIDENT EVENT SIMULATOR (Fires every 15 seconds) ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (!robot.isOnline || !robot.aiActive) return;

      // Random chance to fire detection
      triggerRandomDetection();
    }, 15000);

    return () => clearInterval(timer);
  }, [robot.isOnline, robot.aiActive]);

  const triggerRandomDetection = () => {
    const types = Object.values(DetectionType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const confidence = 0.75 + Math.random() * 0.24;

    let severity = DetectionSeverity.normal;
    if (randomType === DetectionType.fire || randomType === DetectionType.smoke || randomType === DetectionType.fallDetected) {
      severity = DetectionSeverity.critical;
    } else if (randomType === DetectionType.unknownPerson || randomType === DetectionType.dangerousObject || randomType === DetectionType.childCrying || randomType === DetectionType.loudDistress) {
      severity = DetectionSeverity.warning;
    }

    const rooms = ['Living Room', 'Nursery', 'Bedroom', 'Kitchen'];
    // For nursery bias
    const randomRoom = randomType === DetectionType.childCrying || randomType === DetectionType.childPresence 
      ? 'Nursery' 
      : rooms[Math.floor(Math.random() * rooms.length)];

    const newDetection: DetectionModel = {
      id: `det_sim_${Date.now()}`,
      type: randomType,
      confidence,
      timestamp: new Date().toISOString(),
      severity,
      isActive: true,
      roomName: randomRoom
    };

    setDetections(prev => [newDetection, ...prev]);
    setLatestDetection(newDetection);
    setShowNotificationToast(newDetection);

    if (severity === DetectionSeverity.critical) {
      setAlarmActive(true);
    }

    // Auto clear Toast notification after 6 seconds
    setTimeout(() => {
      setShowNotificationToast(null);
    }, 6000);
  };

  // Manual Trigger for UI Testing
  const triggerManualDetection = (type: DetectionType) => {
    let severity = DetectionSeverity.normal;
    if (type === DetectionType.fire || type === DetectionType.smoke || type === DetectionType.fallDetected) {
      severity = DetectionSeverity.critical;
    } else if (type === DetectionType.unknownPerson || type === DetectionType.dangerousObject || type === DetectionType.childCrying || type === DetectionType.loudDistress) {
      severity = DetectionSeverity.warning;
    }

    const newDetection: DetectionModel = {
      id: `det_man_${Date.now()}`,
      type,
      confidence: 0.94 + Math.random() * 0.05,
      timestamp: new Date().toISOString(),
      severity,
      isActive: true,
      roomName: robot.currentRoom
    };

    setDetections(prev => [newDetection, ...prev]);
    setLatestDetection(newDetection);
    setShowNotificationToast(newDetection);

    if (severity === DetectionSeverity.critical) {
      setAlarmActive(true);
    }

    setTimeout(() => {
      setShowNotificationToast(null);
    }, 6000);
  };

  // --- 4. HARDWARE MUTATORS ---
  const toggleCamera = (active: boolean) => {
    setRobot(prev => ({ ...prev, cameraActive: active }));
  };

  const toggleMicrophone = (active: boolean) => {
    setRobot(prev => ({ ...prev, microphoneActive: active }));
  };

  const toggleSpeaker = (active: boolean) => {
    setRobot(prev => ({ ...prev, speakerActive: active }));
  };

  const toggleAI = (active: boolean) => {
    setRobot(prev => ({ ...prev, aiActive: active }));
  };

  const toggleCharging = (charging: boolean) => {
    setRobot(prev => ({ ...prev, isCharging: charging }));
  };

  const changeRoom = (room: string) => {
    setRobot(prev => ({ ...prev, currentRoom: room }));
  };

  const reconnectRobot = () => {
    setRobot(prev => ({ ...prev, isOnline: false }));
    setTimeout(() => {
      setRobot(prev => ({
        ...prev,
        isOnline: true,
        batteryPercentage: 84,
        cpuTemperature: 38.5,
        wifiSignalStrength: 92,
        lastUpdated: new Date().toISOString()
      }));
    }, 1000);
  };

  // --- 5. LOG MUTATORS ---
  const clearDetections = () => {
    setDetections([]);
    setLatestDetection(null);
  };

  const acknowledgeAll = () => {
    setDetections(prev => prev.map(d => ({ ...d, isActive: false })));
    setLatestDetection(null);
    setAlarmActive(false);
  };

  const acknowledgeItem = (id: string) => {
    setDetections(prev => prev.map(d => d.id === id ? { ...d, isActive: false } : d));
    if (latestDetection?.id === id) {
      setLatestDetection(null);
      setAlarmActive(false);
    }
  };

  return (
    <div className="min-h-screen app-container-bg flex flex-col font-sans text-white relative selection:bg-cyan-500 selection:text-black overflow-x-hidden" id="main-app-shell">
      {/* 🔮 BEAUTIFUL FROSTED GLASS MESH BACKGROUND */}
      <div className="mesh-bg" />

      {/* ⚠️ EMERGENCY SIREN STROBE OVERLAY (FullScreen flashing hazard for Fire or Fall) */}
      {alarmActive && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md z-50 pointer-events-none animate-siren-strobe border-8 border-rose-500 flex items-center justify-center">
          <div className="bg-slate-950/90 text-white p-6 rounded-3xl shadow-2xl border border-rose-500/50 pointer-events-auto flex flex-col items-center gap-4 text-center max-w-sm backdrop-blur-xl">
            <ShieldAlert className="h-16 w-16 text-rose-500 animate-bounce" />
            <div>
              <h2 className="text-rose-500 font-extrabold text-xl tracking-tight uppercase">Critical AI Alert</h2>
              <p className="text-slate-300 text-sm mt-1.5 leading-relaxed font-semibold">
                An active hazard has been detected by GuardianBot in the {latestDetection?.roomName}!
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button 
                onClick={acknowledgeAll}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all duration-200"
              >
                Deactivate Siren Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {showNotificationToast && (
        <div className="fixed top-6 right-6 z-40 animate-slide-down bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-white/10 max-w-sm flex gap-3.5" id="notification-toast">
          <div className={`p-3 rounded-xl ${
            showNotificationToast.severity === DetectionSeverity.critical ? 'bg-rose-500/20 text-rose-400' :
            showNotificationToast.severity === DetectionSeverity.warning ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-xs font-bold ${
                showNotificationToast.severity === DetectionSeverity.critical ? 'text-rose-400' : 'text-cyan-400'
              }`}>
                {showNotificationToast.severity === DetectionSeverity.critical ? '🚨 CRITICAL HAZARD' : '🔔 GuardianBot Alert'}
              </span>
              <button onClick={() => setShowNotificationToast(null)}>
                <X className="h-4 w-4 text-white/40 hover:text-white" />
              </button>
            </div>
            <p className="text-xs text-white/80 font-semibold leading-relaxed">
              New activity in <strong className="text-white">{showNotificationToast.roomName}</strong>: {
                showNotificationToast.type === DetectionType.childCrying ? 'Emma is Crying' :
                showNotificationToast.type === DetectionType.fallDetected ? 'Fall Detected!' :
                showNotificationToast.type === DetectionType.fire ? 'Smoke/Fire Detected!' : 'Activity Detected'
              }
            </p>
            <span className="text-[10px] text-white/40 font-mono font-bold block">
              AI Confidence: {(showNotificationToast.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* --- APP HEADER BAR --- */}
      <header className="glass-header h-20 flex items-center justify-between px-6 z-10 mx-6 mt-6 mb-2 rounded-3xl" id="app-header">
        <div className="flex items-center gap-3">
          <div className="logo-icon bg-cyan-500 p-2.5 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Bot className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-base leading-none tracking-wider text-white">GUARDIAN BOT</h1>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">AI Surveillance Engine v1.0.4</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {robot.isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1 rounded-full animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              System Offline
            </span>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden md:block">
              <span className="text-sm font-bold text-white block">{user?.name}</span>
              <span className="text-[10px] text-white/50 block font-mono">Primary Caregiver</span>
            </div>
            <div className="w-10 h-10 bg-white/5 border border-white/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm shadow-inner uppercase">
              {user?.name.substring(0, 2)}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CORE GRID CONTAINER --- */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 z-10" id="core-layout-grid">
        
        {/* SIDEBAR TABS BAR (3-col width) */}
        <aside className="md:col-span-3 space-y-3" id="sidebar-navigation">
          <button
            onClick={() => setActiveTab('dashboard')}
            id="tab-dashboard-btn"
            className={`w-full p-4 rounded-2xl flex items-center gap-3.5 font-sans font-extrabold text-sm tracking-wide cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'glass-interactive-active text-cyan-400 font-black' 
                : 'glass-interactive text-white/70 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 text-cyan-400" />
            Surveillance Console
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            id="tab-logs-btn"
            className={`w-full p-4 rounded-2xl flex items-center justify-between gap-3.5 font-sans font-extrabold text-sm tracking-wide cursor-pointer ${
              activeTab === 'logs' 
                ? 'glass-interactive-active text-cyan-400 font-black' 
                : 'glass-interactive text-white/70 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Compass className="h-5 w-5 text-cyan-400" />
              Incidents & logs
            </div>
            {detections.filter(d => d.isActive).length > 0 && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'logs' ? 'bg-cyan-500 text-slate-950' : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {detections.filter(d => d.isActive).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            id="tab-voice-btn"
            className={`w-full p-4 rounded-2xl flex items-center gap-3.5 font-sans font-extrabold text-sm tracking-wide cursor-pointer ${
              activeTab === 'voice' 
                ? 'glass-interactive-active text-cyan-400 font-black' 
                : 'glass-interactive text-white/70 hover:text-white'
            }`}
          >
            <Volume2 className="h-5 w-5 text-cyan-400" />
            AI Voice & Stories
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            id="tab-metrics-btn"
            className={`w-full p-4 rounded-2xl flex items-center gap-3.5 font-sans font-extrabold text-sm tracking-wide cursor-pointer ${
              activeTab === 'metrics' 
                ? 'glass-interactive-active text-cyan-400 font-black' 
                : 'glass-interactive text-white/70 hover:text-white'
            }`}
          >
            <BarChart2 className="h-5 w-5 text-cyan-400" />
            Routine Analytics
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            id="tab-settings-btn"
            className={`w-full p-4 rounded-2xl flex items-center gap-3.5 font-sans font-extrabold text-sm tracking-wide cursor-pointer ${
              activeTab === 'settings' 
                ? 'glass-interactive-active text-cyan-400 font-black' 
                : 'glass-interactive text-white/70 hover:text-white'
            }`}
          >
            <SettingsIcon className="h-5 w-5 text-cyan-400" />
            Policy Settings
          </button>
        </aside>

        {/* MAIN PANEL CONTENT AREA (9-col width) */}
        <main className="md:col-span-9" id="panel-viewport">
          {activeTab === 'dashboard' && (
            <Dashboard
              robot={robot}
              latestDetection={latestDetection}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
              onToggleSpeaker={toggleSpeaker}
              onToggleAI={toggleAI}
              onToggleCharging={toggleCharging}
              onChangeRoom={changeRoom}
              onTriggerSimulatedDetection={triggerManualDetection}
              onReconnect={reconnectRobot}
            />
          )}

          {activeTab === 'logs' && (
            <DetectionsFeed
              detections={detections}
              onClearAll={clearDetections}
              onAcknowledgeAll={acknowledgeAll}
              onAcknowledgeItem={acknowledgeItem}
            />
          )}

          {activeTab === 'voice' && (
            <VoicePlayground
              robot={robot}
              user={user}
            />
          )}

          {activeTab === 'metrics' && (
            <Metrics
              detections={detections}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              user={user}
              robot={robot}
              onUpdateUser={setUser}
              onUpdateRobot={setRobot}
            />
          )}
        </main>
      </div>

      {/* --- GLOBAL APP FOOTER --- */}
      <footer className="bg-transparent border-t border-white/5 py-6 text-center text-xs text-white/30 font-sans shrink-0 mt-auto z-10" id="app-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>GuardianBot Companion Web Console • Stationary Surveillance and Care Assistance</span>
          <span className="font-mono text-[10px]">© 2026 GuardianBot AI. Active Firmware: v1.0.4 • TLS Secure Connection</span>
        </div>
      </footer>
    </div>
  );
}
