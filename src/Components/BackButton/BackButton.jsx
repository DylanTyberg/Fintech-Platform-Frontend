import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

const BackButton = ({ to, label = "Back" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); 
    }
  };

  return (
    <button className="back-button" onClick={handleBack}>
      <span className="back-arrow">←</span>
      {label}
    </button>
  );
};

export default BackButton;