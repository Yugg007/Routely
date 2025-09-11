import React, { useState } from "react";
import { BackendService } from "../../Utils/Api's/ApiMiddleWare";
import ApiEndpoints from "../../Utils/Api's/ApiEndpoints";


export default function LoginView({ onLogin }) {
    const [mobileNo, setMobileNo] = useState('');
    const [email, setEmail] = useState('Test1@1234');
    const [password, setPassword] = useState('Test@1234');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [forLogin, setForLogin] = useState(true);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        if ((!mobileNo || mobileNo.length !== 10) && !forLogin) {
            setError('Please provide a valid 10-digit mobile number.');
            return;
        }

        if (!email ) {
            setError('Please provide a valid email address.');
            return;
        }

        if (!password || password.length < 6) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        // setLoading(true);
        try {
            const url = forLogin ? ApiEndpoints.login : ApiEndpoints.register;
            const body = forLogin ? { email, password } : { mobileNo, email, password };
            const response = await BackendService(url, body);
            if (response) {
                onLogin(email);
            }
        } catch (err) {
            console.error(err);
            setError('Sign in failed. Please try again.');
        } finally {
            // setLoading(false);
        }
    };

    const handleMobileNoChange = (e) => {
        const value = e.target.value;
        // Allow only digits and limit to 10 characters
        if (/^\d{0,10}$/.test(value)) {
            setMobileNo(value);
        }
    }

    return (
        <main className="routely-card" aria-labelledby="login-heading">
            <h2 id="login-heading" className="routely-title">Welcome back to Routely</h2>

            <form className="routely-form" onSubmit={submit} noValidate>
                {
                    !forLogin &&
                    <label className="routely-field">
                        <span className="routely-fieldLabel">Mobile No</span>
                        <input
                            className="routely-input"
                            type="number"
                            name="mobile"
                            required
                            value={mobileNo}
                            onChange={handleMobileNoChange}
                            placeholder="9876543210"
                            aria-label="Mobile No"
                        />
                    </label>
                }
                <label className="routely-field">
                    <span className="routely-fieldLabel">Email</span>
                    <input
                        className="routely-input"
                        type="email"
                        name="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        aria-label="Email address"
                    />
                </label>


                {/* {
                    !forLogin
                    &&
                    <label className="routely-field">
                        <span className="routely-fieldLabel">First</span>
                        <input
                            className="routely-input"
                            type="email"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            aria-label="Email address"
                        />
                    </label>
                }                 */}

                <label className="routely-field">
                    <span className="routely-fieldLabel">Password</span>
                    <input
                        className="routely-input"
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6+ characters"
                        aria-label="Password"
                    />
                </label>

                {error && (
                    <div className="routely-error" role="alert">
                        {error}
                    </div>
                )}

                <div className="routely-actions">
                    <button className="btn btn-primary" type="submit" disabled={loading} aria-disabled={loading}>
                        {forLogin ? 'Sign in' : 'Create account'}
                    </button>

                    {/* <button type="button" className="btn btn-link" onClick={() => alert('Forgot password flow')}>
            Forgot password?
          </button> */}
                </div>
            </form>

            <footer className="routely-footer">
                <small>
                    {
                        forLogin
                            ?
                            <>New to Routely? <button className="btn btn-inline" onClick={() => setForLogin(false)}>Create an account</button></>
                            :
                            <button className="btn btn-inline" onClick={() => setForLogin(true)}>Already have an account?</button>
                    }
                </small>
            </footer>
        </main>
    );
}
