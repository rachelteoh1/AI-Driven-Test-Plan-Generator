import styled, { css } from "styled-components";
import React from "react";
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../../lib/styles";

// Button variants
const variantStyles = {
  default: css`
    background-color: ${({ theme }) => theme.newChat};
    color: ${({ theme }) => theme.greys.dark};
    &:hover { background-color:  ${({ theme }) => theme.hover}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.greys.dark};
    &:hover { background-color: ${({ theme }) => theme.hover}; }
  `,
};

// Base styled button
const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: left;
  gap: ${SPACING.sm};
  padding: 0 ${SPACING.md};
  height: 2.5rem;
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  ${({ variant = "default" }) => variantStyles[variant]};
  &:disabled { opacity: 0.5; pointer-events: none; }
  &:focus-visible {
    outline: 2px solid ${COLORS.accent};
    outline-offset: 2px;
  }
`;

// Forward ref wrapper
export const Button = React.forwardRef(({ variant, size, ...props }, ref) => (
  <StyledButton ref={ref} variant={variant} {...props} />
));
Button.displayName = "Button";
