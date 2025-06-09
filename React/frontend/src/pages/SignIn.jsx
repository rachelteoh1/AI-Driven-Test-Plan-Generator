import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import styled from "styled-components"
import { Link, useNavigate } from "react-router-dom"
import {FONTSIZE,FONTWEIGHT, COLORS } from "../lib/styles"
import FormValidation from "../lib/FormValidation"
import UserStatusContext from '../lib/UserStatusContext';
import TickedModal from '../modal/TickModal';
import CrossedModal from '../modal/CrossedModal';
import useModal from '../modal/useModal';
import Logo from "../assets/keysight.png"
import AuthLayout from "../components/reusable/AuthLayout"
import { useSignIn } from '../hook/useAuth';




const TextMdSemiBold = styled.p`
    font-size: ${FONTSIZE['3xl']};
    font-weight: ${FONTWEIGHT.bold};
    align-items: center;
`;

const TextSmRegular = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
    
`;

const StyledLink = styled(Link)`
    text-decoration: none;
    margin: 1rem 0;
    display: block;
    color: ${COLORS.textblue};
`;

const StyledButton = styled.button`
    background-color: ${COLORS.greyblue};
    border: none;
    color: ${COLORS.black};
    height: 60px;
    width: 100%;
    align-items: center;
    cursor: pointer;
  
    margin: 0rem auto; /* Center horizontally */
    font-weight: ${FONTWEIGHT.medium};
    font-size: ${FONTSIZE.lg};
    border-radius: 1rem;
    display: block; /* Important for margin auto to work */
`;

const RowContainer = styled.div`
 display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
`;

export default function SignInPage() {
    const [submitted, setSubmitted] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isFormValid,setIsFormValid] = useState(false);

    const navigate = useNavigate();
    const { setUserStatus, isLogin } = useContext(UserStatusContext);

    const signInMutation = useSignIn();
    const { showModal,hideModal } = useModal();

    const handleTogglePasswordVisibility = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    const [values, setValues] = useState({
        emailTel: '',
        password: '',
    });

    const [errors, setErrors] = useState({});

    const handleInput = (e) => {
        const { name, value } = e.target;
        setValues((prevValues) => ({ ...prevValues, [name]: value }));
        if (submitted) {
            const fieldErrors = FormValidation({ ...values, [name]: value });
            setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldErrors[name] }));
        }
        const formErrors = FormValidation(values);
        setIsFormValid(Object.keys(formErrors).length===0)
    };

    
    const handleSubmit = async (e) => {
  e.preventDefault();

  const formErrors = FormValidation(values);
  

  // Don't attempt login if there are validation errors
  if (Object.keys(formErrors).length > 0) {
    setIsFormValid(false);
    return;
  }
  setIsFormValid(true);

  signInMutation.mutate(
    { username: values.emailTel , password: values.password},
    {
      onSuccess: () => {
        setUserStatus((prevStatus) => ({
          ...prevStatus,
          isLogin: true,
        }));

        showModal({
          modal: (
            <TickedModal
              title="Sign In Successfully!"
              description="Redirecting you to KeysightGPT Chatbot..."
              hideModal={hideModal}
            />
          ),
        });

        setTimeout(() => {
          hideModal();
          navigate("/home");
        }, 1500);
      },

      onError: (error) => {
        alert("Login failed: " + error.message);
        showModal({
          modal: (
            <CrossedModal
              title="Sign In Failed!"
              description="Please try it again!"
              hideModal={hideModal}
            />
          ),
        });
      },
    }
  );
  
};




    return (
     
           
           
        
            <AuthLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <img src={Logo} alt="Logo" style={{ width: '50px' }} />
              <TextMdSemiBold>Sign In</TextMdSemiBold>
                 </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ paddingLeft: '3rem', paddingRight: '3rem'}}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="emailTel"
                        autoComplete="email tel"
                        autoFocus
                        onChange={handleInput}
                        error={!!errors.emailTel}
                        helperText={errors.emailTel}
                    />

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

                    <StyledLink to="/resetpw"><TextSmRegular>Forgot password?</TextSmRegular></StyledLink>
                    <StyledButton type='submit' disabled={isFormValid}>Submit</StyledButton></div>
                </form>

                <RowContainer>
                    <TextSmRegular>Don&apos;t have an account?</TextSmRegular>
                    <StyledLink to="/signup"><TextSmRegular>Sign Up</TextSmRegular></StyledLink>
                </RowContainer>
            </AuthLayout>
     
    );
}
