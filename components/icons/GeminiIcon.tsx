import React from 'react';

interface IconProps {
    className?: string;
}

export const GeminiIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
        className={className}
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M11.2335 3.00012L2.73047 12.0001L11.2335 21.0001L12.7335 19.5001L6.23347 12.0001L12.7335 4.50012L11.2335 3.00012Z" fill="currentColor"/>
        <path d="M21.2694 3.00012L20.2694 4.50012L16.2694 12.0001L20.2694 19.5001L21.2694 21.0001L22.7694 19.5001L18.7694 12.0001L22.7694 4.50012L21.2694 3.00012Z" fill="currentColor"/>
    </svg>
);