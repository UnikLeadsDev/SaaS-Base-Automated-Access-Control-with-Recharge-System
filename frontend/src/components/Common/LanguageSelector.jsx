import React from 'react';
import { i18n } from '../../utils/i18n';

const LanguageSelector = () => {
  const handleLanguageChange = (e) => {
    i18n.setLanguage(e.target.value);
  };

  return (
    <select 
      value={i18n.getCurrentLanguage()} 
      onChange={handleLanguageChange}
      className="px-3 py-1 border rounded text-sm"
    >
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
    </select>
  );
};

export default LanguageSelector;