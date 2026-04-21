/**
 * Ranked list of schools component
 */

import React from 'react';
import Tooltip from './Tooltip';
import './SchoolList.css';

const TOOLTIPS = {
  distance:
    'Straight-line distance from your search point to the school, calculated from postcodes.',
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
};

const SchoolList = ({ schools, onSchoolClick, selectedSchool }) => {
  const getScoreBadgeColor = (score) => {
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 45) return '#eab308';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Average';
    return 'Below Average';
  };

  const buildEthnicityTooltip = (groups) => {
    if (!groups || groups.length === 0) return 'No ethnicity data available.';
    const lines = groups.map(e => `${e.group}: ${e.pct}%`).join('\n');
    return `Full ethnicity breakdown:\n${lines}`;
  };

  if (schools.length === 0) {
    return (
      <div className="school-list empty">
        <div className="empty-message">
          <h3>No schools found</h3>
          <p>Click on the map or enter a postcode to search for schools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="school-list">
      <div className="school-list-header">
        <h2>Top Schools ({schools.length})</h2>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#22c55e' }}></span>
            <span>Excellent (75+)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#84cc16' }}></span>
            <span>Good (60-74)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#eab308' }}></span>
            <span>Average (45-59)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Below Avg (&lt;45)</span>
          </div>
        </div>
      </div>

      <div className="school-list-content">
        {schools.map((school, index) => (
          <div
            key={school.urn}
            className={`school-card ${selectedSchool && selectedSchool.urn === school.urn ? 'selected' : ''}`}
            onClick={() => onSchoolClick(school)}
          >
            <div className="school-rank">#{index + 1}</div>

            <div className="school-info">
              <h3 className="school-name">{school.name}</h3>

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
                    <span className="metric-label">
                      <Tooltip text={buildEthnicityTooltip(school.ethnicity)}>
                        Ethnicity (top 3):
                      </Tooltip>
                    </span>
                    <span className="metric-value">
                      {school.ethnicity.slice(0, 3).map(e => `${e.group} ${e.pct}%`).join(' · ')}
                    </span>
                  </div>
                )}

                {school.feeder_secondary && (
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

            <div className="school-score">
              <div
                className="score-badge"
                style={{ backgroundColor: getScoreBadgeColor(school.performance_score) }}
              >
                <div className="score-value">{school.performance_score.toFixed(1)}</div>
                <div className="score-label">{getScoreLabel(school.performance_score)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolList;
