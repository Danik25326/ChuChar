import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function AudioPlayer({ src }) {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4f46e5',
        progressColor: '#818cf8',
        cursorColor: '#cbd5e1',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 40
      });

      wavesurfer.current.load(src);

      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current.getDuration());
      });

      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current.getCurrentTime());
      });

      wavesurfer.current.on('finish', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        wavesurfer.current.destroy();
      };
    }
  }, [src]);

  const togglePlay = () => {
    wavesurfer.current.playPause();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <button onClick={togglePlay} className="text-neon-blue">
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <div ref={waveformRef} className="flex-1" />
      <span className="text-xs text-neon-text-secondary">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
