import { useState, useEffect } from 'react';
import { BackendService } from '../../../../utils/ApiConfig/ApiMiddleWare';
import ApiEndpoints from '../../../../utils/ApiConfig/ApiEndpoints';

import './DriverTripStartModal.css'; // Import your new style file

const DriverTripStartModal = ({ isOpen, rideId, onTripStarted, onClose }) => {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleVerifyAndStart = async () => {
    if (pin.length !== 4) {
      setErrorMessage('Please enter the 4-digit PIN provided by the passenger.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const payload = { rideId, pin };
      const response = await BackendService(ApiEndpoints.verifyPin, payload);

      if (response.status === 200) {
        setStatus('success');
        setTimeout(() => {
          onTripStarted(response.data);
        }, 1000);
      }
    } catch (err) {
      setStatus('error');
      const msg = err.response?.data?.message || 'Invalid PIN. Please check with the passenger.';
      setErrorMessage(msg);
      setPin('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trip-modal-overlay">
      <div className="trip-modal-container">
        
        {/* Header Section */}
        <div className="trip-modal-header">
          <h3>Verify Passenger</h3>
          <p>Enter the PIN to start Ride #{rideId}</p>
        </div>

        {/* Input Section */}
        <div className="trip-modal-body">
          <div className="pin-input-wrapper">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              disabled={status === 'loading' || status === 'success'}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0 0 0 0"
              className={`pin-field ${status === 'error' ? 'is-error' : ''} ${status === 'success' ? 'is-success' : ''}`}
            />
            
            {status === 'loading' && (
              <div className="loading-overlay">
                <div className="spin-loader"></div>
              </div>
            )}
          </div>

          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {status === 'success' && <p className="success-text">PIN Verified! Starting Trip...</p>}
        </div>

        {/* Footer Buttons */}
        <div className="trip-modal-footer">
          <button
            onClick={handleVerifyAndStart}
            disabled={pin.length < 4 || status === 'loading' || status === 'success'}
            className="btn-start-trip"
          >
            START TRIP
          </button>
          
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="btn-cancel-trip"
          >
            Cancel / Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverTripStartModal;