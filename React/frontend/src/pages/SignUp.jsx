import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { FONTSIZE, FONTWEIGHT, COLORS } from "../lib/styles";
import FormValidation from "../lib/FormValidation";
import TickedModal from "../modal/TickModal";
import CrossedModal from "../modal/CrossedModal";
import useModal from "../modal/useModal";
import Logo from "../assets/keysight.png";
import AuthLayout from "../components/reusable/AuthLayout";
import { useSignUp } from "../hook/useAuth";

const TextMdSemiBold = styled.p`
  font-size: ${FONTSIZE["3xl"]};
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
  margin: 1rem auto; /* Center horizontally */
  font-weight: ${FONTWEIGHT.medium};
  font-size: ${FONTSIZE.lg};
  border-radius: 1rem;
  display: block; /* Important for margin auto to work */
  &:disabled {
    background-color: #ccc;
    color: #666;
    cursor: not-allowed;
  }
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
  const [values, setValues] = useState({
    emailTel: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const signUpMutation = useSignUp();
  const { showModal, hideModal } = useModal();
  const [isFormValid, setIsFormValid] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const [errors, setErrors] = useState({});

  const handleInput = (e) => {
    const { name, value } = e.target;
    const newObj = { ...values, [e.target.name]: e.target.value };
    setValues(newObj);
    if (submitted) {
      const fieldErrors = FormValidation({ ...values, [name]: value });
      setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldErrors[name] }));
    }
    const formErrors = FormValidation(values);
    setIsFormValid(Object.keys(formErrors).length === 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const formErrors = FormValidation(values);

    if (Object.keys(formErrors).length > 0) {
      setIsFormValid(false);
      return;
    }
    setIsFormValid(true);

        signUpMutation.mutate(
        {
            email: values.emailTel,
            password: values.password,
        },
        {
            onSuccess: () => {
                showModal({
                    modal: (
                        <TickedModal
                            title="Sign Up Successfully!"
                            description="Please Sign In now using your credentials that you've just signed in"
                            hideModal={hideModal}
                        />
                    ),
                });
                setTimeout(() => {
                    hideModal();
                    navigate('/signin');
                }, 1000);
            },
            onError: (error) => {
              const msg = error.response?.data?.detail || "Sign Up failed";
               // alert("Sign Up failed: " + error.message);
                showModal({
                    modal: (
                        <CrossedModal
                            title="Sign Up Failed!"
                            description={msg}
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img src={Logo} alt="Logo" style={{ width: "50px" }} />
        <TextMdSemiBold>Sign Up</TextMdSemiBold>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ paddingLeft: "3rem", paddingRight: "3rem" }}>
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
            type={showPassword ? "text" : "password"}
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
            type={showPassword ? "text" : "password"}
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

          <StyledButton type="submit" disabled={isFormValid}>
            Submit
          </StyledButton>
        </div>
      </form>

      <RowContainer>
        <TextSmRegular>Already have an account?</TextSmRegular>
        <StyledLink to="/signin">
          <TextSmRegular>Sign In</TextSmRegular>
        </StyledLink>
      </RowContainer>
    </AuthLayout>
  );
}
