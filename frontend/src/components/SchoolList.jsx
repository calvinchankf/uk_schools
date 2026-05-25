/**
 * Ranked list of schools component
 */

import React, { useRef, useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import './SchoolList.css';

const SCHOOL_TYPES_TOOLTIP =
`In England, a school's name doesn't tell you whether it charges fees.

Free to attend (state-funded):
• Academy / Free school — funded by government, run independently from the local council
• Community school — traditional council-run state school
• Voluntary aided / controlled — often faith schools, still state-funded

Fee-paying schools appear as "Independent school" in the type tag below the school name.`;

const TOOLTIPS = {
  distance:
    'Straight-line distance from your search point to the school, calculated from postcodes.',
  // KS2 (primary)
  ptrwm_exp:
    'Reading, Writing & Maths — % of Year 6 pupils (age 11) who reached the expected standard in all three subjects at the end of Key Stage 2. National average is around 61%.',
  ptrwm_high:
    'Reading, Writing & Maths — % of Year 6 pupils who achieved a high standard (greater depth in Writing, score ≥110 in Reading & Maths). National average is around 8%.',
  read_average:
    'Average KS2 Reading scaled score. Scores range from 80–120; the national average is 105. A score above 105 means pupils performed above the national average.',
  mat_average:
    'Average KS2 Maths scaled score. Scores range from 80–120; the national average is 105. A score above 105 means pupils performed above the national average.',
  fsm:
    'Pupils eligible for Free School Meals at any point in the last 6 years. This is the DfE\'s standard measure of economic disadvantage. A higher % indicates more pupils from lower-income households.',
  feeder:
    'The nearest secondary school by straight-line distance. Most Year 6 pupils from this primary will likely apply to secondary schools nearby, though admissions criteria vary.',
  // KS4 (secondary)
  att8_score:
    'Attainment 8 — average score across a pupil\'s best 8 GCSE subjects, including English and Maths. Scores typically range from 0–90; the national average is around 46. Higher is better.',
  l2basics_94:
    '% of pupils achieving grade 5 or above in both English and Maths GCSEs. This is the DfE\'s headline "strong pass" measure. The national average is around 45%.',
  ebacc_94:
    '% of pupils achieving grade 4+ (standard pass) across all five EBacc subject areas: English, Maths, Science, Humanities, and a Language. National average is around 24%.',
  ebacc_entry:
    '% of pupils entered for the full English Baccalaureate (EBacc) combination of subjects. The government\'s target is 90% entry by 2025.',
};

/**
 * Click-toggled tooltip showing the full ethnicity breakdown.
 */
const EthnicityMoreTooltip = ({ allGroups }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    }
    setOpen(prev => !prev);
  };

  return (
    <span className="ethnicity-more-wrapper" ref={wrapperRef}>
      <span
        ref={btnRef}
        className="ethnicity-more-btn"
        onClick={handleClick}
      >
        more
      </span>
      {open && (
        <span
          className="ethnicity-more-popup"
          style={{ top: pos.top - 8, left: pos.left + 24 }}
        >
          <strong>Full ethnicity breakdown</strong>
          {allGroups.map((e, i) => (
            <div key={i}>{e.group}: {e.pct}%</div>
          ))}
        </span>
      )}
    </span>
  );
};

const SchoolList = ({ schools, onSchoolClick, selectedSchool, phase = 'primary', scrollToUrn }) => {
  const cardRefs = useRef({});
  const listContentRef = useRef(null);

  useEffect(() => {
    if (!scrollToUrn) return;
    const card = cardRefs.current[scrollToUrn.urn];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollToUrn]);

  const getScoreBadgeColor = (score) => {
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 45) return '#eab308';
    return '#ef4444';
  };

  if (schools.length === 0) {
    return (
      <div className="school-list empty">
        <div className="empty-message">
          <h3>No schools found</h3>
          <p>Enter a postcode or place name, or click the map to search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="school-list">
      <div className="school-list-header">
        <h2>
          Top Schools ({schools.length})
          <Tooltip text={SCHOOL_TYPES_TOOLTIP} />
          {' '}<span className="score-type-label">by {phase === 'primary' ? 'KS2' : 'KS4'} score</span>
        </h2>
        <div className="legend">
          {[
            { color: '#22c55e', label: '75+' },
            { color: '#84cc16', label: '60–74' },
            { color: '#eab308', label: '45–59' },
            { color: '#ef4444', label: '<45' },
          ].map(({ color, label }) => (
            <div className="legend-item" key={label}>
              <span className="legend-color" style={{ backgroundColor: color }}></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="school-list-content" ref={listContentRef}>
        {schools.map((school, index) => (
          <div
            key={school.urn}
            ref={el => {
              if (el) cardRefs.current[school.urn] = el;
              else delete cardRefs.current[school.urn];
            }}
            className={`school-card ${selectedSchool && selectedSchool.urn === school.urn ? 'selected' : ''}`}
            onClick={() => onSchoolClick(school, index + 1)}
          >
            <div className="school-info">
              <div className="school-name-row">
                <span className="school-rank">#{index + 1}</span>
                <h3 className="school-name">{school.name}</h3>
                <span
                  className="score-badge"
                  style={{ backgroundColor: getScoreBadgeColor(school.performance_score) }}
                >
                  {school.performance_score.toFixed(1)}
                </span>
              </div>

              <div className="school-meta">
                <span className="school-type">{school.school_type}</span>
                {school.age_low && school.age_high && (
                  <span className="school-age">Ages {school.age_low}-{school.age_high}</span>
                )}
              </div>

              <div className="school-address">
                {school.address.street && <div>{school.address.street}</div>}
                {school.address.town && <div>{school.address.town}</div>}
                <div>{school.postcode}</div>
              </div>

              <div className="school-metrics">
                {school.distance_km !== undefined && (
                  <div className="metric">
                    <span className="metric-label">
                      <Tooltip text={TOOLTIPS.distance}>Distance:</Tooltip>
                    </span>
                    <span className="metric-value">{school.distance_km.toFixed(2)} km</span>
                  </div>
                )}

                {phase === 'secondary' ? (
                  <>
                    {school.metrics.l2basics_94 != null && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.l2basics_94}>Grade 5+ Eng &amp; Maths:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.l2basics_94.toFixed(1)}%</span>
                      </div>
                    )}

                    {school.metrics.att8_score != null && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.att8_score}>Attainment 8:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.att8_score.toFixed(1)}</span>
                      </div>
                    )}

                    {school.metrics.ebacc_94 != null && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.ebacc_94}>EBacc (4+):</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.ebacc_94.toFixed(1)}%</span>
                      </div>
                    )}

                    {school.metrics.ebacc_entry != null && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.ebacc_entry}>EBacc entry:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.ebacc_entry.toFixed(1)}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {school.metrics.ptrwm_exp && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.ptrwm_exp}>Expected RWM:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.ptrwm_exp.toFixed(1)}%</span>
                      </div>
                    )}

                    {school.metrics.ptrwm_high && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.ptrwm_high}>High RWM:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.ptrwm_high.toFixed(1)}%</span>
                      </div>
                    )}

                    {school.metrics.read_average && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.read_average}>Reading:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.read_average.toFixed(1)}</span>
                      </div>
                    )}

                    {school.metrics.mat_average && (
                      <div className="metric">
                        <span className="metric-label">
                          <Tooltip text={TOOLTIPS.mat_average}>Maths:</Tooltip>
                        </span>
                        <span className="metric-value">{school.metrics.mat_average.toFixed(1)}</span>
                      </div>
                    )}
                  </>
                )}

                {school.fsm_pct != null && (
                  <div className="metric">
                    <span className="metric-label">
                      <Tooltip text={TOOLTIPS.fsm}>Free School Meals:</Tooltip>
                    </span>
                    <span className="metric-value">{school.fsm_pct.toFixed(1)}%</span>
                  </div>
                )}

                {school.ethnicity && school.ethnicity.length > 0 && (
                  <div className="metric metric-ethnicity">
                    <span className="metric-label">Ethnicity (top 3):</span>
                    <span className="metric-value">
                      {school.ethnicity.slice(0, 3).map(e => `${e.group} ${e.pct}%`).join(' · ')}
                      {school.ethnicity.length > 3 && (
                        <EthnicityMoreTooltip allGroups={school.ethnicity} />
                      )}
                    </span>
                  </div>
                )}

                {phase === 'primary' && school.feeder_secondary && (
                  <div className="metric">
                    <span className="metric-label">
                      <Tooltip text={TOOLTIPS.feeder}>Nearest Secondary:</Tooltip>
                    </span>
                    <span className="metric-value">
                      {school.feeder_secondary.name} ({school.feeder_secondary.dist_km.toFixed(2)} km)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolList;
