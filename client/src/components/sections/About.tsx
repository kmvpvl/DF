import React from 'react';
import { I18nContext, type I18nContextValue } from '../../i18n/I18nContext';

class About extends React.Component {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

  render() {
    const i18n = this.context;
    if (!i18n) {
      throw new Error('About must be used within I18nProvider');
    }

    const { dictionary } = i18n;

    return (
      <div id="about" className="about-section">
        <div className="section-inner">
          <p className="section-label">{dictionary.about.label}</p>

          <div className="about-grid">
            <div className="about-visual">🍰</div>

            <div className="about-text">
              <h2 className="section-title">{dictionary.about.title}</h2>
              <p>{dictionary.about.p1}</p>
              <p>{dictionary.about.p2}</p>

              <div className="about-stats">
                {dictionary.about.stats.map((s) => (
                  <div key={s.label} className="stat">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default About;
