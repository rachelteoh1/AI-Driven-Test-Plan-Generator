import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import styled from "styled-components"
import { useNavigate, useLocation } from "react-router-dom"
import { FONTSIZE, FONTWEIGHT, COLORS } from "../lib/styles"
import FormValidation from "../lib/FormValidation"
import TickedModal from '../modal/TickModal';
import useModal from '../modal/useModal';
import Logo from "../assets/keysight.png"
import AuthLayout from "../components/reusable/AuthLayout"

const TextMdSemiBold = styled.p`
    font-size: ${FONTSIZE['3xl']};
    font-weight: ${FONTWEIGHT.bold};
    align-items: center;
`;

const StyledButton = styled.button`
    background-color: ${COLORS.greyblue};
    border: none;
    color: ${COLORS.black};
    height: 60px;
    width: 100%;
    align-items: center;
    cursor: pointer;
    margin: 1rem auto;
    font-weight: ${FONTWEIGHT.medium};
    font-size: ${FONTSIZE.lg};
    font-family: montserrat;
    border-radius: 1rem;
    display: block;
`;

export default function ConfirmPwPage() {
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [values, setValues] = useState({ password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [expired, setExpired] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { showModal, hideModal } = useModal();

    const handleTogglePasswordVisibility = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        const newObj = { ...values, [name]: value };
        setValues(newObj);

        if (submitted) {
            const fieldErrors = FormValidation(newObj);
            setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldErrors[name] }));
        }
    };

    // Handle token and expiry
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get("token");

        if (!token) {
            setExpired(true);
            return;
        }

        try {
            const decoded = atob(token); // Decode base64
            const [email, timestamp] = decoded.split(':');
            const expiryLimit = 60 * 60 * 1000; // 1 hour
            const now = Date.now();

            if (now - Number(timestamp) > expiryLimit) {
                setExpired(true);
            }
        } catch (err) {
            setExpired(true); // Handle malformed token
        }
    }, [location.search]);

    // If expired, show modal and redirect
    useEffect(() => {
        if (expired) {
            showModal({
                modal: (
                    <TickedModal
                        title="Link Expired"
                        description="Your reset link has expired. Please request a new one."
                    />
                ),
            });

            setTimeout(() => {
                hideModal();
                navigate('/resetpw');
            }, 2500);
        }
    }, [expired]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        const formErrors = FormValidation(values);
        if (expired) {
            setErrors({ confirmPassword: "This reset link has expired." });
            return;
        }

        if (Object.keys(formErrors).length === 0) {
            // Update new password to database
            showModal({
                modal: (
                    <TickedModal
                        title="Reset Password Success!"
                        description="Sign in with your new password."
                    />
                ),
            });

            setTimeout(() => {
                hideModal();
            }, 2500);

            setTimeout(() => {
                navigate('/signin');
            }, 2500);
        } else {
            setErrors(formErrors);
        }
    };

    return (
        <AuthLayout>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={Logo} alt="Logo" style={{ width: '50px' }} />
                <TextMdSemiBold>Reset Password</TextMdSemiBold>
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        onChange={handleInput}
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleTogglePasswordVisibility}
                                        onMouseDown={(event) => event.preventDefault()}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="current-password"
                        onChange={handleInput}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleTogglePasswordVisibility}
                                        onMouseDown={(event) => event.preventDefault()}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <StyledButton>Submit</StyledButton>
                </div>
            </form>
        </AuthLayout>
    );
}
