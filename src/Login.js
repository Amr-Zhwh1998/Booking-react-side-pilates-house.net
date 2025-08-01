import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // אם המשתמש כבר מחובר (יש נתונים ב-localStorage), נווט אוטומטית לדף הפרופיל
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate('/profile');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'https://calendar.pilates-house.net/wp-json/malak/v1/login',
        { phone, password }
      );

      if (response.data && response.data.id && response.data.full_name) {
        const currentDate = new Date();
        const endDate = new Date(response.data.end_date);

        if (endDate < currentDate) {
          navigate('/renew-subscription');
        } else {
          localStorage.setItem('user', JSON.stringify({
            id: response.data.id,
            full_name: response.data.full_name,
            phone: phone,
            end_date: response.data.end_date,
            training_type: response.data.training_type,
            training_days: response.data.training_days,

          }));

          navigate('/profile');
        }
      } else {
        setMessage('נתוני המשתמש לא התקבלו כראוי.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'שגיאה בהתחברות');
    }
  };


  return (
    <div className="Login-form">
      <img src="https://pilates-house.net/wp-content/uploads/2024/10/Untitled-3-e1729932468250.png" alt="Logo" />
      <h1>התחברות</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>טלפון:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label>סיסמה:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">התחבר</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Login;
