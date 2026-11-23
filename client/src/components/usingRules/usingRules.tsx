import React from 'react';
import './usingRules.css';

export interface IUsingRulesProps {
  onClose: () => void;
}
export interface IUsingRulesState {}

export class UsingRules extends React.Component<
  IUsingRulesProps,
  IUsingRulesState
> {
  render(): React.ReactNode {
    return (
      <div className="using-rules-container">
        <h2>Uslovi korišćenja i načini plaćanja</h2>
        <p>
          Sve cene proizvoda prikazane na web aplikaciji DOLCEFORTE.RS izražene
          su u srpskim dinarima (RSD). PAVEL KOMOV PR PROIZVODNJA KOLAČA PANČEVO
          nije u sistemu PDV-a. Plaćanje poručenih proizvoda moguće je izvršiti
          na sledeće načine:
        </p>
        <ul>
          <li>
            Instant plaćanje (IPS Skeniraj / Deep Link): Brzo i sigurno plaćanje
            putem mobilne aplikacije Vaše banke skeniranjem IPS QR koda ili
            direktnim preusmeravanjem na m-banking aplikaciju. Platnim karticama
            online: Putem platnih kartica (DinaCard, Visa, Mastercard) tokom
            procesa kreiranja porudžbine.
          </li>
          <li>
            Pouzećem (gotovinom prilikom preuzimanja): Plaćanje kuriru u
            gotovini prilikom isporuke pošiljke na Vašu adresu. (Удалите этот
            пункт, если не планируете наложенный платеж)
          </li>
        </ul>
        <p>
          Konverzija valuta (Izjava o konverziji): Sva plaćanja biće izvršena u
          lokalnoj valuti Republike Srbije – dinar (RSD). Za informativni prikaz
          cena u drugim valutama koristi se srednji kurs Narodne banke Srbije.
          Iznos za koji će biti zadužena Vaša platna kartica biće izražen u
          Vašoj lokalnoj valuti kroz konverziju u istu po kursu koji koriste
          kartičarske organizacije, a koji nama u trenutku transakcije ne može
          biti poznat. Kao rezultat ove konverzije postoji mogućnost neznatne
          razlike od originalne cene navedene na našem sajtu.
        </p>
        <button
          className="using-rules-close-button"
          onClick={this.props.onClose}
        >
          X
        </button>
      </div>
    );
  }
}
