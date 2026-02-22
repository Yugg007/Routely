import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CountdownRedirect = ({ message, redirectUrl }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate(redirectUrl);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate, redirectUrl]);

  return (
    <div style={{ textAlign: "center", marginTop: "80px", fontSize: "24px" }}>
      <p>{message}</p>
      <p>Redirecting you to {redirectUrl} in {countdown} second{countdown !== 1 && "s"}...</p>
    </div>
  );
};

export default CountdownRedirect;
