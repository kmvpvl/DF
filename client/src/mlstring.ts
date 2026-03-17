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
        'Мы заботимся о каждой детали, чтобы ваши десерты прибыли такими же красивыми, какими они покинули нашу кухню. Доставка по Панчева, Белграду и окрестностям.',
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
