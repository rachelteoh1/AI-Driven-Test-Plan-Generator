
import * as React from 'react';
import styled from 'styled-components';
import {Logo} from "../components/reusable/Logo"
import AuthLayout from "../components/reusable/AuthLayout"
import { useNavigate } from "react-router-dom"
import { COLORS, FONTSIZE, FONTWEIGHT,SPACING } from "../lib/styles"

export default function WelcomePage() {
  const navigate = useNavigate()

  // Button styles that can be reused
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
    font-family: montserrat;
    border-radius: 1rem;
    display: block; /* Important for margin auto to work */
     &:hover {
        background-color: ${COLORS.lightblue}; /* Replace with desired hover color */
    }
`;

  return (
    <AuthLayout showCloseButton={true}>
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xl
      }}>
        <div>
          <p style={{
            color: COLORS.black,
            fontSize: FONTSIZE['2xl'],
            fontWeight: FONTWEIGHT.bold,
            marginTop: '-0.5rem',
            marginBottom: '0.5rem'
          }}>
            Welcome to
          </p>
          <Logo text="KeysightGPT" size="lg" />
        </div>

       
          <StyledButton
            onClick={() => navigate("/signup")}
           
          >
            Sign Up
          </StyledButton>
          <StyledButton
            onClick={() => navigate("/signin")}
            style={{ marginBottom: SPACING.xl }} 
            
           
          >
            Sign In
          </StyledButton>
      
          
        </div>
      
    </AuthLayout>
  )
}