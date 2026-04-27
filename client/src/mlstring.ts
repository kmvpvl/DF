//
export type IMLString =
  | string
  | {
      default: string;
      values: [string, string][];
    };
export class MLString extends String {
  private _map?: Map<string, string> = new Map<string, string>();
  constructor();
  constructor(str: string);
  constructor(mlString: IMLString);
  constructor(...arg: any[]) {
    super(
      arg.length === 0
        ? ''
        : typeof arg[0] === 'object'
          ? arg[0].default
          : arg[0]
    );
    switch (arg.length) {
      case 0:
        return;
      case 1:
        if (typeof arg[0] === 'object') {
          this._map = new Map<string, string>(arg[0].map);
        }
    }
  }
  toString(): string;
  toString(lang: string): string;
  toString(...arg: any[]): string | undefined {
    switch (arg.length) {
      case 0:
        return super.toString();
      default:
        return this._map?.has(arg[0])
          ? (this._map.get(arg[0]) as string)
          : super.toString();
    }
  }
  get json(): IMLString {
    return this._map === undefined
      ? this.toString()
      : {
          default: this.toString(),
          values: Array.from(this._map),
        };
  }
  public static getLang(): string {
    const params: string[] = window.location.search.substring(1).split('&');
    let lang = window.navigator.language.split('-')[0];
    const lang_param = params.filter((v) => v.split('=')[0] === 'lang');
    if (lang_param !== undefined && lang_param.length > 0)
      lang = lang_param[0].split('=')[1];
    return lang;
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
    `Order fulfillment period is 24 hours`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Срок выполнения заказа составляет 24 часа'],
      [`it`, undefined],
      [`sr`, 'Rok za ispunjenje porudžbine je 24 sata'],
    ]),
  ],
  [
    `We recommend placing orders at least 24 hours in advance to ensure the freshest delivery experience`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, 'Мы рекомендуем размещать заказы как минимум за 24 часа, чтобы обеспечить наивысшую свежесть доставки'],
      [`it`, undefined],
      [`sr`, 'Preporučujemo da narudžbine budu izvršene najmanje 24 sata unapred kako bi se osigurala najviša svežina dostave'],
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
      [`ru`, 'Каждый заказ упакован в термоконтролируемые, экологически чистые коробки, чтобы прибыть в идеальном состоянии'],
      [`it`, undefined],
      [`sr`, 'Svaka porudžbina je upakovana u kutije sa kontrolisanom temperaturom, ekološki prihvatljive, kako bi stigla savršena'],
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
      [`ru`, 'Мы доставляем по Панчево (бесплатно), Белграду (345 дин) и окрестностям (звоните). Пожалуйста, введите ваш почтовый индекс при оформлении заказа, чтобы подтвердить доступность'],
      [`it`, undefined],
      [`sr`, 'Dostavljamo u Pančevu (besplatno), Beogradu (345 din) i okolnim područjima (pozovite). Molimo unesite vaš poštanski broj prilikom plaćanja kako biste potvrdili dostupnost'],
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
      [`ru`, 'Здесь находятся рецепты приготовления блюд. Пожалуйста, прочитайте внимательно, чтобы получить идеальный результат, который порадует Вас и Вашу семью'],
      [`it`, undefined],
      [`sr`, 'Evo nekoliko recepata za kuvanje. Pažljivo ih pročitajte kako biste osigurali savršene rezultate koji će oduševiti vas i vašu porodicu.'],
    ]),
  ],
  [
    `<p>Syrniki are a traditional Russian breakfast. They are made with cottage cheese, flour, and egg. They are fried in a frying pan with a small amount of refined sunflower oil until done. We sell frozen, vacuum-packed syrniki. </p><p>1) Heat a frying pan of sufficient size and pour in some refined vegetable oil, </p><p>2) Reduce heat to low, </p><p>3) Place the frozen or thawed syrniki in the pan and fry for 7 minutes on each side. If the syrniki are frozen, cover the pan with a lid. </p><p>4) Bake the syrniki until smooth (they shouldn't be runny inside). </p><p>5) Serve with sour cream, sweetened condensed milk, or fruit or berry puree.</p>`,
    new Map([
      [`de`, undefined],
      [`fr`, undefined],
      [`es`, undefined],
      [`ru`, '<p>Сырники это традиционный русский завтрак. Сырники готовятся из творога, муки и яйца. Сырники необходимо обжарить до готовности на сковороде с небольшим количеством рафинированного подсолнечного масла. Мы продаем сырники в замороженном виде в вакуумной упаковке. </p><p>1) разогрейте сковороду достаточного размера и налейте немного рафинированного растительного масла, </p><p>2) сделайте малый огонь, </p><p>3) выложите замороженные или размороженные сырники на сковороду и обжаривайте на каждой стороне по 7 минут, если сырники заморожены, то накройте сковороду крышкой, </p><p>4) пропеките сырники до однородной консистенции (внутри они не должны быть жидкими), </p><p>5) подавайте сырники со сметаной, сладким сгущеным молоком или фруктовым или ягодным пюре.</p>'],
      [`it`, undefined],
      [`sr`, '<p>Sirnici su tradicionalni ruski doručak. Prave se od svežeg sira, brašna i jajeta. Prže se u tiganju sa malom količinom rafinisanog suncokretovog ulja dok ne budu gotovi. Prodajemo zamrznute, vakuumski upakovane sirnike. </p><p>1) Zagrejte tiganj dovoljne veličine i sipajte malo rafinisanog biljnog ulja, </p><p>2) Smanjite vatru na najslabije, </p><p>3) Stavite zamrznute ili odmrznute sirnike u tiganj i pržite 7 minuta sa svake strane. Ako su sirnici zamrznuti, pokrijte tiganj poklopcem. </p><p>4) Pecite sirnike dok ne postanu glatki (ne smeju biti tečni unutra). </p><p>5) Poslužite sa pavlakom, zaslađenim kondenzovanim mlekom ili pireom od voća ili bobičastog voća.</p>'],
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
      [`ru`, `<p>Все супы готовятся при температуре ниже 100°C, чтобы сохранить полезные свойства всех ингредиентов. Поэтому мы рекомендуем использовать один из двух способов сервировки.</p><p>

Способ 1. Подходит для большинства пользователей. Кухонными ножницами отрежьте один край пакета и вылейте содержимое в кастрюлю или сотейник. Нагрейте суп до 60°C и разлейте по тарелкам.</p><p>

Способ 2. Только для профессионалов. Нагрейте воду в кастрюле или сотейнике и погрузите в нее пакет с супом. Как только пакет нагреется до 60°C, выньте пакет из горячей воды, отрежьте один край пакета и вылейте содержимое в тарелку. ВНИМАНИЕ! Содержимое пакета будет горячим, поэтому обращайтесь с ним осторожно. Берегитесь ожогов!</p><p>

ЗАПРЕЩЕНО разогревать пакет в микроволновой печи. Если используете микроволновую печь, то предварительно вылейте содержимое пакета в тарелку и разогревайте суп в тарелке. </p><p>

Мы не рекомендуем разогрев изготовленных нами блюд в микроволновой печи, так как СВЧ приводит к протеканию электрического тока в жидкости, что порождает самые неожиданные химические реакции. СВЧ внутри печи из-за многочисленных отражений от стенок внутри формирует стоячие волны, что приводит к неравномерному нагреванию супа даже в процессе вращения тарелки внутри печи. В результате возникают локальные перегревы, что может негативно сказаться на свойствах блюда</p>`],
      [`it`, undefined],
      [`sr`, `<p>Sve supe se kuvaju na temperaturi ispod 100°C kako bi se sačuvala korisna svojstva svih sastojaka. Stoga preporučujemo upotrebu jednog od dva načina serviranja.</p><p>

Metod 1. Pogodno za većinu korisnika. Kuhinjskim makazama odsecite jedan kraj kesice i sipajte sadržaj u šerpu ili tiganj. Zagrejte supu na 60°C i sipajte u činije.</p><p>

Metod 2. Samo za profesionalce. Zagrejte vodu u šerpi ili tiganju i potopite kesicu supe u nju. Kada kesica dostigne 60°C, izvadite kesicu iz vrele vode, odsecite jedan kraj kesice i sipajte sadržaj u činiju. OPREZ! Sadržaj kesice će biti vruć, zato pažljivo rukujte. Izbegavajte opekotine!</p><p>

NE zagrevajte kesicu u mikrotalasnoj pećnici. Ako koristite mikrotalasnu, prvo ispraznite sadržaj kesice u činiju i ponovo zagrejte supu u činiji.</p><p>

Ne preporučujemo ponovno zagrevanje jela u mikrotalasnoj pećnici, jer mikrotalasi izazivaju protok električne struje kroz tečnost, što može izazvati neočekivane hemijske reakcije. Mikrotalasi unutar rerne, zbog brojnih refleksija od zidova, stvaraju stojeće talase, što dovodi do neravnomernog zagrevanja supe, čak i dok se tanjir okreće unutar rerne. To rezultira lokalizovanim pregrevanjem, što može negativno uticati na kvalitet jela</p>`],
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
]);
