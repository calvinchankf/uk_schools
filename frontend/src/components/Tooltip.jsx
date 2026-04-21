import React, { useState, useRef } from 'react';
import './Tooltip.css';

/**
 * Inline tooltip triggered by hovering the ⓘ icon next to a label.
 *
 * Props:
 *   text  – plain string shown in the tooltip
 *   children – the label element shown inline
 */
const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  const show = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    }
    setVisible(true);
  };

  return (
    <span className="tooltip-wrapper">
      {children}
      <span
        ref={iconRef}
        className="tooltip-icon"
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
      >
        ⓘ
      </span>
      {visible && (
        <span
          className="tooltip-box"
          style={{ top: pos.top - 8, left: pos.left + 20 }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
