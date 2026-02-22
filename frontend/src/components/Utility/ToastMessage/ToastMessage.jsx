import React, { useEffect } from 'react';
import './ToastMessage.css';

const ToastMessage = ({ message, type = 'info', isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto-hide after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-container ${type} ${isVisible ? 'show' : ''}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close" onClick={onClose}>&times;</button>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

export default ToastMessage;