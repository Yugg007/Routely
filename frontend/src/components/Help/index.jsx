import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import Property from "../../constants/Property";

const WS_DEBUG_URL = Property.Debug_WS_URL;

export default function Help() {
    const [messages, setMessages] = useState([]);
    const { sendMessage, lastMessage, readyState } = useWebSocket(WS_DEBUG_URL, {
        onOpen: () => console.log("react-use-websocket: OPEN"),
        onClose: (ev) => console.log("react-use-websocket: CLOSED", ev),
        onError: (err) => console.error("react-use-websocket: ERROR", err),
        onMessage: (event) => {
            setMessages((m) => [...m, event.data]);
        },
        shouldReconnect: () => true,
    });


    const doSend = () => {
        const locationUpdate = {
            driverId: "driver123",
            lat: 12.9716,
            lng: 77.5946,
            timestamp: new Date().toISOString(),
            accuracy: 3
        };
        sendMessage(JSON.stringify(locationUpdate));
    };

    return (
        <div>
            <h3>WS debug</h3>
            <button onClick={doSend}>Send Location</button>
            <div>
                <strong>ReadyState:</strong> {readyState}
            </div>
            <div>
                <strong>Messages received (via onMessage callback):</strong>
                <ul>
                    {messages.map((m, i) => (
                        <li key={i}>{m}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
