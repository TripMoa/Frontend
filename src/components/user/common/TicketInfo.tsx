import React, { ReactNode } from 'react';
import styles from './TicketInfo.module.css';

interface TicketInfoProps {
  title?: string;
  fromLabel?: string;
  fromCode?: string;
  fromName?: string;
  toLabel?: string;
  toCode?: string;
  toName?: string;
  tagline?: string;
  customContent?: ReactNode;
}

export const TicketInfo: React.FC<TicketInfoProps> = ({
  title = 'TripMoa',
  fromLabel,
  fromCode,
  fromName,
  toLabel,
  toCode,
  toName,
  tagline,
  customContent
}) => {
  return (
    <>
      <h1 className={styles.logo}>{title}</h1>
      {customContent ? (
        <div className={styles.customContent}>{customContent}</div>
      ) : (
        <div className={styles.flightInfo}>
          {fromCode && toCode ? (
            <>
              <div className={styles.route}>
                <div className={styles.city}>
                  {fromLabel && <span className={styles.label}>{fromLabel}</span>}
                  <span className={styles.code}>{fromCode}</span>
                  {fromName && <span className={styles.name}>{fromName}</span>}
                </div>
                <div className={styles.plane}>✈</div>
                <div className={styles.city}>
                  {toLabel && <span className={styles.label}>{toLabel}</span>}
                  <span className={styles.code}>{toCode}</span>
                  {toName && <span className={styles.name}>{toName}</span>}
                </div>
              </div>
              {tagline && <div className={styles.tagline}>{tagline}</div>}
            </>
          ) : null}
        </div>
      )}
    </>
  );
};