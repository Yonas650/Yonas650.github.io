// In your AudioPlayer.jsx component

import React, { useState, useEffect } from 'react';

const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audio = new Audio('./Gibran Alcocer - Idea 10.mp3'); //make sure the path is correct
        audio.loop = true;

        if (isPlaying) {
            audio.play().catch(error => console.error('Error playing the audio:', error));
        } else {
            audio.pause();
        }

        //clean up the audio element when the component unmounts
        return () => {
            audio.pause();
            audio.src = ''; //this releases the audio resources
        };
    }, [isPlaying]);

    return (
        <button className="audio-player-button" onClick={() => setIsPlaying(!isPlaying)}>
            🎵 {isPlaying ? 'Mute' : 'Play'}
        </button>
    );
};

export default AudioPlayer;
