import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">404</h1>
        <p className="text-base text-black/60 mb-6">Oops! Page not found</p>
        <a href="/" className="inline-block border border-black/10 px-4 py-2 rounded-md hover:bg-black hover:text-white transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;