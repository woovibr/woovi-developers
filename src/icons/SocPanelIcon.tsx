import React from 'react';

type Props = {
  size: number;
  viewBox?: string;
};

const SocPanelIcon = ({ size, viewBox }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      enableBackground: `new ${viewBox}`,
    }}
    viewBox={viewBox}
    height={size}
  >
    <path
      d="M269.9 197.9 220.3 229l-105.8 41.5h-14.1L188 55l14.5 11.1 66.6 99.3z"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        fill: '#ff3600',
      }}
    />
    <path
      d="m188 55-2.8-12.6L110 11.3 78.9 37.2 10.7 216.4l5.2 19.3 20 15.5 37 14.1 27.5 5.2z"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        fill: '#0063ff',
      }}
    />
    <path
      d="M114.7 3.6c-5.3-.2-10.5.8-15.4 2.7-4.9 1.9-9.4 4.8-13.1 8.5-3.7 3.7-6.7 8.1-8.7 13L6.4 203.9c-3.7 9.1-3.7 19.4-.1 28.5C10 241.6 17 249 26 253.1l44.2 20.4c8.6 4 18 6.1 27.5 6.3s18.9-1.6 27.7-5.2L256 220.8c2.9-1.2 5.6-2.7 8.1-4.6 1.9-1.4 3.8-3 5.4-4.8 3.8-4.1 6.7-8.9 8.4-14.1 1.7-5.3 2.3-10.8 1.7-16.3-.6-5.5-2.4-10.8-5.3-15.5L208.1 56.1c-7-11.6-17.4-20.8-29.7-26.5L129.9 7.2c-4.8-2.2-9.9-3.4-15.2-3.6zM106 23.4c2.6-1 5.4-1.5 8.1-1.4 2.8.1 5.5.7 8 1.9l48.4 22.4c2.9 1.3 5.6 2.9 8.2 4.7l-85 210.1c-5.5-.6-10.8-2.1-15.8-4.4l-44.2-20.4c-4.7-2.2-8.4-6.1-10.3-10.8-1.9-4.7-1.9-10 0-14.8l71.2-176c1-2.5 2.6-4.8 4.5-6.8 2-1.9 4.3-3.5 6.9-4.5zm8.5 235.6 78.1-193 66 108.9c1.1 1.7 1.8 3.6 2.3 5.6.2.8.3 1.6.4 2.5.3 2.9 0 5.7-.9 8.5-.9 2.7-2.4 5.2-4.4 7.4a20.5 20.5 0 0 1-5 3.9c-.7.4-1.4.7-2.1 1l-130.6 53.9c-1.2.5-2.5.9-3.8 1.3z"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        fill: '#010005',
      }}
    />
  </svg>
);

SocPanelIcon.defaultProps = {
  viewBox: '0 0 283.5 283.5',
  size: 24,
};

export default SocPanelIcon;
