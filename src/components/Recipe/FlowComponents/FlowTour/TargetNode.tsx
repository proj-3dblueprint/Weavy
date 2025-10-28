import { Typography } from '@mui/material';
import { motion } from 'motion/react';
import styled from '@emotion/styled';
import { color } from '@/colors';

const AnimatedContainer = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--Yellow100);
    border-radius: 50%;
    z-index: -1;
    transform-origin: center;
    transform: scale(var(--scale, 1));
  }
`;

interface TargetNodeProps {
  data: {
    number: number;
    visited: boolean;
  };
}

export const TargetNode = (props: TargetNodeProps) => {
  const { number, visited } = props.data;
  const className = `${visited ? 'fade-out-scale' : 'tourFadeIn'}`;

  return (
    <AnimatedContainer
      id={`target-node-${number}`}
      className={className}
      animate={{
        '--scale': [1, 1.15, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: visited ? 0 : Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      <Typography
        variant="body-sm-rg"
        color={color.Black100}
        sx={{
          lineHeight: '28px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {number}
      </Typography>
    </AnimatedContainer>
  );
};
