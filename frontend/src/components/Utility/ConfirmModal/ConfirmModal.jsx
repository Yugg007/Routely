import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = React.memo(({ 
    isOpen, 
    title, 
    message, 
    confirmText = "Yes", 
    cancelText = "No", 
    onConfirm, 
    onCancel,
    type = "danger" 
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-content">
                    {title && <h3 className="modal-title">{title}</h3>}
                    <p className="modal-message">{message}</p>
                </div>
                <div className="modal-actions">
                    <button className="modal-btn btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`modal-btn btn-confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
});

// Set a display name for easier debugging in React DevTools
ConfirmModal.displayName = 'ConfirmModal';

export default ConfirmModal;