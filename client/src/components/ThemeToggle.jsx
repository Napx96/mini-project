import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <button className="btn btn-outline-light" onClick={toggleTheme}>
      <Sun className="icon" />
    </button>
  );
}
