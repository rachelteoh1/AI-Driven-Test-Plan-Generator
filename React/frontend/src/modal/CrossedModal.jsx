import Lottie from 'react-lottie';
import styled from 'styled-components';
import {COLORS,FONTSIZE, FONTWEIGHT} from '../lib/styles';
import lottieCrossed from '../animation/lottieCrossed.json';


const CenteredDiv = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    min-height: 50vh;
`;

const Title = styled.h1`
    font-size: ${FONTSIZE.lg};
    font-weight: ${FONTWEIGHT.medium};
    color: ${COLORS.black};
`;

const Description = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
    color: ${COLORS.darkGrey};
`;

export default function CrossedModal({ title, description }) {
    return (
        <CenteredDiv>
            <Lottie
                options={{ animationData: lottieCrossed, autoplay: true, loop: false }}
                width={200}
                height={200}
                isClickToPauseDisabled
            />
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
        </CenteredDiv>
    );
}
