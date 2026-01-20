import React, { type ReactNode } from 'react';
import styles from './TicketLayout.module.css';

interface TicketLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  height?: string;
}

export const TicketLayout: React.FC<TicketLayoutProps> = ({ 
  leftContent, 
  rightContent,
  height = '440px'
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.ticketWrapper} style={{ height }}>
        <div className={styles.ticketLeft}>
          {leftContent}
        </div>
        <div className={styles.ticketRight}>
          {rightContent}
        </div>
      </div>
      
      {/* 뭉실뭉실 구름 1 */}
      <svg className={styles.cloud1} viewBox="0 0 250 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M 35,70 
                 Q 30,50 45,45
                 Q 50,30 70,28
                 Q 85,26 95,35
                 Q 110,20 130,22
                 Q 145,24 155,35
                 Q 175,30 190,42
                 Q 205,42 210,58
                 Q 215,70 205,82
                 Q 195,90 180,90
                 L 50,90
                 Q 35,90 30,78
                 Q 28,70 35,70 Z"
              fill="white"
              stroke="var(--border-color)"
              strokeWidth="2"
        />
      </svg>

      {/* 뭉실뭉실 구름 2 */}
      <svg className={styles.cloud2} viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M 30,65
                 Q 25,48 40,42
                 Q 48,28 65,26
                 Q 78,25 88,32
                 Q 100,20 118,22
                 Q 135,24 145,35
                 Q 160,28 175,38
                 Q 190,42 192,55
                 Q 195,68 185,78
                 Q 175,85 160,85
                 L 45,85
                 Q 30,85 27,72
                 Q 25,65 30,65 Z"
              fill="white"
              stroke="var(--border-color)"
              strokeWidth="2"
        />
      </svg>
    </div>
  );
};