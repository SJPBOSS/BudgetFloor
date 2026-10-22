const BUDGETS = {
    CA: [5, 10, 15, 20, 25, 30],
    US: [5, 10, 15, 20, 25, 30],
    MX: [100, 200, 300, 500]
};
const DEFAULTS = { CA: 10, US: 10, MX: 200 };
const WHERE = {
    en: { CA: "in Canada", US: "in the United States", MX: "in Mexico" },
    fr: { CA: "au Canada", US: "aux États-Unis", MX: "au Mexique" },
    es: { CA: "en Canadá", US: "en Estados Unidos", MX: "en México" }
};
const COUNTRY_NAME = {
    en: { CA: "Canada", US: "United States", MX: "Mexico" },
    fr: { CA: "Canada", US: "États-Unis", MX: "Mexique" },
    es: { CA: "Canadá", US: "Estados Unidos", MX: "México" }
};

function stored(name, values) {
    try {
        const saved = localStorage.getItem("bf-" + name);
        if (saved && values.includes(saved)) return saved;
    } catch (e) {}
    return null;
}

function initialState() {
    const params = new URLSearchParams(location.search);
    const langQ = (params.get("lang") || "").toLowerCase();
    const regionQ = (params.get("region") || "").toUpperCase();
    const budgetQ = parseInt(params.get("budget"), 10);
    const lang = ["en", "fr", "es"].includes(langQ) ? langQ : (stored("lang", ["en", "fr", "es"]) || "en");
    const region = ["CA", "US", "MX"].includes(regionQ) ? regionQ : (stored("region", ["CA", "US", "MX"]) || "CA");
    const budgetSaved = parseInt(stored("budget", ["5", "10", "15", "20", "25", "30", "100", "200", "300", "500"]), 10);
    const budget = BUDGETS[region].includes(budgetQ) ? budgetQ : (BUDGETS[region].includes(budgetSaved) ? budgetSaved : DEFAULTS[region]);
    return { lang, region, budget };
}

function thousandths(value) {
    const parts = String(value).split(".");
    const whole = parseInt(parts[0], 10) || 0;
    const frac = (parts[1] || "").slice(0, 3).padEnd(3, "0");
    return whole * 1000 + parseInt(frac, 10);
}

function formatMoney(totalThousandths) {
    const whole = Math.floor(totalThousandths / 1000);
    const frac = totalThousandths % 1000;
    if (frac % 10 === 0) return whole + "." + String(frac / 10).padStart(2, "0");
    return whole + "." + String(frac).padStart(3, "0");
}

function pageTitle(lang, region, budget) {
    const where = WHERE[lang][region];
    if (lang === "fr") return "Budget Floor — Bien manger avec " + budget + " $ cette semaine " + where;
    if (lang === "es") return "Budget Floor — Comer bien con $" + budget + " esta semana " + where;
    return "Budget Floor — Eat well on $" + budget + " this week " + where;
}

function pageDesc(lang, region, budget) {
    if (region === "MX") {
        if (lang === "fr") return "Liste d'épicerie au Mexique pour " + budget + " $ MXN. Prix Profeco pour Mexico, octobre 2026.";
        if (lang === "es") return "Lista de compras en México por $" + budget + " MXN. Precios de Profeco para la Ciudad de México, octubre de 2026.";
        return "A grocery list for Mexico at $" + budget + " MXN. Profeco prices for Mexico City, October 2026.";
    }
    if (region === "US") {
        if (lang === "fr") return "Liste d'épicerie pour les États-Unis à " + budget + " $. Prix moyens du Bureau of Labor Statistics, septembre 2026.";
        if (lang === "es") return "Lista de compras para Estados Unidos por $" + budget + ". Precios promedio del Bureau of Labor Statistics, septiembre de 2026.";
        return "A grocery list for the United States at $" + budget + ". Bureau of Labor Statistics average prices, September 2026.";
    }
    if (lang === "fr") return "Liste d'épicerie pour le Canada à " + budget + " $. Prix moyens de Statistique Canada, août 2026.";
    if (lang === "es") return "Lista de compras para Canadá por $" + budget + ". Precios promedio de Statistics Canada, agosto de 2026.";
    return "A grocery list for Canada at $" + budget + ". Statistics Canada average retail prices, August 2026.";
}

function htmlLang(lang, region) {
    if (lang === "fr") return "fr-CA";
    if (lang === "es") return region === "MX" ? "es-MX" : "es";
    if (region === "US") return "en-US";
    if (region === "MX") return "en";
    return "en-CA";
}

function setContent(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", value);
}

const COPY = {
    en: {
        language: "Language",
        country: "Country",
        choose: "Choose an amount",
        list: "The list",
        week: "This week",
        total: "List total",
        guides: "Guides",
        help: "If this shop is still too much, find food help",
        equal: (total, cur) => "These foods add up to $" + total + " " + cur + ".",
        under: (total, cur, budget) => "These foods add up to $" + total + " " + cur + ", inside the $" + budget + " cap.",
        source: {
            CA: "Statistics Canada, Canada average, August 2026.",
            US: "Bureau of Labor Statistics, U.S. city average, September 2026.",
            MX: "Profeco, Mexico City, October 2026."
        },
        heading: (budget, region) => "Eat well on $" + budget + " this week " + WHERE.en[region],
        meals: {
            CA: {
                5: ["Bananas, cabbage, and oil.", "A kilogram of bananas, half a kilogram of cabbage, and 500 ml of oil. Cabbage is published at $2.63 a kilogram, so this list takes half of that, $1.32. The foods add up to $4.85."],
                10: ["Lentils with cabbage, bananas, and oil.", "Cook the lentils with a kilogram of cabbage and a little oil. The bananas are the fruit. This shop is $9.79, inside $10."],
                15: ["A can of beans and frozen spinach.", "The beans and the spinach go in the pot with the lentils and cabbage. Breakfast can be bananas. The list is $13.74."],
                20: ["Carrots and canned tomatoes join the pot.", "Dinner is lentils, beans, cabbage, spinach, carrots, and tomato, cooked in oil, with bananas on the side. This shop is $19.81."],
                25: ["A dozen eggs across the week.", "Keep the same pot. The eggs sit on the plate some nights. They are not the whole dinner. The foods add up to $24.64."],
                30: ["The 675 g loaf of white bread.", "Bananas and toast in the morning. Dinner stays the lentil pot with the vegetables. The loaf is the published price, $3.63. The list is $28.27."]
            },
            US: {
                5: ["Potatoes, bananas, dried beans, and lettuce.", "Cook the beans with potato and lettuce, and eat a banana. These are per-pound averages, and the lines add up to $4.95, inside $5."],
                10: ["Eggs, rice, and spaghetti.", "Breakfast can be eggs or a banana. Dinner is beans and potato, or spaghetti, with lettuce. The list is $9.715."],
                15: ["Bread, tomatoes, and flour.", "Toast with breakfast. Tomatoes go in with the beans. A pound of flour is there for a simple dough. This shop is $14.082."],
                20: ["Chicken, oranges, and a second pound of beans.", "Chicken with potato, tomato, and lettuce. Oranges and bananas are the fruit. Two pounds of dried beans are twice the per-pound average. The foods add up to $19.538."],
                25: ["A second pound of rice, bread, potato, and pasta.", "The same meals, with more of the foods that are priced by the pound. This list is $24.85."],
                30: ["More chicken, oranges, flour, and bananas.", "Each of those is two pounds, still at the published per-pound rate. The list is $29.838, inside $30."]
            },
            MX: {
                100: ["Tortillas, beans, carrots, and banana.", "Cook the beans with carrot and eat them with tortillas. The banana is the fruit. A litre of oil is $43 in these observations, so oil waits for the next amount. This shop is $89.90, inside $100 MXN."],
                200: ["Oil, eggs, oats, and a little onion.", "Breakfast can be eggs with tortilla, or oats and banana. Dinner is beans with carrot and onion, cooked in oil. The onion is a quarter kilogram at $67 per kilogram. The list is $194.65."],
                300: ["Tomato, lentils, rice, and canned peas.", "The pot can be beans and rice with tomato, lentils, and peas. Cabbage is $31 a kilogram and does not fit next to the rice. The foods add up to $297.95."],
                500: ["A bigger shop you can share.", "A second kilogram of tortillas, beans, and bananas, another bag of oats, a 30-egg carton, cabbage, and pasta. The onion stays a quarter kilogram, because a full kilogram is $67. The list is $498.85."]
            }
        }
    },
    fr: {
        language: "Langue",
        country: "Pays",
        choose: "Choisissez un montant",
        list: "La liste",
        week: "Cette semaine",
        total: "Total de la liste",
        guides: "Guides",
        help: "Si cette épicerie est encore trop juste, trouvez de l'aide",
        equal: (total, cur) => "Ces aliments font " + total.replace(".", ",") + " $ " + cur + ".",
        under: (total, cur, budget) => "Ces aliments font " + total.replace(".", ",") + " $ " + cur + ", sous le plafond de " + budget + " $.",
        source: {
            CA: "Statistique Canada, moyenne du Canada, août 2026.",
            US: "Bureau of Labor Statistics, moyenne des villes américaines, septembre 2026.",
            MX: "Profeco, Mexico, octobre 2026."
        },
        heading: (budget, region) => "Bien manger avec " + budget + " $ cette semaine " + WHERE.fr[region],
        meals: {
            CA: {
                5: ["Bananes, chou et huile.", "Un kilo de bananes, un demi-kilo de chou et 500 ml d'huile. Le chou est publié à 2,63 $ le kilo, alors cette liste en prend la moitié, soit 1,32 $. Les aliments font 4,85 $."],
                10: ["Des lentilles avec du chou, des bananes et de l'huile.", "Faites cuire les lentilles avec un kilo de chou et un peu d'huile. Les bananes sont le fruit. Cette épicerie fait 9,79 $, sous 10 $."],
                15: ["Une canne de haricots et des épinards surgelés.", "Les haricots et les épinards vont dans le chaudron avec les lentilles et le chou. Le déjeuner peut être des bananes. La liste fait 13,74 $."],
                20: ["Des carottes et des tomates en conserve.", "Le souper, c'est lentilles, haricots, chou, épinards, carottes et tomate, cuits dans l'huile, avec des bananes à côté. Cette épicerie fait 19,81 $."],
                25: ["Une douzaine d'œufs pour la semaine.", "Gardez le même chaudron. Les œufs accompagnent l'assiette certains soirs. Ils ne sont pas tout le souper. Les aliments font 24,64 $."],
                30: ["Le pain blanc de 675 g.", "Des bananes et une rôtie au déjeuner. Le souper reste le chaudron de lentilles avec les légumes. La miche est au prix publié, 3,63 $. La liste fait 28,27 $."]
            },
            US: {
                5: ["Pommes de terre, bananes, haricots secs et laitue.", "Cuisez les haricots avec la pomme de terre et la laitue, et mangez une banane. Ce sont des moyennes à la livre. Les lignes font 4,95 $, sous 5 $."],
                10: ["Des œufs, du riz et du spaghetti.", "Le déjeuner peut être des œufs ou une banane. Le souper, c'est des haricots et une pomme de terre, ou du spaghetti, avec de la laitue. La liste fait 9,715 $."],
                15: ["Du pain, des tomates et de la farine.", "Une rôtie avec le déjeuner. Les tomates vont avec les haricots. Une livre de farine sert à une pâte simple. Cette épicerie fait 14,082 $."],
                20: ["Du poulet, des oranges et une deuxième livre de haricots.", "Du poulet avec pomme de terre, tomate et laitue. Les oranges et les bananes sont le fruit. Deux livres de haricots secs, c'est deux fois la moyenne à la livre. Les aliments font 19,538 $."],
                25: ["Une deuxième livre de riz, de pain, de pommes de terre et de pâtes.", "Les mêmes repas, avec plus des aliments vendus à la livre. Cette liste fait 24,85 $."],
                30: ["Plus de poulet, d'oranges, de farine et de bananes.", "Chacun de ces aliments est à deux livres, toujours au taux publié à la livre. La liste fait 29,838 $, sous 30 $."]
            },
            MX: {
                100: ["Tortillas, haricots, carottes et banane.", "Cuisez les haricots avec la carotte et mangez-les avec des tortillas. La banane est le fruit. Un litre d'huile est à 43 $ dans ces observations, alors l'huile attend le montant suivant. Cette épicerie fait 89,90 $ MXN, sous 100 $."],
                200: ["De l'huile, des œufs, de l'avoine et un peu d'oignon.", "Au déjeuner, des œufs avec une tortilla, ou de l'avoine et une banane. Le souper, c'est des haricots avec de la carotte et de l'oignon, cuits dans l'huile. L'oignon est un quart de kilo à 67 $ le kilo. La liste fait 194,65 $."],
                300: ["Tomate, lentilles, riz et petits pois en conserve.", "Le chaudron peut être des haricots et du riz avec de la tomate, des lentilles et des pois. Le chou est à 31 $ le kilo et n'entre pas à côté du riz. Les aliments font 297,95 $."],
                500: ["Une plus grosse épicerie à partager.", "Un deuxième kilo de tortillas, de haricots et de bananes, un autre sac d'avoine, une boîte de 30 œufs, du chou et des pâtes. L'oignon reste un quart de kilo, parce qu'un kilo entier est à 67 $. La liste fait 498,85 $."]
            }
        }
    },
    es: {
        language: "Idioma",
        country: "País",
        choose: "Elija un monto",
        list: "La lista",
        week: "Esta semana",
        total: "Total de la lista",
        guides: "Guías",
        help: "Si esta compra todavía no alcanza, busque ayuda",
        equal: (total, cur) => "Estos alimentos suman $" + total + " " + cur + ".",
        under: (total, cur, budget) => "Estos alimentos suman $" + total + " " + cur + ", dentro del tope de $" + budget + ".",
        source: {
            CA: "Statistics Canada, promedio de Canadá, agosto de 2026.",
            US: "Bureau of Labor Statistics, promedio de las ciudades de EE. UU., septiembre de 2026.",
            MX: "Profeco, Ciudad de México, octubre de 2026."
        },
        heading: (budget, region) => "Comer bien con $" + budget + " esta semana " + WHERE.es[region],
        meals: {
            CA: {
                5: ["Plátano, col y aceite.", "Un kilo de plátano, medio kilo de col y 500 ml de aceite. La col se publica a $2.63 el kilo, así que esta lista usa la mitad, $1.32. Los alimentos suman $4.85."],
                10: ["Lentejas con col, plátano y aceite.", "Cocine las lentejas con un kilo de col y un poco de aceite. El plátano es la fruta. Esta compra suma $9.79, dentro de los $10."],
                15: ["Una lata de frijoles y espinaca congelada.", "Los frijoles y la espinaca van a la olla con las lentejas y la col. El desayuno puede ser plátano. La lista suma $13.74."],
                20: ["Zanahorias y tomates en lata.", "La cena es lentejas, frijoles, col, espinaca, zanahoria y tomate, cocidos con aceite, y plátano al lado. Esta compra suma $19.81."],
                25: ["Una docena de huevos en la semana.", "Siga con la misma olla. Los huevos acompañan el plato algunas noches. No son toda la cena. Los alimentos suman $24.64."],
                30: ["El pan blanco de 675 g.", "Plátano y pan tostado en el desayuno. La cena sigue siendo la olla de lentejas con las verduras. El pan está al precio publicado, $3.63. La lista suma $28.27."]
            },
            US: {
                5: ["Papas, plátano, frijoles secos y lechuga.", "Cocine los frijoles con papa y lechuga, y coma un plátano. Son promedios por libra. Las líneas suman $4.95, dentro de los $5."],
                10: ["Huevos, arroz y espagueti.", "El desayuno puede ser huevos o un plátano. La cena es frijoles y papa, o espagueti, con lechuga. La lista suma $9.715."],
                15: ["Pan, tomates y harina.", "Una tostada con el desayuno. Los tomates van con los frijoles. Una libra de harina sirve para una masa sencilla. Esta compra suma $14.082."],
                20: ["Pollo, naranjas y otra libra de frijoles.", "Pollo con papa, tomate y lechuga. Las naranjas y el plátano son la fruta. Dos libras de frijoles secos son el doble del promedio por libra. Los alimentos suman $19.538."],
                25: ["Otra libra de arroz, pan, papa y pasta.", "Las mismas comidas, con más de los alimentos que se publican por libra. Esta lista suma $24.85."],
                30: ["Más pollo, naranjas, harina y plátano.", "Cada uno de esos alimentos va a dos libras, al mismo precio por libra publicado. La lista suma $29.838, dentro de los $30."]
            },
            MX: {
                100: ["Tortillas, frijoles, zanahoria y plátano.", "Cocine los frijoles con zanahoria y acompáñelos con tortilla. El plátano es la fruta. Un litro de aceite sale en $43 en estas observaciones, así que el aceite espera al siguiente monto. Esta lista suma $89.90, dentro de $100 MXN."],
                200: ["Aceite, huevo, avena y un poco de cebolla.", "En el desayuno, huevo con tortilla, o avena y plátano. Después, frijoles con zanahoria y cebolla, cocidos con aceite. La cebolla es un cuarto de kilo a $67 el kilo. La lista suma $194.65."],
                300: ["Jitomate, lenteja, arroz y chícharos en lata.", "La olla puede ser frijoles y arroz con jitomate, lenteja y chícharos. La col está en $31 el kilo y no cabe junto al arroz. Los alimentos suman $297.95."],
                500: ["Una compra más grande para compartir.", "Otro kilo de tortilla, frijol y plátano, otra bolsa de avena, un cartón de 30 huevos, col y pasta. La cebolla se queda en un cuarto de kilo, porque un kilo completo son $67. La lista suma $498.85."]
            }
        }
    }
};

const AID = {
    CA: { href: "https://www.211.ca/", name: "211.ca" },
    US: { href: "https://www.feedingamerica.org/find-your-local-foodbank", name: "Feeding America" },
    MX: { href: "https://bamx.org.mx/donde-estamos/", name: "Bancos de Alimentos de México" }
};

const LANG_ATTR = { en: "en", fr: "fr", es: "es" };

let prices = null;
let lang;
let region;
let budget;
let amountKey = "";

const FAIL = {
    en: "The grocery list did not load. The written guides below still work.",
    fr: "La liste d'épicerie n'a pas chargé. Les guides plus bas fonctionnent encore.",
    es: "La lista de compras no cargó. Las guías de abajo siguen disponibles."
};

function syncChrome() {
    try {
        localStorage.setItem("bf-lang", lang);
        localStorage.setItem("bf-region", region);
        localStorage.setItem("bf-budget", String(budget));
    } catch (e) {}
    const url = new URL(location.href);
    if (lang === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    if (region === "CA") url.searchParams.delete("region");
    else url.searchParams.set("region", region);
    if (budget === DEFAULTS[region]) url.searchParams.delete("budget");
    else url.searchParams.set("budget", String(budget));
    const next = url.pathname + url.search + url.hash;
    const current = location.pathname + location.search + location.hash;
    if (next !== current) history.replaceState(null, "", next);
    const title = pageTitle(lang, region, budget);
    const desc = pageDesc(lang, region, budget);
    const langTag = htmlLang(lang, region);
    document.documentElement.lang = langTag;
    document.title = title;
    setContent('meta[name="description"]', desc);
    setContent('meta[property="og:title"]', title);
    setContent('meta[property="og:description"]', desc);
    setContent('meta[name="twitter:title"]', title);
    setContent('meta[name="twitter:description"]', desc);
    const ogLocale = langTag === "fr-CA" ? "fr_CA" : (langTag === "es" || langTag === "es-MX" ? "es_MX" : (langTag === "en-US" ? "en_US" : (region === "MX" ? "en_MX" : "en_CA")));
    setContent('meta[property="og:locale"]', ogLocale);
}

function paintLanguages() {
    const t = COPY[lang];
    const group = document.getElementById("languages");
    group.setAttribute("aria-label", t.language);
    group.querySelectorAll("button").forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
}

function paintCountry() {
    const t = COPY[lang];
    document.getElementById("country-label").textContent = t.country;
    const select = document.getElementById("country");
    ["CA", "US", "MX"].forEach((code) => {
        const opt = select.querySelector('option[value="' + code + '"]');
        if (opt) opt.textContent = COUNTRY_NAME[lang][code];
    });
    select.value = region;
}

function paintAmounts() {
    const t = COPY[lang];
    const budgets = BUDGETS[region];
    const box = document.getElementById("amounts");
    const key = region + ":" + budgets.join(",");
    document.getElementById("amount-heading").textContent = t.choose + " · " + (prices ? prices.countries[region].currency : (region === "MX" ? "MXN" : (region === "US" ? "USD" : "CAD")));
    box.setAttribute("aria-label", t.choose);
    box.className = "amounts " + (budgets.length > 4 ? "amounts-six" : "amounts-four");
    if (amountKey !== key) {
        amountKey = key;
        box.replaceChildren();
        budgets.forEach((val) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "amount";
            btn.dataset.budget = String(val);
            btn.id = "amount-" + val;
            btn.textContent = "$" + val;
            btn.addEventListener("click", () => {
                budget = val;
                render();
            });
            box.appendChild(btn);
        });
    }
    box.querySelectorAll("button").forEach((btn) => {
        btn.setAttribute("aria-pressed", Number(btn.dataset.budget) === budget ? "true" : "false");
    });
}

function paintStory() {
    const t = COPY[lang];
    document.getElementById("hero-title").textContent = t.heading(budget, region);
    document.getElementById("price-source").textContent = t.source[region];
    document.getElementById("list-heading").textContent = t.list;
    document.getElementById("week-heading").textContent = t.week;
    const meal = t.meals[region][budget];
    document.getElementById("meal-lead").textContent = meal[0];
    document.getElementById("meal-body").textContent = meal[1];
    document.getElementById("guides-link").textContent = t.guides;
    const aid = AID[region];
    const link = document.getElementById("aid");
    link.href = aid.href;
    link.replaceChildren();
    const lead = document.createElement("span");
    lead.textContent = t.help;
    const name = document.createElement("span");
    name.className = "help-name";
    name.textContent = aid.name;
    link.append(lead, name);
}

function paintList() {
    const list = document.getElementById("list");
    const totalEl = document.getElementById("total");
    const sumEl = document.getElementById("sum-line");
    const boot = document.getElementById("boot-msg");
    if (!prices) {
        list.replaceChildren();
        totalEl.hidden = true;
        sumEl.textContent = "";
        return;
    }
    if (boot) boot.hidden = true;
    const t = COPY[lang];
    const country = prices.countries[region];
    const ids = country.tiers[String(budget)];
    const items = ids.map((id) => country.items[id]);
    const totalThousandths = items.reduce((sum, item) => sum + thousandths(item.price), 0);
    const total = formatMoney(totalThousandths);
    const capThousandths = budget * 1000;
    list.replaceChildren();
    items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "item";
        const name = document.createElement("span");
        name.className = "item-name";
        name.textContent = item.name[lang];
        const price = document.createElement("span");
        price.className = "item-price";
        price.textContent = "$" + item.price;
        li.append(name, price);
        list.appendChild(li);
    });
    list.classList.remove("rise");
    void list.offsetWidth;
    list.classList.add("rise");
    totalEl.hidden = false;
    totalEl.replaceChildren();
    const label = document.createElement("span");
    label.className = "total-label";
    label.textContent = t.total;
    const figure = document.createElement("span");
    figure.className = "total-figure";
    figure.textContent = "$" + total + " " + country.currency;
    totalEl.append(label, figure);
    sumEl.textContent = totalThousandths === capThousandths ? t.equal(total, country.currency) : t.under(total, country.currency, budget);
}

function render() {
    syncChrome();
    paintLanguages();
    paintCountry();
    paintAmounts();
    paintStory();
    paintList();
}

function showFailure() {
    const boot = document.getElementById("boot-msg");
    if (boot) {
        boot.hidden = false;
        boot.textContent = FAIL[lang] || FAIL.en;
    }
}

const start = initialState();
lang = start.lang;
region = start.region;
budget = start.budget;

document.getElementById("languages").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-lang]");
    if (!btn) return;
    lang = btn.dataset.lang;
    render();
});
document.getElementById("country").addEventListener("change", (event) => {
    region = event.target.value;
    if (!BUDGETS[region].includes(budget)) budget = DEFAULTS[region];
    render();
});

render();

fetch("/data/prices.json")
    .then((response) => {
        if (!response.ok) throw new Error("prices");
        return response.json();
    })
    .then((data) => {
        prices = data;
        render();
    })
    .catch(() => {
        showFailure();
    });
