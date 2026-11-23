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
        <h2>Uslovi korišćenja, načini plaćanja i procedure povraćaja</h2>
        <p>
          Sve cene proizvoda prikazane na web aplikaciji DOLCEFORTE.RS izražene
          su u srpskim dinarima (RSD). PAVEL KOMOV PR PROIZVODNJA KOLAČA DOLCEFORTE PANČEVO
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

        <p>Izuzetak od prava na odustanak od ugovora (kvarljiva roba)</p>
        <p>
          U skladu sa članom 36. stav 1. tačka 4 Zakona o zaštiti potrošača
          Republike Srbije, potrošač nema pravo da odustane od ugovora
          zaključenog na daljinu u roku od 14 dana, s obzirom na to da su
          predmet prodaje prehrambeni proizvodi (poslastice/deserti) koji su po
          svojoj prirodi podložni brzom pogoršanju kvaliteta i imaju kratak rok
          trajanja.
        </p>
        <p>Reklamacije zbog oštećenja ili nesaobraznosti</p>
        <p>
          Kupac je dužan da prilikom preuzimanja pošiljke pregleda proizvod u
          prisustvu kurira. Ukoliko je proizvod vidno oštećen tokom transporta,
          pogrešno isporučen ili ne odgovara deklarisanom kvalitetu, kupac ima
          pravo da uloži reklamaciju odmah po prijemu, a najkasnije u roku od 24
          sata od trenutka isporuke, slanjem fotografije proizvoda i broja
          porudžbine na e-mail adresu sales@dolceforte.rs ili putem telefona
          +381 62 1478 438.
        </p>
        <p>
          Trgovac će na reklamaciju odgovoriti u najkraćem mogućem roku
          (najkasnije u zakonskom roku od 8 dana) i u slučaju opravdane
          reklamacije izvršiti zamenu proizvoda ili povraćaj uplaćenog novca.
        </p>
        <p>Otkazivanje porudžbine pre slanja</p>
        <p>
          Kupac može otkazati plaćenu porudžbinu i ostvariti pravo na pun
          povraćaj sredstava isključivo ukoliko otkazivanje izvrši pre nego što
          je priprema ili isporuka porudžbine započeta (najkasnije 24 sata pre
          zakazanog termina isporuke).
        </p>
        <p>Povraćaj sredstava (obavezna klauzula za online plaćanja)</p>
        <p>
          U slučaju opravdane reklamacije, otkazivanja porudžbine pre pripreme
          ili nemogućnosti isporuke od strane trgovca, a kada je kupac prethodno
          izvršio plaćanje platnom karticom ili putem IPS instant plaćanja,
          [Полное название preduzetnik] je u obavezi da povraćaj sredstava vrši
          isključivo preko VISA, EC/MC, DinaCard i IPS metoda plaćanja, što
          znači da će banka na zahtev prodavca obaviti povraćaj sredstava na
          račun korisnika kartice / platnog računa.
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
