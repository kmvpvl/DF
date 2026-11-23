import React from 'react';
import './deliveryRules.css';
export interface IDeliveryRulesProps {
  onClose: () => void;
}
export interface IDeliveryRulesState {}

export class DeliveryRules extends React.Component<
  IDeliveryRulesProps,
  IDeliveryRulesState
> {
  render(): React.ReactNode {
    return (
      <div className="delivery-rules-container">
        <h2>Uslovi, zona i vreme isporuke</h2>
        <p>
          Isporuka poručenih poslastica vrši se isključivo na teritoriji grada
          Pančeva i Beograda, putem naše sopstvene dostavne službe, u
          specijalizovanim uslovima koji garantuju očuvanje svežine i kvaliteta
          proizvoda.
        </p>
        <p>Vreme isporuke:</p>
        <ul>
          <li>
            Porudžbine kreirane do 17:00 časova isporučuju se istog dana (ili u
            odabranom terminu prilikom kreiranja porudžbine).
          </li>
          <li>
            Porudžbine kreirane nakon 17:00 časova isporučuju se narednog radnog
            dana u dogovorenom terminu.
          </li>
          <li>
            Ukoliko se porudžbina kreira za isporuku u narednom danu, potrebno
            je da se porudžbina kreira do 17:00 časova prethodnog dana.
          </li>
        </ul>
        <p>Cena dostave:</p>
        <p>
          Cena dostave se obračunava automatski prilikom unosa adrese za
          isporuku i sastoji se od fiksne startne cene u iznosu od 200 RSD
          uvećane za 50 RSD po svakom pređenom kilometru od naše lokacije Braće
          Jovanovića 99 u Pančevu do adrese kupca. Tačan iznos troškova dostave
          obračunava se i jasno prikazuje u korpi pre same potvrde porudžbine i
          izvršenja plaćanja.
        </p>

        <p>Obaveze kupca prilikom preuzimanja:</p>
        <p>
          Kupac je dužan da u zakazanom terminu isporuke bude dostupan na
          navedenoj adresi i kontakt telefonu. Ukoliko kurir ne uspe da stupi u
          kontakt sa kupcem na adresi isporuke, čekanje na adresi iznosi
          maksimalno 15 minuta. Zbog prirode proizvoda (sveži deserti sa
          ograničenim rokom trajanja), ukoliko isporuka ne bude uspešna krivicom
          kupca (netačna adresa, nedostupnost na telefon, odsustvo sa adrese u
          dogovoreno vreme), porudžbina se smatra izvršenom i trgovac ne snosi
          odgovornost za naknadno pogoršanje kvaliteta proizvoda niti je u
          obavezi da izvrši povraćaj sredstava. Prilikom prijema pošiljke, kupac
          je dužan da odmah vizuelno proveri stanje ambalaže i proizvoda u
          prisustvu kurira. Naknadne reklamacije na fizička oštećenja nastala
          nakon preuzimanja pošiljke (npr. usled neadekvatnog čuvanja ili
          transporta od strane kupca) neće biti uvažene.
        </p>
        <button
          className="delivery-rules-close-button"
          onClick={this.props.onClose}
        >
          X
        </button>
      </div>
    );
  }
}
