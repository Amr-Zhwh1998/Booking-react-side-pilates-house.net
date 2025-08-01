import React from 'react';
import { useNavigate } from 'react-router-dom';

function RenewSubscription() {
  const navigate = useNavigate();

  const handleContact = () => {
    // נווט לדף צור קשר
    navigate('/contact');
  };

  return (
    <div className="RenewSubscription-page">
      <h1>המינוי שלך פג</h1>
      <p>נראה כי תוקף המנוי שלך עבר , לחדש מנוי נא ליצור קשר עם מלאק</p>
    </div>
  );
}

export default RenewSubscription;
