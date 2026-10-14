import { useEffect } from 'react';

function HomePage() {
  useEffect(() => {
    window.location.replace('/bomul.html');
  }, []);

  return null;
}

export default HomePage;
