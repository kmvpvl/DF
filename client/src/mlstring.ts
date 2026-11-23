//
export type IMLString =
  | string
  | {
      default: string;
      // Используем простой объект вместо массива кортежей
      ts: Record<string, string>;
    };
export class MLString extends String {
  private _translations: Record<string, string> = {};
  constructor(input?: IMLString) {
    super(input ? (typeof input === 'object' ? input.default : input) : '');
    if (!input) {
      this._translations = {};
    } else if (typeof input === 'string') {
      this._translations = {};
    } else {
      this._translations = input.ts;
    }
  }

  toString(lang?: string): string {
    if (!lang) lang = MLString.getLang();
    if (lang && this._translations[lang]) {
      return this._translations[lang] as string;
    }
    return super.toString();
  }

  // Для удобного маппинга в UI
  get entries(): [string, string | undefined][] {
    return Object.entries(this._translations);
  }

  public static getLang(): string {
    const params: string[] = window.location.search.substring(1).split('&');
    let lang = window.navigator.language.split('-')[0];
    const lang_param = params.filter((v) => v.split('=')[0] === 'lang');
    if (lang_param !== undefined && lang_param.length > 0)
      lang = lang_param[0].split('=')[1];
    return lang;
  }
  get Json(): IMLString {
    return {
      default: super.toString(),
      ts: this._translations,
    };
  }
}

export const mlStrings = new Map([
  [
    `Tiramisu`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Тирамису'],
      [`it`, undefined],
      [`sr`, 'Tiramisu'],
    ]),
  ],
  [
    `Panacotta`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Панакота'],
      [`it`, undefined],
      [`sr`, 'Panacotta'],
    ]),
  ],
  [
    `Home`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Главная'],
      [`it`, undefined],
      [`sr`, 'Početna'],
    ]),
  ],
  [
    `Products`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Продукты'],
      [`it`, undefined],
      [`sr`, 'Proizvodi'],
    ]),
  ],
  [
    `Contacts`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Контакты'],
      [`it`, undefined],
      [`sr`, 'Kontakti'],
    ]),
  ],
  [
    `About`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'О нас'],
      [`it`, undefined],
      [`sr`, 'O nama'],
    ]),
  ],
  [
    `Basket`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Корзина'],
      [`it`, undefined],
      [`sr`, 'Korpa'],
    ]),
  ],
  [
    `Close basket`,
    new Map([
      [`de`, 'Warenkorb schließen'],
      [`fr`, 'Fermer le panier'],
      [`es`, 'Cerrar la cesta'],
      [`ru`, 'Закрыть корзину'],
      [`it`, 'Chiudi il carrello'],
      [`sr`, 'Zatvori korpu'],
    ]),
  ],
  [
    `Your basket is empty`,
    new Map([
      [`de`, 'Ihr Warenkorb ist leer'],
      [`fr`, 'Votre panier est vide'],
      [`es`, 'Tu cesta está vacía'],
      [`ru`, 'Ваша корзина пуста'],
      [`it`, 'Il carrello è vuoto'],
      [`sr`, 'Vaša korpa je prazna'],
    ]),
  ],
  [
    `Loading...`,
    new Map([
      [`de`, 'Wird geladen...'],
      [`fr`, 'Chargement...'],
      [`es`, 'Cargando...'],
      [`ru`, 'Загрузка...'],
      [`it`, 'Caricamento...'],
      [`sr`, 'Učitavanje...'],
    ]),
  ],
  [
    `Decrease quantity for`,
    new Map([
      [`de`, 'Menge verringern für'],
      [`fr`, 'Diminuer la quantité de'],
      [`es`, 'Reducir la cantidad de'],
      [`ru`, 'Уменьшить количество товара'],
      [`it`, 'Riduci la quantità di'],
      [`sr`, 'Smanji količinu za'],
    ]),
  ],
  [
    `Increase quantity for`,
    new Map([
      [`de`, 'Menge erhöhen für'],
      [`fr`, 'Augmenter la quantité de'],
      [`es`, 'Aumentar la cantidad de'],
      [`ru`, 'Увеличить количество товара'],
      [`it`, 'Aumenta la quantità di'],
      [`sr`, 'Povećaj količinu za'],
    ]),
  ],
  [
    `Remove`,
    new Map([
      [`de`, 'Entfernen'],
      [`fr`, 'Supprimer'],
      [`es`, 'Quitar'],
      [`ru`, 'Убрать'],
      [`it`, 'Rimuovi'],
      [`sr`, 'Ukloni'],
    ]),
  ],
  [
    `Full name`,
    new Map([
      [`de`, 'Vollständiger Name'],
      [`fr`, 'Nom complet'],
      [`es`, 'Nombre completo'],
      [`ru`, 'Полное имя'],
      [`it`, 'Nome completo'],
      [`sr`, 'Ime i prezime'],
    ]),
  ],
  [
    `Email`,
    new Map([
      [`de`, 'E-Mail'],
      [`fr`, 'E-mail'],
      [`es`, 'Correo electrónico'],
      [`ru`, 'Электронная почта'],
      [`it`, 'E-mail'],
      [`sr`, 'E-pošta'],
    ]),
  ],
  [
    `Phone`,
    new Map([
      [`de`, 'Telefon'],
      [`fr`, 'Téléphone'],
      [`es`, 'Teléfono'],
      [`ru`, 'Телефон'],
      [`it`, 'Telefono'],
      [`sr`, 'Telefon'],
    ]),
  ],
  [
    `Order note (optional)`,
    new Map([
      [`de`, 'Bestellhinweis (optional)'],
      [`fr`, 'Note de commande (facultatif)'],
      [`es`, 'Nota del pedido (opcional)'],
      [`ru`, 'Комментарий к заказу (необязательно)'],
      [`it`, "Nota sull'ordine (facoltativa)"],
      [`sr`, 'Napomena uz porudžbinu (opciono)'],
    ]),
  ],
  [
    `Searching addresses...`,
    new Map([
      [`de`, 'Adressen werden gesucht...'],
      [`fr`, 'Recherche des adresses...'],
      [`es`, 'Buscando direcciones...'],
      [`ru`, 'Поиск адресов...'],
      [`it`, 'Ricerca degli indirizzi...'],
      [`sr`, 'Pretraga adresa...'],
    ]),
  ],
  [
    `Loading saved delivery address...`,
    new Map([
      [`de`, 'Gespeicherte Lieferadresse wird geladen...'],
      [`fr`, "Chargement de l'adresse de livraison enregistrée..."],
      [`es`, 'Cargando la dirección de entrega guardada...'],
      [`ru`, 'Загрузка сохранённого адреса доставки...'],
      [`it`, "Caricamento dell'indirizzo di consegna salvato..."],
      [`sr`, 'Učitavanje sačuvane adrese za isporuku...'],
    ]),
  ],
  [
    `Select an address to calculate delivery`,
    new Map([
      [`de`, 'Wählen Sie eine Adresse, um die Lieferung zu berechnen'],
      [`fr`, 'Sélectionnez une adresse pour calculer la livraison'],
      [`es`, 'Selecciona una dirección para calcular la entrega'],
      [`ru`, 'Выберите адрес для расчёта доставки'],
      [`it`, 'Seleziona un indirizzo per calcolare la consegna'],
      [`sr`, 'Izaberite adresu za obračun isporuke'],
    ]),
  ],
  [
    `add a house number`,
    new Map([
      [`de`, 'Hausnummer hinzufügen'],
      [`fr`, 'ajoutez un numéro de rue'],
      [`es`, 'añade el número de la casa'],
      [`ru`, 'укажите номер дома'],
      [`it`, 'aggiungi il numero civico'],
      [`sr`, 'dodajte kućni broj'],
    ]),
  ],
  [
    `Calculating delivery route...`,
    new Map([
      [`de`, 'Lieferroute wird berechnet...'],
      [`fr`, "Calcul de l'itinéraire de livraison..."],
      [`es`, 'Calculando la ruta de entrega...'],
      [`ru`, 'Расчёт маршрута доставки...'],
      [`it`, 'Calcolo del percorso di consegna...'],
      [`sr`, 'Izračunavanje rute isporuke...'],
    ]),
  ],
  [
    `Distance`,
    new Map([
      [`de`, 'Entfernung'],
      [`fr`, 'Distance'],
      [`es`, 'Distancia'],
      [`ru`, 'Расстояние'],
      [`it`, 'Distanza'],
      [`sr`, 'Udaljenost'],
    ]),
  ],
  [
    `km`,
    new Map([
      [`de`, 'km'],
      [`fr`, 'km'],
      [`es`, 'km'],
      [`ru`, 'км'],
      [`it`, 'km'],
      [`sr`, 'km'],
    ]),
  ],
  [
    `tariff not configured`,
    new Map([
      [`de`, 'Tarif nicht konfiguriert'],
      [`fr`, 'Tarif non configuré'],
      [`es`, 'Tarifa no configurada'],
      [`ru`, 'тариф не настроен'],
      [`it`, 'Tariffa non configurata'],
      [`sr`, 'Tarifa nije podešena'],
    ]),
  ],
  [
    `Address selected and verified`,
    new Map([
      [`de`, 'Adresse ausgewählt und bestätigt'],
      [`fr`, 'Adresse sélectionnée et vérifiée'],
      [`es`, 'Dirección seleccionada y verificada'],
      [`ru`, 'Адрес выбран и подтверждён'],
      [`it`, 'Indirizzo selezionato e verificato'],
      [`sr`, 'Adresa je izabrana i potvrđena'],
    ]),
  ],
  [
    `Basket is empty.`,
    new Map([
      [`de`, 'Der Warenkorb ist leer.'],
      [`fr`, 'Le panier est vide.'],
      [`es`, 'La cesta está vacía.'],
      [`ru`, 'Корзина пуста.'],
      [`it`, 'Il carrello è vuoto.'],
      [`sr`, 'Korpa je prazna.'],
    ]),
  ],
  [
    `Unable to submit order because the saved draft is missing.`,
    new Map([
      [
        `de`,
        'Die Bestellung kann nicht gesendet werden, da der gespeicherte Entwurf fehlt.',
      ],
      [
        `fr`,
        "Impossible d'envoyer la commande : le brouillon enregistré est introuvable.",
      ],
      [
        `es`,
        'No se puede enviar el pedido porque no se encuentra el borrador guardado.',
      ],
      [`ru`, 'Не удалось отправить заказ: сохранённый черновик не найден.'],
      [
        `it`,
        "Impossibile inviare l'ordine: la bozza salvata non è disponibile.",
      ],
      [`sr`, 'Porudžbina nije poslata jer sačuvani nacrt nije pronađen.'],
    ]),
  ],
  [
    `Please fill in name, delivery address and phone before placing an order.`,
    new Map([
      [
        `de`,
        'Bitte geben Sie vor der Bestellung Ihren Namen, Ihre Lieferadresse und Telefonnummer ein.',
      ],
      [
        `fr`,
        'Veuillez saisir votre nom, votre adresse de livraison et votre téléphone avant de commander.',
      ],
      [
        `es`,
        'Introduce tu nombre, dirección de entrega y teléfono antes de realizar el pedido.',
      ],
      [`ru`, 'Перед оформлением заказа укажите имя, адрес доставки и телефон.'],
      [
        `it`,
        "Inserisci nome, indirizzo di consegna e telefono prima di effettuare l'ordine.",
      ],
      [
        `sr`,
        'Pre slanja porudžbine unesite ime, adresu za isporuku i broj telefona.',
      ],
    ]),
  ],
  [
    `Choose a delivery address with a house number from the suggestions.`,
    new Map([
      [
        `de`,
        'Wählen Sie in den Vorschlägen eine Lieferadresse mit Hausnummer aus.',
      ],
      [
        `fr`,
        'Choisissez dans les suggestions une adresse de livraison avec numéro.',
      ],
      [
        `es`,
        'Elige en las sugerencias una dirección de entrega con número de casa.',
      ],
      [`ru`, 'Выберите в подсказках адрес доставки с номером дома.'],
      [
        `it`,
        'Seleziona tra i suggerimenti un indirizzo di consegna con numero civico.',
      ],
      [`sr`, 'Izaberite predloženu adresu za isporuku koja sadrži kućni broj.'],
    ]),
  ],
  [
    `Failed to place order.`,
    new Map([
      [`de`, 'Bestellung konnte nicht aufgegeben werden.'],
      [`fr`, "Échec de l'envoi de la commande."],
      [`es`, 'No se pudo realizar el pedido.'],
      [`ru`, 'Не удалось оформить заказ.'],
      [`it`, "Impossibile inviare l'ordine."],
      [`sr`, 'Porudžbina nije poslata.'],
    ]),
  ],
  [
    `Could not load the saved delivery address.`,
    new Map([
      [`de`, 'Die gespeicherte Lieferadresse konnte nicht geladen werden.'],
      [`fr`, "Impossible de charger l'adresse de livraison enregistrée."],
      [`es`, 'No se pudo cargar la dirección de entrega guardada.'],
      [`ru`, 'Не удалось загрузить сохранённый адрес доставки.'],
      [`it`, "Impossibile caricare l'indirizzo di consegna salvato."],
      [`sr`, 'Nije moguće učitati sačuvanu adresu za isporuku.'],
    ]),
  ],
  [
    `Address search failed.`,
    new Map([
      [`de`, 'Adresssuche fehlgeschlagen.'],
      [`fr`, "Échec de la recherche d'adresses."],
      [`es`, 'Error al buscar direcciones.'],
      [`ru`, 'Не удалось найти адрес.'],
      [`it`, 'Ricerca indirizzi non riuscita.'],
      [`sr`, 'Pretraga adresa nije uspela.'],
    ]),
  ],
  [
    `Could not calculate the delivery route.`,
    new Map([
      [`de`, 'Die Lieferroute konnte nicht berechnet werden.'],
      [`fr`, "Impossible de calculer l'itinéraire de livraison."],
      [`es`, 'No se pudo calcular la ruta de entrega.'],
      [`ru`, 'Не удалось рассчитать маршрут доставки.'],
      [`it`, 'Impossibile calcolare il percorso di consegna.'],
      [`sr`, 'Nije moguće izračunati rutu isporuke.'],
    ]),
  ],
  [
    `Order sent to sales@dolceforte.rs. We will contact you soon.`,
    new Map([
      [
        `de`,
        'Die Bestellung wurde an sales@dolceforte.rs gesendet. Wir werden Sie bald kontaktieren.',
      ],
      [
        `fr`,
        'La commande a été envoyée à sales@dolceforte.rs. Nous vous contacterons bientôt.',
      ],
      [
        `es`,
        'El pedido se envió a sales@dolceforte.rs. Nos pondremos en contacto contigo pronto.',
      ],
      [
        `ru`,
        'Заказ отправлен на sales@dolceforte.rs. Мы скоро свяжемся с вами.',
      ],
      [
        `it`,
        "L'ordine è stato inviato a sales@dolceforte.rs. Ti contatteremo presto.",
      ],
      [
        `sr`,
        'Porudžbina je poslata na sales@dolceforte.rs. Uskoro ćemo vas kontaktirati.',
      ],
    ]),
  ],
  [
    `Sending order...`,
    new Map([
      [`de`, 'Bestellung wird gesendet...'],
      [`fr`, 'Envoi de la commande...'],
      [`es`, 'Enviando pedido...'],
      [`ru`, 'Отправка заказа...'],
      [`it`, "Invio dell'ordine..."],
      [`sr`, 'Slanje porudžbine...'],
    ]),
  ],
  [
    `Place order`,
    new Map([
      [`de`, 'Bestellung aufgeben'],
      [`fr`, 'Passer la commande'],
      [`es`, 'Realizar pedido'],
      [`ru`, 'Оформить заказ'],
      [`it`, "Invia l'ordine"],
      [`sr`, 'Pošalji porudžbinu'],
    ]),
  ],
  [
    `Ready by`,
    new Map([
      [`de`, 'Fertig bis'],
      [`fr`, 'Prêt le'],
      [`es`, 'Listo el'],
      [`ru`, 'Готово к'],
      [`it`, 'Pronto entro'],
      [`sr`, 'Spremno do'],
    ]),
  ],
  [
    `Hi`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Привет'],
      [`it`, undefined],
      [`sr`, 'Zdravo'],
    ]),
  ],
  [
    `Language`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Язык'],
      [`it`, undefined],
      [`sr`, 'Jezik'],
    ]),
  ],
  [
    `Delivery`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Доставка'],
      [`it`, undefined],
      [`sr`, 'Dostava'],
    ]),
  ],
  [
    `Delivery tariff is not configured.`,
    new Map([
      [`de`, 'Der Liefertarif ist nicht konfiguriert.'],
      [`fr`, 'Le tarif de livraison n’est pas configuré.'],
      [`es`, 'La tarifa de entrega no está configurada.'],
      [`ru`, 'Тариф доставки не настроен.'],
      [`it`, 'La tariffa di consegna non è configurata.'],
      [`sr`, 'Tarifa isporuke nije podešena.'],
    ]),
  ],
  [
    `Online payment`,
    new Map([
      [`de`, 'Online-Zahlung'],
      [`fr`, 'Paiement en ligne'],
      [`es`, 'Pago en línea'],
      [`ru`, 'Онлайн-оплата'],
      [`it`, 'Pagamento online'],
      [`sr`, 'Plaćanje onlajn'],
    ]),
  ],
  [
    `Card`,
    new Map([
      [`de`, 'Karte'],
      [`fr`, 'Carte'],
      [`es`, 'Tarjeta'],
      [`ru`, 'Картой'],
      [`it`, 'Carta'],
      [`sr`, 'Karticom'],
    ]),
  ],
  [
    `Cash`,
    new Map([
      [`de`, 'Barzahlung'],
      [`fr`, 'Espèces'],
      [`es`, 'Efectivo'],
      [`ru`, 'Наличными'],
      [`it`, 'Contanti'],
      [`sr`, 'Gotovinom'],
    ]),
  ],
  [
    `Bank transfer (7 days)`,
    new Map([
      [`de`, 'Banküberweisung (7 Tage)'],
      [`fr`, 'Virement bancaire (7 jours)'],
      [`es`, 'Transferencia bancaria (7 días)'],
      [`ru`, 'Банковский перевод (7 дней)'],
      [`it`, 'Bonifico bancario (7 giorni)'],
      [`sr`, 'Bankovni transfer (7 dana)'],
    ]),
  ],
  [
    `Pickup`,
    new Map([
      [`de`, 'Abholung'],
      [`fr`, 'Retrait sur place'],
      [`es`, 'Recogida'],
      [`ru`, 'Самовывоз'],
      [`it`, 'Ritiro'],
      [`sr`, 'Preuzimanje'],
    ]),
  ],
  [
    `Courier delivery`,
    new Map([
      [`de`, 'Kurierlieferung'],
      [`fr`, 'Livraison par coursier'],
      [`es`, 'Entrega por mensajero'],
      [`ru`, 'Доставка курьером'],
      [`it`, 'Consegna tramite corriere'],
      [`sr`, 'Kurirska dostava'],
    ]),
  ],
  [
    `Please fill in name and phone before placing an order.`,
    new Map([
      [
        `de`,
        'Bitte geben Sie vor der Bestellung Ihren Namen und Ihre Telefonnummer ein.',
      ],
      [
        `fr`,
        'Veuillez saisir votre nom et votre téléphone avant de commander.',
      ],
      [`es`, 'Introduce tu nombre y teléfono antes de realizar el pedido.'],
      [`ru`, 'Перед оформлением заказа укажите имя и телефон.'],
      [`it`, 'Inserisci nome e telefono prima di effettuare l’ordine.'],
      [`sr`, 'Pre slanja porudžbine unesite ime i broj telefona.'],
    ]),
  ],
  [
    `Tool`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Инструмент'],
      [`it`, undefined],
      [`sr`, 'Alat'],
    ]),
  ],
  [
    `Login`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Войти'],
      [`it`, undefined],
      [`sr`, 'Prijava'],
    ]),
  ],
  [
    `page`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'страница'],
      [`it`, undefined],
      [`sr`, 'stranica'],
    ]),
  ],
  [
    `Production of Italian and Russian desserts, cheese and cottage cheese`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Производство итальянских и русских десертов, сыра и творога'],
      [`it`, undefined],
      [`sr`, 'Proizvodnja italijanskih i ruskih deserata i sira'],
    ]),
  ],
  [
    `Crafted with`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сделано с'],
      [`it`, undefined],
      [`sr`, 'Napravljeno sa'],
    ]),
  ],
  [
    `Love`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Любовью'],
      [`it`, undefined],
      [`sr`, 'Ljubavlju'],
    ]),
  ],
  [
    `Baked to Perfection`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Выпечено идеально'],
      [`it`, undefined],
      [`sr`, 'Pečeno do savršenstva'],
    ]),
  ],
  [
    'We produce desserts and cheeses for end consumers, stores, restaurants and catering. Delivery to Pančevo, Belgrade and surrounding areas',
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Мы производим десерты и сыры для конечных потребителей, магазинов, ресторанов и кейтеринга. Доставка по Панчева, Белграду и окрестностям',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Proizvodimo deserte i sireve za krajnje potrošače, prodavnice, restorane i ketering. Dostava u Pančevu, Beogradu i okolini',
      ],
    ]),
  ],
  [
    `Shop Now`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Купить сейчас'],
      [`it`, undefined],
      [`sr`, 'Kupi sada'],
    ]),
  ],
  [
    `Enable push notifications`,
    new Map([
      [`de`, 'Push-Benachrichtigungen aktivieren'],
      [`fr`, 'Activer les notifications push'],
      [`es`, 'Activar las notificaciones push'],
      [`ru`, 'Включить push-уведомления'],
      [`it`, 'Attiva le notifiche push'],
      [`sr`, 'Omogući push obaveštenja'],
    ]),
  ],
  [
    `Push notifications enabled`,
    new Map([
      [`de`, 'Push-Benachrichtigungen aktiviert'],
      [`fr`, 'Notifications push activées'],
      [`es`, 'Notificaciones push activadas'],
      [`ru`, 'Push-уведомления включены'],
      [`it`, 'Notifiche push attivate'],
      [`sr`, 'Push obaveštenja su uključena'],
    ]),
  ],
  [
    `Order a test batch for free`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Заказать тестовую партию бесплатно'],
      [`it`, undefined],
      [`sr`, 'Naručite besplatnu testnu seriju'],
    ]),
  ],
  [
    `Order`,
    new Map([
      [`de`, 'Bestellung'],
      [`fr`, 'Commande'],
      [`es`, 'Pedido'],
      [`ru`, 'Заказ'],
      [`it`, 'Ordine'],
      [`sr`, 'Porudžbina'],
    ]),
  ],
  [
    `Orders`,
    new Map([
      [`de`, 'Bestellungen'],
      [`fr`, 'Commandes'],
      [`es`, 'Pedidos'],
      [`ru`, 'Заказы'],
      [`it`, 'Ordini'],
      [`sr`, 'Porudžbine'],
    ]),
  ],
  [
    `Conversations`,
    new Map([
      [`de`, 'Unterhaltungen'],
      [`fr`, 'Conversations'],
      [`es`, 'Conversaciones'],
      [`ru`, 'Переписки'],
      [`it`, 'Conversazioni'],
      [`sr`, 'Razgovori'],
    ]),
  ],
  [
    `Settings`,
    new Map([
      [`de`, 'Einstellungen'],
      [`fr`, 'Paramètres'],
      [`es`, 'Ajustes'],
      [`ru`, 'Настройки'],
      [`it`, 'Impostazioni'],
      [`sr`, 'Podešavanja'],
    ]),
  ],
  [
    `Order details`,
    new Map([
      [`de`, 'Bestelldetails'],
      [`fr`, 'Détails de la commande'],
      [`es`, 'Detalles del pedido'],
      [`ru`, 'Детали заказа'],
      [`it`, "Dettagli dell'ordine"],
      [`sr`, 'Detalji porudžbine'],
    ]),
  ],
  [
    `Close order details`,
    new Map([
      [`de`, 'Bestelldetails schließen'],
      [`fr`, 'Fermer les détails de la commande'],
      [`es`, 'Cerrar detalles del pedido'],
      [`ru`, 'Закрыть сведения о заказе'],
      [`it`, "Chiudi i dettagli dell'ordine"],
      [`sr`, 'Zatvori detalje porudžbine'],
    ]),
  ],
  [
    `Order date`,
    new Map([
      [`de`, 'Bestelldatum'],
      [`fr`, 'Date de la commande'],
      [`es`, 'Fecha del pedido'],
      [`ru`, 'Дата заказа'],
      [`it`, "Data dell'ordine"],
      [`sr`, 'Datum porudžbine'],
    ]),
  ],
  [
    `Order not found`,
    new Map([
      [`de`, 'Bestellung nicht gefunden'],
      [`fr`, 'Commande introuvable'],
      [`es`, 'No se encontró el pedido'],
      [`ru`, 'Заказ не найден'],
      [`it`, 'Ordine non trovato'],
      [`sr`, 'Porudžbina nije pronađena'],
    ]),
  ],
  [
    `Loading order...`,
    new Map([
      [`de`, 'Bestellung wird geladen...'],
      [`fr`, 'Chargement de la commande...'],
      [`es`, 'Cargando pedido...'],
      [`ru`, 'Загрузка заказа...'],
      [`it`, 'Caricamento ordine...'],
      [`sr`, 'Učitavanje porudžbine...'],
    ]),
  ],
  [
    `Failed to load order`,
    new Map([
      [`de`, 'Bestellung konnte nicht geladen werden'],
      [`fr`, 'Échec du chargement de la commande'],
      [`es`, 'No se pudo cargar el pedido'],
      [`ru`, 'Не удалось загрузить заказ'],
      [`it`, "Impossibile caricare l'ordine"],
      [`sr`, 'Porudžbina nije mogla da se učita'],
    ]),
  ],
  [
    `Product unavailable`,
    new Map([
      [`de`, 'Produkt nicht verfügbar'],
      [`fr`, 'Produit indisponible'],
      [`es`, 'Producto no disponible'],
      [`ru`, 'Товар недоступен'],
      [`it`, 'Prodotto non disponibile'],
      [`sr`, 'Proizvod nije dostupan'],
    ]),
  ],
  [
    `Quantity`,
    new Map([
      [`de`, 'Menge'],
      [`fr`, 'Quantité'],
      [`es`, 'Cantidad'],
      [`ru`, 'Количество'],
      [`it`, 'Quantità'],
      [`sr`, 'Količina'],
    ]),
  ],
  [
    `Unit price`,
    new Map([
      [`de`, 'Stückpreis'],
      [`fr`, 'Prix unitaire'],
      [`es`, 'Precio unitario'],
      [`ru`, 'Цена за единицу'],
      [`it`, 'Prezzo unitario'],
      [`sr`, 'Cena po jedinici'],
    ]),
  ],
  [
    `Total`,
    new Map([
      [`de`, 'Gesamt'],
      [`fr`, 'Total'],
      [`es`, 'Total'],
      [`ru`, 'Итого'],
      [`it`, 'Totale'],
      [`sr`, 'Ukupno'],
    ]),
  ],
  [
    `Delivery address`,
    new Map([
      [`de`, 'Lieferadresse'],
      [`fr`, 'Adresse de livraison'],
      [`es`, 'Dirección de entrega'],
      [`ru`, 'Адрес доставки'],
      [`it`, 'Indirizzo di consegna'],
      [`sr`, 'Adresa za isporuku'],
    ]),
  ],
  [
    `Shipping method`,
    new Map([
      [`de`, 'Versandart'],
      [`fr`, 'Mode de livraison'],
      [`es`, 'Método de envío'],
      [`ru`, 'Способ доставки'],
      [`it`, 'Metodo di spedizione'],
      [`sr`, 'Način isporuke'],
    ]),
  ],
  [
    `Payment method`,
    new Map([
      [`de`, 'Zahlungsmethode'],
      [`fr`, 'Mode de paiement'],
      [`es`, 'Método de pago'],
      [`ru`, 'Способ оплаты'],
      [`it`, 'Metodo di pagamento'],
      [`sr`, 'Način plaćanja'],
    ]),
  ],
  [
    `Tracking number`,
    new Map([
      [`de`, 'Sendungsnummer'],
      [`fr`, 'Numéro de suivi'],
      [`es`, 'Número de seguimiento'],
      [`ru`, 'Номер отслеживания'],
      [`it`, 'Numero di tracciamento'],
      [`sr`, 'Broj za praćenje'],
    ]),
  ],
  [
    `DRAFT`,
    new Map([
      [`de`, 'Entwurf'],
      [`fr`, 'Brouillon'],
      [`es`, 'Borrador'],
      [`ru`, 'Черновик'],
      [`it`, 'Bozza'],
      [`sr`, 'Nacrt'],
    ]),
  ],
  [
    `CONFIRMED`,
    new Map([
      [`de`, 'Bestätigt'],
      [`fr`, 'Confirmée'],
      [`es`, 'Confirmado'],
      [`ru`, 'Подтверждён'],
      [`it`, 'Confermato'],
      [`sr`, 'Potvrđena'],
    ]),
  ],
  [
    `IN_PRODUCTION`,
    new Map([
      [`de`, 'In Produktion'],
      [`fr`, 'En production'],
      [`es`, 'En producción'],
      [`ru`, 'В производстве'],
      [`it`, 'In produzione'],
      [`sr`, 'U proizvodnji'],
    ]),
  ],
  [
    `READY`,
    new Map([
      [`de`, 'Bereit'],
      [`fr`, 'Prête'],
      [`es`, 'Listo'],
      [`ru`, 'Готов'],
      [`it`, 'Pronto'],
      [`sr`, 'Spremna'],
    ]),
  ],
  [
    `SHIPPED`,
    new Map([
      [`de`, 'Versandt'],
      [`fr`, 'Expédiée'],
      [`es`, 'Enviado'],
      [`ru`, 'Отправлен'],
      [`it`, 'Spedito'],
      [`sr`, 'Poslata'],
    ]),
  ],
  [
    `COMPLETED`,
    new Map([
      [`de`, 'Abgeschlossen'],
      [`fr`, 'Terminée'],
      [`es`, 'Completado'],
      [`ru`, 'Завершён'],
      [`it`, 'Completato'],
      [`sr`, 'Završena'],
    ]),
  ],
  [
    `CANCELLED`,
    new Map([
      [`de`, 'Storniert'],
      [`fr`, 'Annulée'],
      [`es`, 'Cancelado'],
      [`ru`, 'Отменён'],
      [`it`, 'Annullato'],
      [`sr`, 'Otkazana'],
    ]),
  ],
  [
    `Our Story`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Наша история'],
      [`it`, undefined],
      [`sr`, 'Naša priča'],
    ]),
  ],
  [
    `Login as a legal entity to get great prices`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Войдите как юридическое лицо, чтобы получить отличные цены'],
      [`it`, undefined],
      [`sr`, 'Prijavite se kao pravno lice da biste dobili odlične cene'],
    ]),
  ],
  [
    `Language`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Язык'],
      [`it`, undefined],
      [`sr`, 'Jezik'],
    ]),
  ],
  [
    `Basket`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Корзина'],
      [`it`, undefined],
      [`sr`, 'Korpa'],
    ]),
  ],
  [
    `Our Menu`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Наше меню'],
      [`it`, undefined],
      [`sr`, 'Naš meni'],
    ]),
  ],
  [
    `Fresh Every Day`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Свежие каждый день'],
      [`it`, undefined],
      [`sr`, 'Sveže svaki dan'],
    ]),
  ],
  [
    `Everything is made in small batches from the finest ingredients. Order before noon for same-day delivery.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Все делается небольшими партиями из лучших ингредиентов. Заказывайте до полудня для доставки в тот же день.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Sve se pravi u malim serijama od najboljih sastojaka. Poručite pre podne za isporuku istog dana.',
      ],
    ]),
  ],
  [
    `You are logged in as a legal entity and we guarantee you have the best prices.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Вы вошли как юридическое лицо, и мы гарантируем вам лучшие цены.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Prijavljeni ste kao pravno lice i garantujemo vam najbolje cene.',
      ],
    ]),
  ],
  [
    `Call us to get an even bigger discount`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Позвоните нам, чтобы получить еще большую скидку'],
      [`it`, undefined],
      [`sr`, 'Pozovite nas da biste dobili još veću popust'],
    ]),
  ],
  [
    `Desserts`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Десерты'],
      [`it`, undefined],
      [`sr`, 'Deserti'],
    ]),
  ],
  [
    `Cheeses`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сыры'],
      [`it`, undefined],
      [`sr`, 'Sirevi'],
    ]),
  ],
  [
    `Related`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сопутствующие'],
      [`it`, undefined],
      [`sr`, 'Prateći'],
    ]),
  ],
  [
    `Weight (g)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Вес (г)'],
      [`it`, undefined],
      [`sr`, 'Težina (g)'],
    ]),
  ],
  [
    `Type grams`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Введите граммы'],
      [`it`, undefined],
      [`sr`, 'Unesite grame'],
    ]),
  ],
  [
    `Weight in grams is required.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Вес в граммах обязателен.'],
      [`it`, undefined],
      [`sr`, 'Težina u gramima je obavezna.'],
    ]),
  ],
  [
    `Add to basket`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Добавить в корзину'],
      [`it`, undefined],
      [`sr`, 'Dodaj u korpu'],
    ]),
  ],
  [
    `Classic Italian dessert with mascarpone cream, espresso-soaked ladyfingers and a dusting of dark cocoa.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Классический итальянский десерт с кремом из маскарпоне, пропитанными эспрессо печеньями и посыпкой из темного какао.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Klasični italijanski desert sa kremom od maskarponea, piškotama natopljenim espresom i posipom od tamnog kakaa.',
      ],
    ]),
  ],
  [
    `Pasterita`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Пастерита'],
      [`it`, undefined],
      [`sr`, 'Pasterita'],
    ]),
  ],
  [
    `A sphere of wonderful savoyardi, mascarpone, and almond tastes. The perfect balance of sweetness and bitterness, with a hint of almond.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Сфера замечательных савоярди, маскарпоне и миндальных вкусов. Идеальный баланс сладости и горечи с намеком на миндаль.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Sfera divnih savojardi, maskarponea i bademovih ukusa. Savršen balans slatkoće i gorčine, sa primesom badema.',
      ],
    ]),
  ],
  [
    `Cheesecake`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Чизкейк'],
      [`it`, undefined],
      [`sr`, 'Čizkejk'],
    ]),
  ],
  [
    `Creamy baked cheesecake on a buttery biscuit base with a smooth texture and balanced sweetness.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Сливочный запеченный чизкейк на масляной основе из печенья с гладкой текстурой и сбалансированной сладостью.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Kremasti pečeni čizkejk na maslenoj podlozi od keksa sa glatkom teksturom i uravnoteđenom slatkoćom.',
      ],
    ]),
  ],
  [
    `Panakota`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Панакота'],
      [`it`, undefined],
      [`sr`, 'Panakota'],
    ]),
  ],
  [
    `Silky milk cream dessert set cold and served with a gentle berry note for a clean finish.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Шелковистый десерт из молочного крема, охлажденный и поданный с нежной ягодной ноткой для чистого завершения.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Svilenkasti desert od mlečne kreme, poslužen hladan sa blagom notom bobičastog voća za čist završetak.',
      ],
    ]),
  ],
  [
    `Prunes and walnuts in chocolate`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Чернослив и грецкие орехи в шоколаде'],
      [`it`, undefined],
      [`sr`, 'Suve šljive i orasi u čokoladi'],
    ]),
  ],
  [
    `Tender prunes and crunchy walnuts coated in smooth milk chocolate for a rich balanced bite.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Нежные черносливы и хрустящие грецкие орехи в гладком молочном шоколаде для богатого сбалансированного вкуса.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Nježne suve šljive i hrskavi orasi u glatkoj mlečnoj čokoladi za bogat i uravnotežen zalogaj.',
      ],
    ]),
  ],
  [
    `Cheesecake glazed in milk chocolate`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Чизкейк в молочном шоколаде'],
      [`it`, undefined],
      [`sr`, 'Čizkejk u mlečnoj čokoladi'],
    ]),
  ],
  [
    `Creamy cheesecake finished with a smooth milk chocolate glaze for a richer and more indulgent taste.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Кремовый чизкейк, покрытый гладкой глазурью из молочного шоколада для более насыщенного и изысканного вкуса.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Kremasti čizkejk završen glatkom mlečnom čokoladnom glazurom za bogatiji i raskošniji ukus.',
      ],
    ]),
  ],
  [
    `Kordiale`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Кордиале'],
      [`it`, undefined],
      [`sr`, 'Kordiale'],
    ]),
  ],
  [
    `Biscuit dessert with cream, mascarpone, and lemon or rum. A refreshing treat with a zesty twist, perfect for any occasion.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Печенье с кремом, маскарпоне и лимоном или ромом. Освежающее угощение с пикантной ноткой, идеально для любого случая.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Keks desert sa kremom, maskarponeom i limunom ili rumom. Osvežavajući užitak sa začinjenim twistom, savršen za svaku priliku.',
      ],
    ]),
  ],
  [
    `Postcard Male is waiting`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Открытка Мужчина ждет'],
      [`it`, undefined],
      [`sr`, 'Razglednica Muškarac čeka'],
    ]),
  ],
  [
    `Decorative postcard for gift orders with an elegant masculine visual style and personalized message area.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Декоративная открытка для подарочных заказов с элегантным мужским визуальным стилем и персонализированной областью для сообщений.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Dekorativna razglednica za poklon narudžbine sa elegantnim muškim vizuelnim stilom i personalizovanim prostorom za poruke.',
      ],
    ]),
  ],
  [
    `Postcard Female is waiting`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Открытка Женщина ждет'],
      [`it`, undefined],
      [`sr`, 'Razglednica Žena čeka'],
    ]),
  ],
  [
    `Decorative postcard for gift orders with a feminine visual style and space for a custom note.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Декоративная открытка для подарочных заказов с женским визуальным стилем и местом для персонализированной заметки.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Dekorativna razglednica za poklon narudžbine sa ženskim vizuelnim stilom i prostorom za prilagođenu poruku.',
      ],
    ]),
  ],
  [
    `Postcard bread and sausage`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Открытка Хлеб и колбаса'],
      [`it`, undefined],
      [`sr`, 'Razglednica Hleb i kobasica'],
    ]),
  ],
  [
    `Fun themed postcard featuring bread and sausage illustration for playful gift presentations.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Веселая тематическая открытка с иллюстрацией хлеба и колбасы для игривых подарочных презентаций.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Zabavna tematska razglednica sa ilustracijom hleba i kobasice za razigrane poklon prezentacije.',
      ],
    ]),
  ],
  [
    `Mascarpone`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Маскарпоне'],
      [`it`, undefined],
      [`sr`, 'Maskarpone'],
    ]),
  ],
  [
    `Rich Italian cream cheese with a silky texture, ideal for desserts, fillings and breakfast spreads.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Богатый итальянский сливочный сыр с шелковистой текстурой, идеально подходит для десертов, начинок и завтраков.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Bogati italijanski krem sir sa svilenkastom teksturom, idealan za deserte, filove i doručke.',
      ],
    ]),
  ],
  [
    `Ricotta`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Рикотта'],
      [`it`, undefined],
      [`sr`, 'Rikota'],
    ]),
  ],
  [
    `Fresh, delicate whey cheese with a light milky flavour for pastries, pasta and savoury plates.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Свежий, нежный сывороточный сыр с легким молочным вкусом, идеально подходит для выпечки, пасты и соленых блюд.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Svež, delikatan sir od surutke sa blagim mlečnim ukusom, idealan za peciva, testenine i slana jela.',
      ],
    ]),
  ],
  [
    `Philadelphia`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Филадельфия'],
      [`it`, undefined],
      [`sr`, 'Filadelfija'],
    ]),
  ],
  [
    `Smooth cream cheese with a balanced tang, perfect for cheesecakes, dips and sandwiches.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Гладкий сливочный сыр с сбалансированной кислинкой, идеально подходит для чизкейков, соусов и сэндвичей.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Glatki krem sir sa uravnoteženom kiselinom, savršen za čizkejkove, umake i sendviče.',
      ],
    ]),
  ],
  [
    `Cottage Cheese`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Творог'],
      [`it`, undefined],
      [`sr`, 'Sveži sir'],
    ]),
  ],
  [
    `Soft curds with a clean, creamy taste, well suited for breakfast bowls and light desserts.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Мягкий творог с чистым, кремовым вкусом, идеально подходит для завтраков и легких десертов.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Mekani sir sa čistim, kremastim ukusom, pogodan za doručak i lagane deserte.',
      ],
    ]),
  ],
  [
    `Large Curd Cheese`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Творог с крупными зернами'],
      [`it`, undefined],
      [`sr`, 'Sir sa velikim grudvicama'],
    ]),
  ],
  [
    `Generous curds with a hearty dairy character, excellent for baking, pancakes and family breakfasts.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Щедрые творожные зерна с насыщенным молочным вкусом, отлично подходят для выпечки, блинов и семейных завтраков.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Velike grudvice s bogatim mlečnim karakterom, odlične za pečenje, palačinke i porodične doručke.',
      ],
    ]),
  ],
  [
    `Orange sauce`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Апельсиновый соус'],
      [`it`, undefined],
      [`sr`, 'Sos od narandže'],
    ]),
  ],
  [
    `Apple sauce`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Яблочный соус'],
      [`it`, undefined],
      [`sr`, 'Sos od jabuke'],
    ]),
  ],
  [
    `Fruit sauce`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Фруктовый соус'],
      [`it`, undefined],
      [`sr`, 'Voćni sos'],
    ]),
  ],
  [
    `White chocolade`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Белый шоколад'],
      [`it`, undefined],
      [`sr`, 'Beli čokolada'],
    ]),
  ],
  [
    `Milk chokolade`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Молочный шоколад'],
      [`it`, undefined],
      [`sr`, 'Mlečna čokolada'],
    ]),
  ],
  [
    `Dark chokolade (Lenten)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Темный шоколад (постный)'],
      [`it`, undefined],
      [`sr`, 'Tamna čokolada (postna)'],
    ]),
  ],
  [
    `Lemon`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Лимон'],
      [`it`, undefined],
      [`sr`, 'Limun'],
    ]),
  ],
  [
    `Rum`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Ром'],
      [`it`, undefined],
      [`sr`, 'Rum'],
    ]),
  ],
  [
    `Cube`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Кубик'],
      [`it`, undefined],
      [`sr`, 'Kocka'],
    ]),
  ],
  [
    `Star`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Звезда'],
      [`it`, undefined],
      [`sr`, 'Zvezda'],
    ]),
  ],
  [
    `Classic`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Классический'],
      [`it`, undefined],
      [`sr`, 'Klasičan'],
    ]),
  ],
  [
    `Pickup or Straight to Your Door`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Доставка или самовывоз'],
      [`it`, undefined],
      [`sr`, 'Dostava ili preuzimanje'],
    ]),
  ],
  [
    `We handle every detail so your desserts arrive as beautiful as they left our kitchen. Delivery to Pančevo, Belgrade and surrounding areas.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Мы заботимся о каждой детали, чтобы ваши десерты прибыли такими же красивыми, какими они покинули нашу кухню. Доставка по Панчево, Белграду и окрестностям.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Brinemo o svakom detalju kako bi vaši deserti stigli jednako lepi kao što su napustili našu kuhinju. Dostava u Pančevu, Beogradu i okolini.',
      ],
    ]),
  ],
  [
    `We will deliver any order within 24 hours`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Мы доставим любой заказ в течение 24 часов'],
      [`it`, undefined],
      [`sr`, 'Dostavljamo bilo koji zahtev u roku od 24 sata'],
    ]),
  ],
  [
    `We recommend placing orders at least 24 hours in advance to ensure the freshest delivery experience`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Мы рекомендуем размещать заказы как минимум за 24 часа, чтобы обеспечить наивысшую свежесть доставки',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Preporučujemo da narudžbine budu izvršene najmanje 24 sata unapred kako bi se osigurala najviša svežina dostave',
      ],
    ]),
  ],
  [
    `Secure Packaging`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Безопасная упаковка'],
      [`it`, undefined],
      [`sr`, 'Sigurno pakovanje'],
    ]),
  ],
  [
    `Every order is packed in temperature-controlled, eco-friendly boxes to arrive perfect`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Каждый заказ упакован в термоконтролируемые, экологически чистые коробки, чтобы прибыть в идеальном состоянии',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Svaka porudžbina je upakovana u kutije sa kontrolisanom temperaturom, ekološki prihvatljive, kako bi stigla savršena',
      ],
    ]),
  ],
  [
    `City-Wide Coverage`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Покрытие по всему городу'],
      [`it`, undefined],
      [`sr`, 'Pokriće širom grada'],
    ]),
  ],
  [
    `We deliver across Pančevo (for free), Belgrade (345 din) and surrounding areas (call). Please enter your postal code at checkout to confirm availability`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Мы доставляем по Панчево (бесплатно), Белграду (345 дин) и окрестностям (звоните). Пожалуйста, введите ваш почтовый индекс при оформлении заказа, чтобы подтвердить доступность',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Dostavljamo u Pančevu (besplatno), Beogradu (345 din) i okolnim područjima (pozovite). Molimo unesite vaš poštanski broj prilikom plaćanja kako biste potvrdili dostupnost',
      ],
    ]),
  ],
  [
    `Frozen syrniki`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сырники замороженные'],
      [`it`, undefined],
      [`sr`, 'Zamrznuti sirnjikji'],
    ]),
  ],
  [
    `Russian Breakfast. Low-Calorie Dessert`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Русский завтрак. Низкокалорийный десерт'],
      [`it`, undefined],
      [`sr`, 'Ruski doručak. Niskokalorični desert.'],
    ]),
  ],
  [
    `4 pieces`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, '4 штуки'],
      [`it`, undefined],
      [`sr`, '4 komada'],
    ]),
  ],
  [
    `2 pieces`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, '2 штуки'],
      [`it`, undefined],
      [`sr`, '2 komada'],
    ]),
  ],
  [
    `4 pieces with apple or strawberry mousse`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, '4 штуки с яблочным или клубничным муссом'],
      [`it`, undefined],
      [`sr`, '4 komada sa musom od jabuka ili jagoda'],
    ]),
  ],
  [
    `Here are some recipes for cooking. Please read them carefully to ensure perfect results that will delight you and your family.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Здесь находятся рецепты приготовления блюд. Пожалуйста, прочитайте внимательно, чтобы получить идеальный результат, который порадует Вас и Вашу семью',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Evo nekoliko recepata za kuvanje. Pažljivo ih pročitajte kako biste osigurali savršene rezultate koji će oduševiti vas i vašu porodicu.',
      ],
    ]),
  ],
  [
    `<p>Syrniki are a traditional Russian breakfast. They are made with cottage cheese, flour, and egg. They are fried in a frying pan with a small amount of refined sunflower oil until done. We sell frozen, vacuum-packed syrniki. </p><p>1) Heat a frying pan of sufficient size and pour in some refined vegetable oil, </p><p>2) Reduce heat to low, </p><p>3) Place the frozen or thawed syrniki in the pan and fry for 7 minutes on each side. If the syrniki are frozen, cover the pan with a lid. </p><p>4) Bake the syrniki until smooth (they shouldn't be runny inside). </p><p>5) Serve with sour cream, sweetened condensed milk, or fruit or berry puree.</p>`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        '<p>Сырники это традиционный русский завтрак. Сырники готовятся из творога, муки и яйца. Сырники необходимо обжарить до готовности на сковороде с небольшим количеством рафинированного подсолнечного масла. Мы продаем сырники в замороженном виде в вакуумной упаковке. </p><p>1) разогрейте сковороду достаточного размера и налейте немного рафинированного растительного масла, </p><p>2) сделайте малый огонь, </p><p>3) выложите замороженные или размороженные сырники на сковороду и обжаривайте на каждой стороне по 7 минут, если сырники заморожены, то накройте сковороду крышкой, </p><p>4) пропеките сырники до однородной консистенции (внутри они не должны быть жидкими), </p><p>5) подавайте сырники со сметаной, сладким сгущеным молоком или фруктовым или ягодным пюре.</p>',
      ],
      [`it`, undefined],
      [
        `sr`,
        '<p>Sirnici su tradicionalni ruski doručak. Prave se od svežeg sira, brašna i jajeta. Prže se u tiganju sa malom količinom rafinisanog suncokretovog ulja dok ne budu gotovi. Prodajemo zamrznute, vakuumski upakovane sirnike. </p><p>1) Zagrejte tiganj dovoljne veličine i sipajte malo rafinisanog biljnog ulja, </p><p>2) Smanjite vatru na najslabije, </p><p>3) Stavite zamrznute ili odmrznute sirnike u tiganj i pržite 7 minuta sa svake strane. Ako su sirnici zamrznuti, pokrijte tiganj poklopcem. </p><p>4) Pecite sirnike dok ne postanu glatki (ne smeju biti tečni unutra). </p><p>5) Poslužite sa pavlakom, zaslađenim kondenzovanim mlekom ili pireom od voća ili bobičastog voća.</p>',
      ],
    ]),
  ],
  [
    `Ready-to-eat soups`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Супы, готовые к употреблению'],
      [`it`, undefined],
      [`sr`, 'Supe spremne za jelo'],
    ]),
  ],
  [
    `Recipes`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Рецепты'],
      [`it`, undefined],
      [`sr`, 'Recepti'],
    ]),
  ],
  [
    `<p>All soups are cooked below 100°C to preserve the beneficial properties of all ingredients. Therefore, we recommend using one of two serving methods.</p><p>

Method 1. Suitable for most users. Use kitchen scissors to cut off one end of the bag and pour the contents into a saucepan or sauté pan. Heat the soup to 60°C and ladle into bowls.</p><p>

Method 2. For professionals only. Heat water in a saucepan or sauté pan and immerse the bag of soup in it. Once the bag reaches 60°C, remove the bag from the hot water, cut off one end of the bag, and pour the contents into a bowl. CAUTION! The contents of the bag will be hot, so handle with care. Avoid burns!</p><p>

DO NOT microwave the bag. If using a microwave, first empty the contents of the bag into a bowl and reheat the soup in the bowl.</p><p>

We do not recommend reheating our dishes in a microwave oven, as microwaves cause electric current to flow through the liquid, which can trigger unexpected chemical reactions. Microwaves inside the oven, due to numerous reflections from the walls, create standing waves, leading to uneven heating of the soup, even as the plate rotates within the oven. This results in localized overheating, which can negatively impact the quality of the dish.</p>`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        `<p>Все супы готовятся при температуре ниже 100°C, чтобы сохранить полезные свойства всех ингредиентов. Поэтому мы рекомендуем использовать один из двух способов сервировки.</p><p>

Способ 1. Подходит для большинства пользователей. Кухонными ножницами отрежьте один край пакета и вылейте содержимое в кастрюлю или сотейник. Нагрейте суп до 60°C и разлейте по тарелкам.</p><p>

Способ 2. Только для профессионалов. Нагрейте воду в кастрюле или сотейнике и погрузите в нее пакет с супом. Как только пакет нагреется до 60°C, выньте пакет из горячей воды, отрежьте один край пакета и вылейте содержимое в тарелку. ВНИМАНИЕ! Содержимое пакета будет горячим, поэтому обращайтесь с ним осторожно. Берегитесь ожогов!</p><p>

ЗАПРЕЩЕНО разогревать пакет в микроволновой печи. Если используете микроволновую печь, то предварительно вылейте содержимое пакета в тарелку и разогревайте суп в тарелке. </p><p>

Мы не рекомендуем разогрев изготовленных нами блюд в микроволновой печи, так как СВЧ приводит к протеканию электрического тока в жидкости, что порождает самые неожиданные химические реакции. СВЧ внутри печи из-за многочисленных отражений от стенок внутри формирует стоячие волны, что приводит к неравномерному нагреванию супа даже в процессе вращения тарелки внутри печи. В результате возникают локальные перегревы, что может негативно сказаться на свойствах блюда</p>`,
      ],
      [`it`, undefined],
      [
        `sr`,
        `<p>Sve supe se kuvaju na temperaturi ispod 100°C kako bi se sačuvala korisna svojstva svih sastojaka. Stoga preporučujemo upotrebu jednog od dva načina serviranja.</p><p>

Metod 1. Pogodno za većinu korisnika. Kuhinjskim makazama odsecite jedan kraj kesice i sipajte sadržaj u šerpu ili tiganj. Zagrejte supu na 60°C i sipajte u činije.</p><p>

Metod 2. Samo za profesionalce. Zagrejte vodu u šerpi ili tiganju i potopite kesicu supe u nju. Kada kesica dostigne 60°C, izvadite kesicu iz vrele vode, odsecite jedan kraj kesice i sipajte sadržaj u činiju. OPREZ! Sadržaj kesice će biti vruć, zato pažljivo rukujte. Izbegavajte opekotine!</p><p>

NE zagrevajte kesicu u mikrotalasnoj pećnici. Ako koristite mikrotalasnu, prvo ispraznite sadržaj kesice u činiju i ponovo zagrejte supu u činiji.</p><p>

Ne preporučujemo ponovno zagrevanje jela u mikrotalasnoj pećnici, jer mikrotalasi izazivaju protok električne struje kroz tečnost, što može izazvati neočekivane hemijske reakcije. Mikrotalasi unutar rerne, zbog brojnih refleksija od zidova, stvaraju stojeće talase, što dovodi do neravnomernog zagrevanja supe, čak i dok se tanjir okreće unutar rerne. To rezultira lokalizovanim pregrevanjem, što može negativno uticati na kvalitet jela</p>`,
      ],
    ]),
  ],
  [
    `Syrniki`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сырники'],
      [`it`, undefined],
      [`sr`, 'Sirnjikji'],
    ]),
  ],
  [
    `Soups`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Супы'],
      [`it`, undefined],
      [`sr`, 'Supe'],
    ]),
  ],
  [
    `Beef soup (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Суп из телятины (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Teleća čorba (gotova za jelo)'],
    ]),
  ],
  [
    `Sea fish soup (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Уха (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Riblja čorba (gotova za jelo)'],
    ]),
  ],
  [
    `Borshch (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Борщ (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Boršč (gotova za jelo)'],
    ]),
  ],
  [
    `Solyanka (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Солянка (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Soljanka (gotova za jelo)'],
    ]),
  ],
  [
    `Krem supa sa piletinom i spanaćem (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Сливочный суп с курицей и шпинатом (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Krem supa sa piletinom i spanaćem (gotova za jelo)'],
    ]),
  ],
  [
    `Gulaš čorba (Ready-to-eat)`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Суп-гуляш по-венгерски (готов к употреблению)'],
      [`it`, undefined],
      [`sr`, 'Gulaš čorba (gotova za jelo)'],
    ]),
  ],
  [
    `available`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'доступно'],
      [`it`, undefined],
      [`sr`, 'dostupno'],
    ]),
  ],
  [
    `All products`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Все товары'],
      [`it`, undefined],
      [`sr`, 'Svi proizvodi'],
    ]),
  ],
  [
    `Only in stock`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Только в наличии'],
      [`it`, undefined],
      [`sr`, 'Samo na lageru'],
    ]),
  ],
  [
    `Search products...`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Искать продукты...'],
      [`it`, undefined],
      [`sr`, 'Pretraži proizvode...'],
    ]),
  ],
  [
    `Terms of use, payment methods, and refund procedures`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Условия использования, способы оплаты и процедуры возврата'],
      [`it`, undefined],
      [`sr`, 'Uslovi korišćenja, načini plaćanja i procedure povraćaja'],
    ]),
  ],
  [
    `If only items that are in stock are ordered, the order will be delivered within 2 hours`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'Если будут заказаны только доступные товары, заказ будет доставлен в течение 2 часов',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Ako su naručeni samo artikli koji su na lageru, porudžbina će biti isporučena u roku od 2 sata',
      ],
    ]),
  ],
  [
    `We automatically calculate the shipping cost`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Мы автоматически рассчитываем стоимость доставки'],
      [`it`, undefined],
      [`sr`, 'Automatski izračunavamo troškove dostave'],
    ]),
  ],
  [
    `When placing an order, the delivery cost will be shown as a separate line item. The cost is calculated as 200 dinars plus 50 dinars for every kilometer.`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [
        `ru`,
        'При размещении заказа стоимость доставки будет показана как отдельный пункт. Стоимость рассчитывается как 200 динаров плюс 50 динаров за каждый километр.',
      ],
      [`it`, undefined],
      [
        `sr`,
        'Prilikom postavljanja porudžbine, trošak dostave će biti prikazan kao zaseban stavka. Trošak se računa kao 200 dinara plus 50 dinara za svaki kilometar.',
      ],
    ]),
  ],
  [
    `Review the delivery terms and conditions`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Просмотрите условия доставки'],
      [`it`, undefined],
      [`sr`, 'Pregledajte uslove dostave'],
    ]),
  ],
  [
    `Click to view the full delivery terms and conditions`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Нажмите, чтобы просмотреть полные условия доставки'],
      [`it`, undefined],
      [`sr`, 'Kliknite da biste videli kompletne uslove i odredbe isporuke'],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    ``,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, ''],
      [`it`, undefined],
      [`sr`, ''],
    ]),
  ],
  [
    `Staff`,
    new Map([
      [`de`, 'Personal'],
      [`fr`, 'Équipe'],
      [`es`, 'Personal'],
      [`ru`, 'Персонал'],
      [`it`, 'Personale'],
      [`sr`, 'Osoblje'],
    ]),
  ],
  [
    `Customer`,
    new Map([
      [`de`, 'Kunde'],
      [`fr`, 'Client'],
      [`es`, 'Cliente'],
      [`ru`, 'Клиент'],
      [`it`, 'Cliente'],
      [`sr`, 'Kupac'],
    ]),
  ],
  [
    `Product`,
    new Map([
      [`de`, 'Produkt'],
      [`fr`, 'Produit'],
      [`es`, 'Producto'],
      [`ru`, 'Товар'],
      [`it`, 'Prodotto'],
      [`sr`, 'Proizvod'],
    ]),
  ],
  [
    `Yes`,
    new Map([
      [`de`, 'Ja'],
      [`fr`, 'Oui'],
      [`es`, 'Sí'],
      [`ru`, 'Да'],
      [`it`, 'Sì'],
      [`sr`, 'Da'],
    ]),
  ],
  [
    `No`,
    new Map([
      [`de`, 'Nein'],
      [`fr`, 'Non'],
      [`es`, 'No'],
      [`ru`, 'Нет'],
      [`it`, 'No'],
      [`sr`, 'Ne'],
    ]),
  ],
  [
    `Delivery coordinates`,
    new Map([
      [`de`, 'Lieferkoordinaten'],
      [`fr`, 'Coordonnées de livraison'],
      [`es`, 'Coordenadas de entrega'],
      [`ru`, 'Координаты доставки'],
      [`it`, 'Coordinate di consegna'],
      [`sr`, 'Koordinate isporuke'],
    ]),
  ],
  [
    `Ready date`,
    new Map([
      [`de`, 'Fertigstellungsdatum'],
      [`fr`, 'Date de disponibilité'],
      [`es`, 'Fecha de preparación'],
      [`ru`, 'Дата готовности'],
      [`it`, 'Data di disponibilità'],
      [`sr`, 'Datum spremnosti'],
    ]),
  ],
  [
    `Created`,
    new Map([
      [`de`, 'Erstellt'],
      [`fr`, 'Créé'],
      [`es`, 'Creado'],
      [`ru`, 'Создан'],
      [`it`, 'Creato'],
      [`sr`, 'Kreirano'],
    ]),
  ],
  [
    `Updated`,
    new Map([
      [`de`, 'Aktualisiert'],
      [`fr`, 'Mis à jour'],
      [`es`, 'Actualizado'],
      [`ru`, 'Обновлён'],
      [`it`, 'Aggiornato'],
      [`sr`, 'Ažurirano'],
    ]),
  ],
  [
    `Paid`,
    new Map([
      [`de`, 'Bezahlt'],
      [`fr`, 'Payé'],
      [`es`, 'Pagado'],
      [`ru`, 'Оплачен'],
      [`it`, 'Pagato'],
      [`sr`, 'Plaćeno'],
    ]),
  ],
  [
    `Delivery fee`,
    new Map([
      [`de`, 'Liefergebühr'],
      [`fr`, 'Frais de livraison'],
      [`es`, 'Tarifa de entrega'],
      [`ru`, 'Стоимость доставки'],
      [`it`, 'Costo di consegna'],
      [`sr`, 'Cena dostave'],
    ]),
  ],
  [
    `Customer note`,
    new Map([
      [`de`, 'Kundennotiz'],
      [`fr`, 'Note du client'],
      [`es`, 'Nota del cliente'],
      [`ru`, 'Комментарий клиента'],
      [`it`, 'Nota del cliente'],
      [`sr`, 'Napomena kupca'],
    ]),
  ],
  [
    `Variant`,
    new Map([
      [`de`, 'Variante'],
      [`fr`, 'Variante'],
      [`es`, 'Variante'],
      [`ru`, 'Вариант'],
      [`it`, 'Variante'],
      [`sr`, 'Varijanta'],
    ]),
  ],
  [
    `Line total`,
    new Map([
      [`de`, 'Positionssumme'],
      [`fr`, 'Total de la ligne'],
      [`es`, 'Total de línea'],
      [`ru`, 'Сумма по позиции'],
      [`it`, 'Totale riga'],
      [`sr`, 'Ukupno za stavku'],
    ]),
  ],
  [
    `Actions`,
    new Map([
      [`de`, 'Aktionen'],
      [`fr`, 'Actions'],
      [`es`, 'Acciones'],
      [`ru`, 'Действия'],
      [`it`, 'Azioni'],
      [`sr`, 'Akcije'],
    ]),
  ],
  [
    `Hide details`,
    new Map([
      [`de`, 'Details ausblenden'],
      [`fr`, 'Masquer les détails'],
      [`es`, 'Ocultar detalles'],
      [`ru`, 'Скрыть детали'],
      [`it`, 'Nascondi dettagli'],
      [`sr`, 'Sakrij detalje'],
    ]),
  ],
  [
    `View details`,
    new Map([
      [`de`, 'Details ansehen'],
      [`fr`, 'Voir les détails'],
      [`es`, 'Ver detalles'],
      [`ru`, 'Детали'],
      [`it`, 'Visualizza dettagli'],
      [`sr`, 'Prikaži detalje'],
    ]),
  ],
  [
    `Start production`,
    new Map([
      [`de`, 'Produktion starten'],
      [`fr`, 'Lancer la production'],
      [`es`, 'Iniciar producción'],
      [`ru`, 'Начать производство'],
      [`it`, 'Avvia produzione'],
      [`sr`, 'Pokreni proizvodnju'],
    ]),
  ],
  [
    `Starting production...`,
    new Map([
      [`de`, 'Produktion wird gestartet...'],
      [`fr`, 'Démarrage de la production...'],
      [`es`, 'Iniciando producción...'],
      [`ru`, 'Запуск производства...'],
      [`it`, 'Avvio della produzione...'],
      [`sr`, 'Pokretanje proizvodnje...'],
    ]),
  ],
  [
    `Loading orders...`,
    new Map([
      [`de`, 'Bestellungen werden geladen...'],
      [`fr`, 'Chargement des commandes...'],
      [`es`, 'Cargando pedidos...'],
      [`ru`, 'Загрузка заказов...'],
      [`it`, 'Caricamento ordini...'],
      [`sr`, 'Učitavanje porudžbina...'],
    ]),
  ],
  [
    `No orders are available for this location.`,
    new Map([
      [`de`, 'Für diesen Standort sind keine Bestellungen verfügbar.'],
      [`fr`, 'Aucune commande n’est disponible pour cet emplacement.'],
      [`es`, 'No hay pedidos disponibles para esta ubicación.'],
      [`ru`, 'Для этой локации нет заказов.'],
      [`it`, 'Nessun ordine disponibile per questa sede.'],
      [`sr`, 'Nema porudžbina za ovu lokaciju.'],
    ]),
  ],
  [
    `Status`,
    new Map([
      [`de`, 'Status'],
      [`fr`, 'Statut'],
      [`es`, 'Estado'],
      [`ru`, 'Статус'],
      [`it`, 'Stato'],
      [`sr`, 'Status'],
    ]),
  ],
  [
    `Push`,
    new Map([
      [`de`, 'Push'],
      [`fr`, 'Push'],
      [`es`, 'Push'],
      [`ru`, 'Push'],
      [`it`, 'Push'],
      [`sr`, 'Push'],
    ]),
  ],
  [
    `sent`,
    new Map([
      [`de`, 'gesendet'],
      [`fr`, 'envoyée'],
      [`es`, 'enviada'],
      [`ru`, 'отправлено'],
      [`it`, 'inviata'],
      [`sr`, 'poslato'],
    ]),
  ],
  [
    `failed`,
    new Map([
      [`de`, 'fehlgeschlagen'],
      [`fr`, 'échec'],
      [`es`, 'fallida'],
      [`ru`, 'не отправлено'],
      [`it`, 'non inviata'],
      [`sr`, 'nije poslato'],
    ]),
  ],
  [
    `Order moved to production.`,
    new Map([
      [`de`, 'Bestellung in die Produktion übernommen.'],
      [`fr`, 'Commande transférée en production.'],
      [`es`, 'Pedido enviado a producción.'],
      [`ru`, 'Заказ переведён в производство.'],
      [`it`, 'Ordine avviato alla produzione.'],
      [`sr`, 'Porudžbina je prebačena u proizvodnju.'],
    ]),
  ],
  [
    `The server did not return the updated order.`,
    new Map([
      [
        `de`,
        'Der Server hat die aktualisierte Bestellung nicht zurückgegeben.',
      ],
      [`fr`, 'Le serveur n’a pas renvoyé la commande mise à jour.'],
      [`es`, 'El servidor no devolvió el pedido actualizado.'],
      [`ru`, 'Сервер не вернул обновлённый заказ.'],
      [`it`, 'Il server non ha restituito l’ordine aggiornato.'],
      [`sr`, 'Server nije vratio ažuriranu porudžbinu.'],
    ]),
  ],
  [
    `Cancel order`,
    new Map([
      [`de`, 'Bestellung stornieren'],
      [`fr`, 'Annuler la commande'],
      [`es`, 'Cancelar pedido'],
      [`ru`, 'Отменить заказ'],
      [`it`, 'Annulla ordine'],
      [`sr`, 'Otkaži porudžbinu'],
    ]),
  ],
  [
    `Cancelling order...`,
    new Map([
      [`de`, 'Bestellung wird storniert...'],
      [`fr`, 'Annulation de la commande...'],
      [`es`, 'Cancelando pedido...'],
      [`ru`, 'Отмена заказа...'],
      [`it`, 'Annullamento dell’ordine...'],
      [`sr`, 'Otkazivanje porudžbine...'],
    ]),
  ],
  [
    `Are you sure you want to cancel this order?`,
    new Map([
      [`de`, 'Möchten Sie diese Bestellung wirklich stornieren?'],
      [`fr`, 'Voulez-vous vraiment annuler cette commande ?'],
      [`es`, '¿Seguro que quieres cancelar este pedido?'],
      [`ru`, 'Вы действительно хотите отменить этот заказ?'],
      [`it`, 'Vuoi davvero annullare questo ordine?'],
      [`sr`, 'Da li ste sigurni da želite da otkažete ovu porudžbinu?'],
    ]),
  ],
  [
    `Order cancelled.`,
    new Map([
      [`de`, 'Bestellung storniert.'],
      [`fr`, 'Commande annulée.'],
      [`es`, 'Pedido cancelado.'],
      [`ru`, 'Заказ отменён.'],
      [`it`, 'Ordine annullato.'],
      [`sr`, 'Porudžbina je otkazana.'],
    ]),
  ],
  [
    `Active orders`,
    new Map([
      [`de`, 'Aktive Bestellungen'],
      [`fr`, 'Commandes actives'],
      [`es`, 'Pedidos activos'],
      [`ru`, 'Активные заказы'],
      [`it`, 'Ordini attivi'],
      [`sr`, 'Aktivne porudžbine'],
    ]),
  ],
  [
    `All statuses`,
    new Map([
      [`de`, 'Alle Status'],
      [`fr`, 'Tous les statuts'],
      [`es`, 'Todos los estados'],
      [`ru`, 'Все статусы'],
      [`it`, 'Tutti gli stati'],
      [`sr`, 'Svi statusi'],
    ]),
  ],
  [
    `Created from`,
    new Map([
      [`de`, 'Erstellt ab'],
      [`fr`, 'Créé à partir du'],
      [`es`, 'Creado desde'],
      [`ru`, 'Создан с'],
      [`it`, 'Creato dal'],
      [`sr`, 'Kreirano od'],
    ]),
  ],
  [
    `Created to`,
    new Map([
      [`de`, 'Erstellt bis'],
      [`fr`, 'Créé jusqu’au'],
      [`es`, 'Creado hasta'],
      [`ru`, 'Создан по'],
      [`it`, 'Creato fino al'],
      [`sr`, 'Kreirano do'],
    ]),
  ],
  [
    `Customer name`,
    new Map([
      [`de`, 'Kundenname'],
      [`fr`, 'Nom du client'],
      [`es`, 'Nombre del cliente'],
      [`ru`, 'Имя клиента'],
      [`it`, 'Nome del cliente'],
      [`sr`, 'Ime kupca'],
    ]),
  ],
  [
    `Customer phone`,
    new Map([
      [`de`, 'Telefonnummer des Kunden'],
      [`fr`, 'Téléphone du client'],
      [`es`, 'Teléfono del cliente'],
      [`ru`, 'Телефон клиента'],
      [`it`, 'Telefono del cliente'],
      [`sr`, 'Telefon kupca'],
    ]),
  ],
  [
    `No orders match the selected filters.`,
    new Map([
      [`de`, 'Keine Bestellungen entsprechen den ausgewählten Filtern.'],
      [`fr`, 'Aucune commande ne correspond aux filtres sélectionnés.'],
      [`es`, 'Ningún pedido coincide con los filtros seleccionados.'],
      [`ru`, 'По выбранным фильтрам заказов нет.'],
      [`it`, 'Nessun ordine corrisponde ai filtri selezionati.'],
      [`sr`, 'Nema porudžbina prema izabranim filterima.'],
    ]),
  ],
  [
    `Mark as ready`,
    new Map([
      [`de`, 'Als fertig markieren'],
      [`fr`, 'Marquer comme prête'],
      [`es`, 'Marcar como listo'],
      [`ru`, 'Отметить как готовый'],
      [`it`, 'Segna come pronto'],
      [`sr`, 'Označi kao spremno'],
    ]),
  ],
  [
    `Marking as ready...`,
    new Map([
      [`de`, 'Wird als fertig markiert...'],
      [`fr`, 'Marquage comme prête...'],
      [`es`, 'Marcando como listo...'],
      [`ru`, 'Отмечаем как готовый...'],
      [`it`, 'Contrassegnando come pronto...'],
      [`sr`, 'Označavanje kao spremno...'],
    ]),
  ],
  [
    `Order marked ready.`,
    new Map([
      [`de`, 'Bestellung als fertig markiert.'],
      [`fr`, 'Commande marquée comme prête.'],
      [`es`, 'Pedido marcado como listo.'],
      [`ru`, 'Заказ отмечен как готовый.'],
      [`it`, 'Ordine contrassegnato come pronto.'],
      [`sr`, 'Porudžbina je označena kao spremna.'],
    ]),
  ],
  [
    `Toggle order details`,
    new Map([
      [`de`, 'Bestelldetails ein- oder ausblenden'],
      [`fr`, 'Afficher ou masquer les détails de la commande'],
      [`es`, 'Mostrar u ocultar detalles del pedido'],
      [`ru`, 'Показать или скрыть детали заказа'],
      [`it`, 'Mostra o nascondi i dettagli dell’ordine'],
      [`sr`, 'Prikaži ili sakrij detalje porudžbine'],
    ]),
  ],
]);
