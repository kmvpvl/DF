import React from 'react';
import './privacyRules.css';
export interface IPrivacyRulesProps {
  onClose: () => void;
}
export interface IPrivacyRulesState {}

export class PrivacyRules extends React.Component<
  IPrivacyRulesProps,
  IPrivacyRulesState
> {
  render(): React.ReactNode {
    return (
      <div className="privacy-rules-container">
        <h2>Zaštita privatnosti i poverljivih podataka o transakciji</h2>
        <p>
          PAVEL KOMOV PR PROIZVODNJA KOLAČA DOLCEFORTE PANČEVO se obavezuje da će čuvati privatnost svih naših kupaca. Prikupljamo samo neophodne, osnovne podatke o kupcima/korisnicima (ime i prezime, adresa za isporuku, broj telefona, e-mail adresa) i podatke neophodne za poslovanje i informisanje korisnika u skladu sa dobrim poslovnim običajima i u cilju pružanja kvalitetne usluge. Svi podaci o korisnicima se strogo čuvaju i dostupni su samo zaposlenima kojima su ti podaci nužni za obavljanje posla.
        </p>
        <p>
          Zaštita poverljivih podataka o transakciji:
        </p>
        <p>
          Prilikom unošenja podataka o platnoj kartici, poverljive informacije se prenose putem javne mreže u zaštićenoj (kriptovanoj) formi upotrebom SSL protokola i PKI sistema, kao trenutno najsavremenije kriptografske tehnologije. Sigurnost podataka prilikom kupovine garantuje procesor platnih kartica, pa se tako kompletni proces naplate obavlja na stranicama banke / platnog procesora. Niti jednog trenutka podaci o platnoj kartici nisu dostupni našem sistemu.
        </p>

        <button
          className="privacy-rules-close-button"
          onClick={this.props.onClose}
        >
          X
        </button>
      </div>
    );
  }
}
