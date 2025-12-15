export default function Validation(values) {
    const errors = {};

    // email tel
    if ('emailTel' in values) {
        const emailTelPattern =
            /^(?:[\p{L}\p{M}\p{N}\p{P}\p{S}@._%+-]{1,256}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}|(?:\+?\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})$/u;

        if (values.emailTel === '') {
            errors.emailTel = 'Email address is required';
        } else if (!emailTelPattern.test(values.emailTel)) {
            errors.emailTel = 'Please enter a valid email address.';
        }
    }

    // password
    if ('password' in values) {
        if (values.password === '') {
            errors.password = 'Password is required.';
        } else if (values.password.length < 8) {
            errors.password = 'Password should be at least eight characters long.';
        } else if (!/[A-Z]/.test(values.password)) {
            errors.password = 'Password should contain at least one uppercase letter.';
        } else if (!/[a-z]/.test(values.password)) {
            errors.password = 'Password should contain at least one lowercase letter.';
        } else if (!/\d/.test(values.password)) {
            errors.password = 'Password should contain at least one digit.';
        } else if (!/[@$!%*?&]/.test(values.password)) {
            errors.password = 'Password should contain at least one special character: @$!%*?&';
        } else if (values.password.length > 64) {
            errors.password = 'Password cannot exceed 64 characters.';
        }
    }

    // confirm password
    if ('confirmPassword' in values) {
        if (values.confirmPassword === '') {
            errors.confirmPassword = 'Please confirm your password.';
        } else if (values.confirmPassword !== values.password) {
            errors.confirmPassword = 'Passwords do not match.';
        }
    }

    return errors;
}
