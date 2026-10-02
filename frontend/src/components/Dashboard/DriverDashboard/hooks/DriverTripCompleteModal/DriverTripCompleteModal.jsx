import { useState, useEffect } from 'react';
import { BackendService } from '../../../../../utils/ApiConfig/ApiMiddleWare';
import ApiEndpoints from '../../../../../utils/ApiConfig/ApiEndpoints';

import './DriverTripCompleteModal.css'; 

const DriverTripCompleteModal = ({ isOpen, ride, totalFare = "0.00", onTripCompleted, onClose }) => {
  const [status, setStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // Default to Cash

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setErrorMessage('');
      setPaymentMethod('CASH');
    }
  }, [isOpen]);

  const handleFinishTrip = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // Send the paymentMethod so the backend knows how the money was collected
      const payload = { 
        rideId: ride.rideId, 
        driverId: ride.driverId,
        userId: ride.userId,
        paymentMethod, 
        amountReceived: totalFare
      };
      
      const response = await BackendService(ApiEndpoints.completeRide, payload);

      if (response.status === 200) {
        setStatus('success');
        setTimeout(() => {
          onTripCompleted(response.data);
        }, 1500);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to end trip. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trip-modal-overlay">
      <div className="trip-modal-container">
        
        <div className="trip-modal-header">
          <div className="icon-circle">🏁</div>
          <h3>Trip Summary</h3>
          <p>Ride #{ride?.rideId}</p>
        </div>

        <div className="trip-modal-body">
          <div className="fare-display">
            <span className="label">Amount to Collect</span>
            <span className="amount">₹{totalFare}</span>
          </div>

          <div className="payment-selector">
            <p className="selector-title">Select Payment Method:</p>
            <div className="method-options">
              <label className={`method-card ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="CASH" 
                  checked={paymentMethod === 'CASH'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="icon">💵</span>
                <span className="text">Cash</span>
              </label>

              <label className={`method-card ${paymentMethod === 'UPI' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="UPI" 
                  checked={paymentMethod === 'UPI'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="icon">📱</span>
                <span className="text">UPI / QR</span>
              </label>
            </div>
          </div>

          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {status === 'success' && <p className="success-text">Payment Confirmed! Closing Trip...</p>}
        </div>

        <div className="trip-modal-footer stacked">
          <button
            onClick={handleFinishTrip}
            disabled={status === 'loading' || status === 'success'}
            className="btn-complete-trip"
          >
            {status === 'loading' ? 'PROCESSING...' : `CONFIRM ₹${totalFare} RECEIVED`}
          </button>
          
          <button
            onClick={onClose}
            disabled={status === 'loading' || status === 'success'}
            className="btn-cancel-trip"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverTripCompleteModal;