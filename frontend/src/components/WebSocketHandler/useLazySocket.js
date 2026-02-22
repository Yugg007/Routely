import React, { useState, useCallback, useMemo } from 'react';
import useWebSocket from 'react-use-websocket';

export const useLazySocket = (handleResponse, socketUrl) => {
    const [shouldConnect, setShouldConnect] = useState(false);
    const effectWsUrl = shouldConnect ? socketUrl : null; // Only set URL when we want to connect

    const { sendMessage, readyState } = useWebSocket(effectWsUrl, {
        onOpen: () => console.log("📡 Socket Opened"),
        onClose: () => console.log("🛑 Socket Closed"),
        onMessage: (event) => handleResponse(event),
        shouldReconnect: () => true,
    });

    const handleWebSocketRequestMessage = useCallback((key, payload) => {
        if (readyState === 1) {
            sendMessage(JSON.stringify({ type: key, payload }));
        }
    }, [sendMessage, readyState]);

    const startConnection = useCallback(() => {
        setShouldConnect(true);
    }, []);

    const stopConnection = useCallback(() => {
        setShouldConnect(false);
    }, []);

    return useMemo(() => ({
        handleWebSocketRequestMessage,
        startConnection,
        stopConnection,
        readyState
    }), [startConnection, handleWebSocketRequestMessage, readyState]);
};