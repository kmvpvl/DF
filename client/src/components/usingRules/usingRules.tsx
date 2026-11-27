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
          su u srpskim dinarima (RSD). PAVEL KOMOV PR PROIZVODNJA KOLAČA
          DOLCEFORTE PANČEVO nije u sistemu PDV-a. Plaćanje poručenih proizvoda
          moguće je izvršiti na sledeće načine:
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
        <div
          className="using-rules-payment-logos"
          aria-label="Podržane kartice i banke"
        >
          <img src="/assets/brand/payments/dinacard.png" alt="DinaCard" />
          <img src="/assets/brand/payments/visa.svg" alt="Visa" />
          <img src="/assets/brand/payments/ma_symbol.svg" alt="Mastercard" />
          <img
            src="/assets/brand/payments/verified-by-visa_mastercard_securecode-copy.png"
            alt="Verified by Mastercard, Visa Secure, Dinacard Secure"
          />
          <img
            src="/assets/brand/payments/postanska-stedionica.svg"
            alt="Banka Poštanska štedionica"
            style={{ backgroundColor: 'navy' }}
          />
          <img
            src="/assets/brand/payments/narodna-banka-srbije.svg"
            alt="Narodna banka Srbije"
          />
          <img src="/assets/brand/payments/ips_logo.svg" alt="IPS" />
        </div>

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
          PAVEL KOMOV PR PROIZVODNJA KOLAČA DOLCEFORTE PANČEVO je u obavezi da
          povraćaj sredstava vrši isključivo preko VISA, EC/MC, DinaCard i IPS
          metoda plaćanja, što znači da će banka na zahtev prodavca obaviti
          povraćaj sredstava na račun korisnika kartice / platnog računa.
        </p>
        <p>
          <strong>
            OBAVEŠTENJE O NAČINU I MESTU PRIJEMA REKLAMACIJA I USLOVIMA
            POVRAĆAJA
          </strong>
        </p>

        <p>
          U skladu sa Zakonom o zaštiti potrošača („Službeni glasnik RS“, br.
          35/2026), privredno društvo / preduzetnik PAVEL KOMOV PR PROIZVODNJA
          KOLAČA DOLCEFORTE PANČEVO, PIB: 115274132, matični broj: 68236371, sa
          sedištem na adresi Pančevo Braće Jovanovića 99, obaveštava potrošače o
          sledećem:
        </p>

        <p>
          1. ISKLJUČENJE PRAVA NA ODUSTANAK OD UGOVORA (POVRAT ISPRAVNE ROBE)
        </p>
        <p>
          Na osnovu Zakona o zaštiti potrošača (član o izuzecima od prava na
          odustanak od ugovora zaključenog na daljinu), potrošač NEMA PRAVO na
          jednostrani raskid ugovora i povraćaj novca u roku od 14 dana za:
        </p>
        <p>
          - robu koja je podložna pogoršanju kvaliteta ili ima kratak rok
          trajanja (sveži kolači, torte, peciva i ostali prehrambeni proizvodi);
        </p>
        <p>
          - robu proizvedenu prema posebnim zahtevima potrošača ili jasno
          personalizovanu (torte i poslastice po porudžbini);
        </p>
        <p>
          - zapečaćenu robu koja se ne može vratiti zbog zaštite zdravlja ili
          higijenskih razloga, a koja je otpečaćena nakon isporuke.
        </p>

        <p>
          2. NAČIN I MESTO PRIJEMA REKLAMACIJA (U SLUČAJU NESAOBRAZNOSTI
          PROIZVODA)
        </p>
        <p>
          Ukoliko isporučeni proizvod ima nedostatak (oštećenje nastalo pre
          preuzimanja, pogrešno isporučen artikal, odstupanje od porudžbine ili
          problem sa kvalitetom/ispravnošću), potrošač ima pravo da izjavi
          reklamaciju:
        </p>
        <p>- elektronskim putem na e-mail adresu: sales@dolceforte.rs</p>
        <p>- pisanim putem na adresu: Pančevo Braće Jovanovića 99</p>
        <p>
          - usmeno / lično u prodajnom objektu na adresi: Pančevo Braće
          Jovanovića 99
        </p>
        <p>- telefonom na broj: 062 1478 438</p>

        <p>
          Prilikom izjavljivanja reklamacije, potrošač je dužan da dostavi
          fiskalni račun ili drugi dokaz o kupovini (potvrdu porudžbine, izvod
          iz banke) i po mogućstvu fotografiju proizvoda u slučaju oštećenja ili
          greške.
        </p>

        <p>3. ROKOVI ZA REŠAVANJE REKLAMACIJE</p>
        <p>
          Prodavac je dužan da bez odlaganja, a najkasnije u roku od 8 dana od
          dana prijema reklamacije, pisanim ili elektronskim putem odgovori
          potrošaču na izjavljenu reklamaciju. Rok za rešavanje prihvaćene
          reklamacije ne može biti duži od 15 dana od dana podnošenja
          reklamacije.
        </p>

        <p>
          Obrazac za reklamaciju možete preuzeti{' '}
          <a
            href="https://www.dolceforte.rs/reklamacija.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            ovde
          </a>
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
