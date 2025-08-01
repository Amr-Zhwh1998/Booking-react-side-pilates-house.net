import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AutoRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // אם יש נתוני משתמש ב-localStorage, ננווט אוטומטית לדף הפרופיל
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate('/profile');
    }
  }, [navigate]);

  return null; // לא מציג שום דבר, רק מבצע את ההפניה
}

export default AutoRedirect;
