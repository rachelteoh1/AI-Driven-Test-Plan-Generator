// ResetPwPage.jsx
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FONTSIZE, FONTWEIGHT, COLORS } from "../lib/styles";
import FormValidation from "../lib/FormValidation";
import TickedModal from '../modal/TickModal';
import useModal from '../modal/useModal';
import Logo from "../assets/keysight.png";
import AuthLayout from "../components/reusable/AuthLayout";
import { useRequestResetPassword } from '../hook/useUser';
import emailjs from '@emailjs/browser';

const TextMdSemiBold = styled.p`
    font-size: ${FONTSIZE['3xl']};
    font-weight: ${FONTWEIGHT.bold};
    align-items: center;
`;

const TextSmRegular = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
`;

const StyledButton = styled.button`
    background-color: ${COLORS.greyblue};
    border: none;
    color: ${COLORS.black};
    height: 60px;
    width: 400px;
    align-items: center;
    cursor: pointer;
    margin: 0rem auto;
    font-weight: ${FONTWEIGHT.medium};
    font-size: ${FONTSIZE.lg};
    border-radius: 1rem;
    display: block;
`;

const RowContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.8rem;
`;

export default function ResetPwPage() {
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const { showModal, hideModal } = useModal();
    const [values, setValues] = useState({ emailTel: '' });
    const [errors, setErrors] = useState({});
    const { mutate: requestResetPassword } = useRequestResetPassword();

    const handleInput = (e) => {
        const { name, value } = e.target;
        setValues((prevValues) => ({ ...prevValues, [name]: value }));
        if (submitted) {
            const fieldErrors = FormValidation({ ...values, [name]: value });
            setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldErrors[name] }));
        }
    };

    const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);
  const formErrors = FormValidation(values);

  if (Object.keys(formErrors).length === 0) {
    requestResetPassword(
  { email: values.emailTel },
  {
    onSuccess: async (data) => {
      const resetLink = data.reset_link;

      // Send email using EmailJS
      try {
        await emailjs.send(
          'service_otokln5',
          'template_dbbgxfj',
          {
            email: values.emailTel,
            link: resetLink,
          },
          '2WnBmpMoHv0nHNSkw'
        );

        showModal({
          modal: (
            <TickedModal
              title="Reset Link Sent!"
              description="Please check your email to reset your password."
            />
          ),
        });

        setTimeout(() => {
          hideModal();
          navigate('/signin');
        }, 3000);
      } catch (error) {
        console.error("EmailJS error:", error);
        setErrors({ emailTel: "Failed to send reset email." });
      }
    },
    onError: () => {
      setErrors({ emailTel: "Email not found or server error." });
    },
  }
);

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
            <RowContainer>
                <TextSmRegular>We will email you a link to reset your password.</TextSmRegular>
            </RowContainer>
            <form onSubmit={handleSubmit}>
                <div style={{ maxWidth: '35rem', padding: '3rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <TextField
                        required fullWidth id="email" label="Email Address" name="emailTel"
                        autoComplete="email tel" autoFocus
                        onChange={handleInput}
                        error={!!errors.emailTel}
                        helperText={errors.emailTel}
                    />
                    <StyledButton>Submit</StyledButton>
                </div>
            </form>
        </AuthLayout>
    );
}
