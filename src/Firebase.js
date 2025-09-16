import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClxPMitF1eg6z-909KltKhUmZp6ZWa0_Q",
  authDomain: "otp-form-41545.firebaseapp.com",
  projectId: "otp-form-41545",
  storageBucket: "otp-form-41545.firebasestorage.app",
  messagingSenderId: "5907089145",
  appId: "1:5907089145:web:da222a105d223318198428",
  measurementId: "G-4Q6RRFJ40N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set up reCAPTCHA
let recaptchaVerifier = null;

export const setUpRecaptcha = (phoneNumber) => {
  return new Promise((resolve, reject) => {
    try {
      // Clear any existing reCAPTCHA
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }

      // Initialize reCAPTCHA verifier
      recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });

      // Send OTP
      signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
        .then((confirmationResult) => {
          console.log('OTP sent successfully');
          resolve(confirmationResult);
        })
        .catch((error) => {
          console.error('Error in signInWithPhoneNumber:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error in setUpRecaptcha:', error);
      reject(error);
    }
  });
};

// Reset reCAPTCHA
export const resetRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  
  const recaptchaContainer = document.getElementById('recaptcha-container');
  if (recaptchaContainer) {
    recaptchaContainer.innerHTML = '';
  }
};