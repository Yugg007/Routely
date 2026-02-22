import React, { useEffect, useState } from "react";
import { BackendService } from "../../utils/ApiConfig/ApiMiddleWare"; 
import ApiEndpoints from "../../utils/ApiConfig/ApiEndpoints";
import { Eye, EyeOff } from "lucide-react";
import './Profile.css';
import { setAuthSession } from "../../store/authCacheSlice";
import { useDispatch } from "react-redux";

export default function LoginView() {
    const dispatch = useDispatch();
    const [name, setName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [email, setEmail] = useState("Test1@gmail.com");
    const [password, setPassword] = useState("Test@1234");
    const [showPassword, setShowPassword] = useState(false);
    const [reEnterPassword, setReEnterPassword] = useState("Test@1234");
    const [showReEnterPassword, setShowReEnterPassword] = useState(false);
    const [isDriver, setIsDriver] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [forLogin, setForLogin] = useState(true);

    useEffect(() => {
        if (name || email || password || reEnterPassword || isDriver || mobileNo) {
            setError("");
        }
    }, [name, email, password, reEnterPassword, isDriver, mobileNo])

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!forLogin && !name) {
            setError("Please provide your full name.")
            return;
        }

        if (!forLogin && (!mobileNo || mobileNo.length !== 10)) {
            setError("Please provide a valid 10-digit mobile number.");
            return;
        }
        if (!testEmail(email)) {
            setError("Please provide a valid email address.");
            return;
        }
        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (!forLogin && password !== reEnterPassword) {
            setError("Both password should match.");
            return;
        }

        try {
            setLoading(true);
            const url = forLogin ? ApiEndpoints.login : ApiEndpoints.register;
            const body = forLogin ? { email, password } : { mobileNo, email, password, name, isDriver };
            console.log("Body for auth - ", body);
            const response = await BackendService(url, body);
            if (response.data.authStatus) {
                console.log("Auth response - ", response.data);
                dispatch(setAuthSession(response.data));
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Sign in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const testEmail = (value) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    const handleMobileNoChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,10}$/.test(value)) setMobileNo(value);
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        if (typeof value === 'string') {
            setName(value);
        }
    }

    return (
        <div className="auth-modern-container">
            <div className="auth-modern-left">
                <div className="auth-modern-brand">
                    <h1>Routely</h1>
                    <p>{forLogin ? "Sign in to your account" : "Create your Routely account"}</p>
                </div>
                <form className="auth-modern-form" onSubmit={submit}>
                    {!forLogin && (
                        <div className="form-field">
                            <label>Your Name</label>
                            <input
                                type="text"
                                placeholder="John Woe"
                                value={name}
                                onChange={handleNameChange}
                            />
                        </div>
                    )}
                    {!forLogin && (
                        <div className="form-field">
                            <label>Mobile Number(10 digit)</label>
                            <input
                                type="text"
                                placeholder="9876543210"
                                value={mobileNo}
                                onChange={handleMobileNoChange}
                            />
                        </div>
                    )}

                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-field password-field">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="6+ characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {!forLogin && (
                        <>
                            <div className="form-field password-field">
                                <label>Re-Enter Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showReEnterPassword ? "text" : "password"}
                                        placeholder="6+ characters"
                                        value={reEnterPassword}
                                        onChange={(e) => setReEnterPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowReEnterPassword((prev) => !prev)}
                                    >
                                        {showReEnterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="form-field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={isDriver}
                                        onChange={(e) => setIsDriver(e.target.checked)}
                                    />
                                    <span>I am registering as <a href="/terms" target="_blank">Driver</a></span>
                                </label>
                            </div>
                        </>
                    )}

                    {error && <div className="form-error">{error}</div>}

                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Please wait…" : forLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="auth-switch">
                    {forLogin ? (
                        <>
                            New to Routely?{" "}
                            <button onClick={() => setForLogin(false)} className="btn-inline">
                                Create account
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setForLogin(true)} className="btn-inline">
                            Already have an account? Sign in
                        </button>
                    )}
                </div>
            </div>

            <div className="auth-modern-right">
                {/* Illustration / Graphic */}
            </div>
        </div>
    );
}
