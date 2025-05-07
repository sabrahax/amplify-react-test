import { useState, useEffect, useCallback } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { DefaultFileUploaderExample } from './FileUploaderExample'; // Import the new component
import '@aws-amplify/ui-react/styles.css';

function App() {
  const { user, signOut } = useAuthenticator();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const inactivityTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
  const warningTime = 30 * 1000; // Show warning 30 seconds before logout

  const username = user?.signInDetails?.loginId?.split('@')[0] || "Guest";

  // Reset the timer when user activity is detected
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Check for inactivity
  useEffect(() => {
    const checkInactivity = () => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      
      // If inactive for more than the timeout, log out
      if (timeSinceLastActivity >= inactivityTimeout) {
        console.log('Auto logout due to inactivity');
        signOut();
      } 
      // Show warning when approaching timeout
      else if (timeSinceLastActivity >= inactivityTimeout - warningTime) {
        setShowWarning(true);
      }
    };

    // Check every 10 seconds in production
    const interval = setInterval(checkInactivity, 10000);
    
    return () => clearInterval(interval);
  }, [lastActivity, inactivityTimeout, signOut]);

  // Set up event listeners for user activity
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      resetTimer();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Clean up event listeners
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [resetTimer]);

  // Calculate time remaining for warning message
  const getTimeRemaining = () => {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivity;
    const timeRemaining = Math.max(0, inactivityTimeout - timeSinceLastActivity);
    return Math.ceil(timeRemaining / 1000); // Convert to seconds
  };

  // Format the remaining time as MM:SS
  const formatTimeRemaining = () => {
    const seconds = getTimeRemaining();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main>
      <h4>{username}</h4>
      {showWarning && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #ffeeba'
        }}>
          <strong>Warning:</strong> You will be logged out in {formatTimeRemaining()} due to inactivity.
          <button 
            onClick={resetTimer}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Stay Logged In
          </button>
        </div>
      )}
      <div>
        <button onClick={signOut} style={{ backgroundColor: 'green', color: 'white' }}>Logout</button>
        <br />
        <a href="">
          Please remember to log out!
        </a>
      </div>
      <div>
        <h4></h4>
        <DefaultFileUploaderExample /> {/* Use the new component */}
      </div>
    </main>
  );
}

export default App;