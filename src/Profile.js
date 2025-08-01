import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainingHours, setTrainingHours] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [appointmentsCount, setAppointmentsCount] = useState(0); // נוסיף state לכמות הקביעות
  const [appointments, setAppointments] = useState([]); // State לקביעות
  const [isTableVisible, setIsTableVisible] = useState(false); // state כדי לעקוב אם הטבלה מוצגת
  const [isSubmitting, setIsSubmitting] = useState(false); // הגדרת state
  const [notifications, setNotifications] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  // טעינת נתוני משתמש ושעות אימון
  useEffect(() => {

    const fetchNotifications = async () => {
      try {
          const response = await fetch('https://calendar.pilates-house.net/wp-json/malak/v1/notifications');
          const data = await response.json();
          setNotifications(data.notifications || []); // שמור את ההתראות
      } catch (error) {
          console.error('Error fetching notifications:', error);
      }
  };
  fetchNotifications(); 



    const deleteOldAppointments = async () => {
      const response = await fetch('https://calendar.pilates-house.net/wp-json/malak/v1/delete-old-appointments', {
          method: 'POST',
      });
      const data = await response.json();
      /*if (data.success) {
          console.log('הקביעות הישנות נמחקו');
      } else {
          console.log('משהו השתבש');
      }*/
  };

  deleteOldAppointments();

    const fetchData = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData); // עדכון נתוני משתמש מ-localStorage
        await fetchUserData(userData.id); // רענון נתונים מהשרת
        await fetchAppointmentsCount(userData.id); // קריאה ל-API לקבלת מספר הקביעות
        await fetchUserAppointments(userData.id); // טעינת קביעות

      }
      await fetchTrainingHours(); // טעינת שעות אימון
      setLoading(false); // סימון סיום טעינה
    };

    fetchData();

    // הגדרת רענון נתוני משתמש כל דקה
    const interval = setInterval(() => {
      if (user) {
        fetchUserData(user.id); // רענון נתוני משתמש
      }
    }, 60000);

    return () => clearInterval(interval); // ניקוי ה-interval
  }, []);

  
  const handleDeleteAppointment = async (appointment) => {
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את הקביעה בתאריך ${new Date(appointment.training_date).toLocaleDateString()} בשעה ${new Date(`${appointment.training_date}T${appointment.training_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}?`
    );
  
    if (confirmed) {
      try {
        const response = await axios.post('https://calendar.pilates-house.net/wp-json/malak/v1/delete-appointment', {
          user_id: user.id,
          training_date: appointment.training_date,
          training_time: appointment.training_time,
        });
  
        if (response.data.success) {
          alert('הקביעה נמחקה בהצלחה!');
          
          // עדכון הנתונים (ניקוי הקביעות וטעינתן מחדש)
          await fetchAppointmentsCount(user.id);  // עדכון מספר הקביעות
          await fetchTrainingHours();  // עדכון שעות האימון
          await fetchUserAppointments(user.id);  // עדכון טבלת הקביעות

        } else {
          alert('שגיאה במחיקת הקביעה');
        }
      } catch (error) {
        console.error('שגיאה במחיקת הקביעה:', error);
        alert('שגיאה במחיקת הקביעה');
      }
    }
  };

  
  const fetchUserAppointments = async (userId) => {
    try {
      const response = await axios.get(
        `https://calendar.pilates-house.net/wp-json/malak/v1/user-appointments-list/${userId}`
      );
      setAppointments(response.data); // עדכון State
    } catch (error) {
      console.error('שגיאה בהבאת קביעות:', error);
    }
  };
  

  const fetchAppointmentsCount = async (userId) => {
    try {
      const response = await axios.get(
        `https://calendar.pilates-house.net/wp-json/malak/v1/user-appointments/${userId}`
      );
      setAppointmentsCount(response.data.appointments_count); // עדכון כמות הקביעות ב-state
    } catch (error) {
      console.error('שגיאה בהבאת מספר הקביעות:', error);
    }
  };

  // קריאה לשרת לטעינת שעות אימון
  const fetchTrainingHours = async () => {
    try {
      const response = await axios.get(
        'https://calendar.pilates-house.net/wp-json/malak/v1/training-hours'
      );
      setTrainingHours(response.data); // שמירת השעות ב-State
      //console.log(response.data)
    } catch (error) {
      console.error('שגיאה בהבאת שעות אימון:', error);
    }
  };

  // קריאה לשרת לטעינת נתוני משתמש
  const fetchUserData = async (userId) => {
    setRefreshing(true); // הצגת חיווי רענון
    try {
      const response = await axios.get(
        `https://calendar.pilates-house.net/wp-json/malak/v1/user/${userId}`
      );
      const updatedUser = response.data;

      // עדכון נתוני משתמש ב-LocalStorage וב-State
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser); // עדכון state עם נתוני המשתמש העדכניים
    } catch (error) {
      console.error('שגיאה בעדכון נתוני המשתמש:', error);
    } finally {
      setRefreshing(false); // הסרת חיווי רענון
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const handleBooking = async (training) => {
    if (isSubmitting) return; // מניעת שליחה כפולה
    setIsSubmitting(true); // הפעלת מצב של שליחה
  
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך לקבוע תור לאימון בתאריך ${training.fullDate.toLocaleDateString()} בשעה ${training.fullDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}?`
    );
  
    if (confirmed) {
      try {
        const response = await axios.post(
          'https://calendar.pilates-house.net/wp-json/malak/v1/book-appointment',
          {
            user_id: user.id,
            training_date: training.training_date,
            training_time: training.training_time,
          }
        );
  
        if (response.data.success) {
          await fetchTrainingHours();
          await fetchAppointmentsCount(user.id);
          await fetchUserAppointments(user.id);
  
          alert('הקביעה בוצעה בהצלחה!');
        } else {
          alert('שגיאה בקביעת התור, אנא נסה שוב.');
        }
      } catch (error) {
        if (error.response && error.response.data.code === 'appointment_exists') {
          alert('כבר קבעת תור לאימון בתאריך ובשעה הזו');
        } else {
          console.error('שגיאה בקביעת תור:', error);
          alert('שגיאה בקביעת התור');
        }
      }
    }
    setIsSubmitting(false); // שחרור הכפתור בסיום
  };
  
  
  

  // פונקציה שתבדוק אם המשתמש קבע את כל הימים המותרים לו
  const isAllTrainingDaysBooked = () => {

    return Number(appointmentsCount) >= Number(user.training_days);
  };
  



  const groupByDate = () => {
    const now = new Date();

    const upcomingTrainings = trainingHours.filter((training) => {
      const trainingDate = new Date(`${training.training_date}T${training.training_time}`);
      return trainingDate >= now;
    });

    const grouped = upcomingTrainings.reduce((acc, training) => {
      const trainingDate = new Date(training.training_date);
      const trainingTime = training.training_time;
      const fullDate = new Date(`${trainingDate.toISOString().split('T')[0]}T${trainingTime}`);
      const dateString = fullDate.toLocaleDateString();

      const existingGroup = acc.find((group) => group.date === dateString);
      if (existingGroup) {
        existingGroup.trainings.push({ ...training, fullDate });
      } else {
        acc.push({
          date: dateString,
          fullDate: trainingDate,
          trainings: [{ ...training, fullDate }],
        });
      }

      return acc;
    }, []);

    return grouped.sort((a, b) => a.fullDate - b.fullDate).map((group) => {
      group.trainings.sort((a, b) => a.fullDate - b.fullDate);
      return group;
    });
  };

  const groupedTrainingHours = groupByDate();
  const toggleTableVisibility = () => {
    setIsTableVisible(prevState => !prevState); // משנה את מצב הצגת הטבלה
  };
  const handleOutsideClick = (e) => {
    // אם הקלקה התבצעה מחוץ לטבלה, נסגור אותה
    if (e.target.className === 'overlay') {
      setIsTableVisible(false);
    }
  };
  const handleCloseTable = () => {
    setIsTableVisible(false); // כשהכפתור נלחץ, אנחנו מגדירים את המצב ל- false, כלומר הטבלה תוסתר.
  };





  
  

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };
  



  return (
    <div className="Profile-page">

      <div className="hero-section">
        <div className="profile-header">
          <button className="logout-button" onClick={handleLogout}>
            <img
              src="https://calendar.pilates-house.net/wp-content/uploads/2024/11/logout.png"
              alt="Logout"
              className="logout-icon"
            />
          </button>
          <div className="notifications-section">
      <button className="notifications-button" onClick={togglePopup}>
        🔔 התראות
      </button>

      {isPopupVisible && (
        <div className="notifications-popup">
          <div className="popup-header">
            <h3>התראות</h3>
            <button className="close-button" onClick={togglePopup}>X</button>
          </div>
          <div className="popup-content">
  {notifications.length > 0 ? (
    <ul className="notifications-list">
      {notifications.map((notification, index) => (
        <li key={index} className="notification-item">
          <p className="notification-text">{notification.notification_text}</p>
          <span className="notification-date">
            {new Date(notification.created_at).toLocaleString('he-IL')}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="no-notifications">אין התראות חדשות</p> // במצב שאין התראות
  )}
</div>

        </div>
      )}
    </div>
        </div>
        <h1 className="greeting">היי {user.full_name}</h1>
        <div className="user-info">
          <p className="user-params">
            <strong>מנוי עד</strong> <br /> {user.end_date}
          </p>
          <p className="user-params">
            <strong>סוג</strong> <br /> {user.training_type}
          </p>
          <p className="user-params">
          <strong>מותר לקבוע (ימים)</strong> <br /> {user.training_days}
          </p>
          <p className="user-params">
            <strong>ימים נקבעו</strong> <br /> {appointmentsCount}
          </p>
        </div>
        <div className='my-appointments-section'>
        <button className='my-appointments-btn' onClick={toggleTableVisibility}>&#x1F4C5; האימונים שלי</button>
        </div>
      </div>

      {isTableVisible && <div className="overlay" onClick={handleOutsideClick}></div>}

      {/* הצגת הטבלה אם ה-state מציין שהיא צריכה להיות מוצגת */}
      {isTableVisible && (
        <div className="appointments-section">
                {isTableVisible && (
        <div className="close-button">
          <button onClick={handleCloseTable}>
            X
          </button>
        </div>
      )}
          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>שעה</th>
                <th>מחיקה</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment, index) => {
                const appointmentDateTime = new Date(`${appointment.training_date}T${appointment.training_time}`);
                const currentTime = new Date();
                const timeDiff = appointmentDateTime - currentTime;
                const hoursLeft = timeDiff / (1000 * 60 * 60);

                const isDeleteDisabled = hoursLeft < 10;

                return (
                  <tr key={`${appointment.training_date}-${appointment.training_time}-${index}`}>
                    <td>{new Date(appointment.training_date).toLocaleDateString()}</td>
                    <td>{new Date(`${appointment.training_date}T${appointment.training_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteAppointment(appointment)}
                        disabled={isDeleteDisabled}
                        style={{
                          cursor: isDeleteDisabled ? 'not-allowed' : 'pointer',
                          backgroundColor: isDeleteDisabled ? '#d3d3d3' : '#d96060',
                          color: isDeleteDisabled ? '#a1a1a1' : 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '5px',
                        }}
                      >
                        מחק
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}



      {refreshing && <p>מרענן נתוני משתמש...</p>}

      {isAllTrainingDaysBooked() ? (
        <div className="no-more-appointments">
            <p>.הגעת למכסה הקביעות שלך. לא ניתן לקבוע יותר אימונים</p>
        </div>
      ) : (
<div className="Training-hours">
  <div className="dates-slider">
    {groupedTrainingHours.map((group) => {
      const dayOfWeek = new Date(group.fullDate).toLocaleDateString('he-IL', { weekday: 'long' });
      return (
        <div key={group.date} className="date-item">
          <div className="date-header">
            <h4 className="day-view">{dayOfWeek}</h4>
            <h5 className="date-view">{group.date}</h5>
          </div>
          <div className="hours-list">
            {group.trainings.map((training) => {
              const isTrainingTypeMatch = training.training_type === user.training_type;
              const isAfterEndDate = new Date(training.training_date) > new Date(user.end_date);
              const isFullyBooked = Number(training.current_participants) >= Number(training.max_participants);
              const now = new Date();
              const isPastCurrentTime =
                training.fullDate.toDateString() === now.toDateString() && training.fullDate < now;

              let buttonClass = 'training-button';
              let buttonText = '';

              if (isAfterEndDate) {
                buttonClass += ' expired';
                buttonText = 'לא זמין';
              } else if (isPastCurrentTime) {
                buttonClass += ' unavailable';
                buttonText = 'לא זמין';
              } else if (isFullyBooked && !isTrainingTypeMatch) {
                buttonClass += ' disabled';
                buttonText = `${training.training_type} (${training.training_time.slice(0, 5)})`;
              } else if (isFullyBooked) {
                buttonClass += ' unavailable';
                buttonText = 'מלא';
              }               else if (isTrainingTypeMatch) {
                buttonClass += ' available';
                buttonText = training.fullDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
              } else {
                buttonClass += ' disabled';
                buttonText = `${training.training_type} (${training.training_time.slice(0, 5)})`;
              }

              return (
                <button
                  key={training.id}
                  className={buttonClass}
                  disabled={isAfterEndDate || isFullyBooked || !isTrainingTypeMatch || isPastCurrentTime || user.training_days <= 0}
                  onClick={() => handleBooking(training)}
                >
                  {buttonText}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
</div>

      )}
    </div>
  );
}

export default Profile;
