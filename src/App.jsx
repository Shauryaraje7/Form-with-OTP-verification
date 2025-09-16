import React, { useState } from 'react';
import './App.css';

// Access environment variables with Vite
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = import.meta.env.VITE_TWILIO_VERIFY_SERVICE_SID;

// Check if environment variables are defined
const isConfigValid = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && VERIFY_SERVICE_SID;

// Base64 encode credentials for Basic Auth (only if valid)
const authHeader = isConfigValid ? btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`) : null;

// Google Apps Script web app URL (replace with your actual URL)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzxLoUYj1_kRrIw9_CIkwBnuf2MAS4_pAcFwkP6gQrYaIca5PCGAzvNfu2GwnGN7ZR7/exec'; // e.g., https://script.google.com/macros/s/xxx/exec

const App = () => {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  
  // Auth states
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVerified) {
      alert('Please verify your phone number first');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script from client-side
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          name,
          email,
          phone,
          propertyType,
          budget,
          message
        })
      });
      
      console.log('Form submitted:', { name, email, phone, propertyType, budget, message });
      alert('Form submitted successfully! We will contact you soon.');
      resetForm();
    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
      setAuthError('Error submitting form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPropertyType('');
    setBudget('');
    setMessage('');
    setOtp('');
    setIsOtpSent(false);
    setIsVerified(false);
    setAuthError('');
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    
    if (!isConfigValid) {
      setAuthError('Configuration error: Missing Twilio credentials. Check .env file.');
      setIsLoading(false);
      return;
    }

    if (!phone) {
      setAuthError('Please enter a phone number');
      setIsLoading(false);
      return;
    }
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/Verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Authorization': `Basic ${authHeader}`
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms'
        })
      });
      const data = await response.json();
      
      if (!response.ok || data.status !== 'pending') {
        throw new Error(data.message || 'Error sending OTP');
      }
      
      setIsOtpSent(true);
      setAuthError('');
      alert('OTP has been sent to your phone!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      setAuthError(error.message || 'Error sending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    
    if (!isConfigValid) {
      setAuthError('Configuration error: Missing Twilio credentials. Check .env file.');
      setIsLoading(false);
      return;
    }

    if (!otp || otp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP');
      setIsLoading(false);
      return;
    }
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Authorization': `Basic ${authHeader}`
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Code: otp
        })
      });
      const data = await response.json();
      
      if (!response.ok || data.status !== 'approved') {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      setIsVerified(true);
      setAuthError('');
      alert('Phone number verified successfully!');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setAuthError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setAuthError('');
    setIsLoading(true);
    
    if (!isConfigValid) {
      setAuthError('Configuration error: Missing Twilio credentials. Check .env file.');
      setIsLoading(false);
      return;
    }

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/Verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Authorization': `Basic ${authHeader}`
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms'
        })
      });
      const data = await response.json();
      
      if (!response.ok || data.status !== 'pending') {
        throw new Error(data.message || 'Error resending OTP');
      }
      
      setAuthError('');
      alert('New OTP has been sent to your phone!');
    } catch (error) {
      console.error('Error resending OTP:', error);
      setAuthError(error.message || 'Error resending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="background-overlay"></div>
      <div className="form-container">
        <div className="form-header">
          <h1>Luxury Real Estate</h1>
          <p className="subtitle">Find Your Dream Home With Us</p>
        </div>
        
        {isConfigValid ? null : (
          <div className="error-message">
            Error: Twilio configuration is missing. Please check your .env file.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="real-estate-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="elegant-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="elegant-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="phone-auth">
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                required
                disabled={isOtpSent || isLoading}
                className="elegant-input"
              />
              {!isOtpSent ? (
                <button 
                  type="button" 
                  onClick={handlePhoneAuth} 
                  className="send-otp-btn elegant-button"
                  disabled={isLoading || !isConfigValid}
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <span className="otp-sent">✓ OTP Sent</span>
              )}
            </div>
          </div>
          
          {isOtpSent && !isVerified && (
            <>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="otp-verify">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength="6"
                    disabled={isLoading}
                    className="elegant-input"
                  />
                  <button 
                    type="button" 
                    onClick={verifyOtp} 
                    className="verify-otp-btn elegant-button"
                    disabled={isLoading || !isConfigValid}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
              
              <div className="resend-otp">
                <button 
                  type="button" 
                  onClick={resendOtp}
                  disabled={isLoading || !isConfigValid}
                  className="text-button"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}
          
          {authError && (
            <div className="error-message">
              {authError}
            </div>
          )}
          
          {isVerified && (
            <div className="verified-badge">
              ✓ Phone number verified
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                required
                disabled={isLoading}
                className="elegant-input"
              >
                <option value="">Select an option</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="budget">Budget Range ($)</label>
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                disabled={isLoading}
                className="elegant-input"
              >
                <option value="">Select an option</option>
                <option value="100k-300k">$100,000 - $300,000</option>
                <option value="300k-500k">$300,000 - $500,000</option>
                <option value="500k-1m">$500,000 - $1,000,000</option>
                <option value="1m+">$1,000,000+</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              disabled={isLoading}
              className="elegant-input"
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="submit-btn elegant-button primary"
            disabled={!isVerified || isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;