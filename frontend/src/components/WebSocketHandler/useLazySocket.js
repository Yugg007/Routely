import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export const useLazySocket = (handleResponse, socketUrl) => {
    const [shouldConnect, setShouldConnect] = useState(false);
    const effectWsUrl = shouldConnect ? socketUrl : null; 

    const handleResponseRef = useRef(handleResponse);
    useEffect(() => {
        handleResponseRef.current = handleResponse;
    }, [handleResponse]);

    const messageQueueRef = useRef([]);

    const { sendMessage, readyState } = useWebSocket(effectWsUrl, {
        onOpen: () => {
            console.log("📡 Socket Opened");
            if (messageQueueRef.current.length > 0) {
                console.log(`[WS] Flushing ${messageQueueRef.current.length} queued messages...`);
                messageQueueRef.current.forEach((msg) => sendMessage(msg));
                messageQueueRef.current = [];
            }
        },
        onClose: () => console.log("🛑 Socket Closed"),
        onMessage: (event) => handleResponseRef.current?.(event),
        shouldReconnect: () => shouldConnect,
    });

    // Keep a ref of readyState and sendMessage to prevent stale closures completely
    const readyStateRef = useRef(readyState);
    readyStateRef.current = readyState;

    const sendMessageRef = useRef(sendMessage);
    sendMessageRef.current = sendMessage;

    useEffect(() => {
        console.log(`[WS STATE] ReadyState: ${readyState}`);
    }, [readyState]);

    const handleWebSocketRequestMessage = useCallback((key, payload) => {
        const messageString = JSON.stringify({ type: key, payload });
        console.log(`[WS SEND] Type: ${key}`, payload);

        // Always check the current ref value instead of a closed-over variable
        if (readyStateRef.current === ReadyState.OPEN) {
            sendMessageRef.current(messageString);
        } else {
            console.warn(`[WS] Socket not open (State: ${readyStateRef.current}). Queuing message.`);
            messageQueueRef.current.push(messageString);
        }
    }, []); // Empty dependency array is now safe because we use refs!

    const startConnection = useCallback(() => {
        setShouldConnect(true);
    }, []);

    const stopConnection = useCallback(() => {
        setShouldConnect(false);
        messageQueueRef.current = [];
    }, []);

    return useMemo(() => ({
        handleWebSocketRequestMessage,
        startConnection,
        stopConnection,
        readyState
    }), [startConnection, handleWebSocketRequestMessage, readyState]);
};