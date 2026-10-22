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

function cents(value) {
    return Math.round(Number(value) * 100);
}

function formatMoney(totalCents) {
    return (totalCents / 100).toFixed(2);
}

function pageTitle(lang, region, budget) {
    const where = WHERE[lang][region];
    if (lang === "fr") return "Budget Floor — Bien manger avec " + budget + " $ cette semaine " + where;
    if (lang === "es") return "Budget Floor — Comer bien con $" + budget + " esta semana " + where;
    return "Budget Floor — Eat well on $" + budget + " this week " + where;
}

function pageDesc(lang, region, budget) {
    if (region === "MX") {
        if (lang === "fr") return "Liste d'épicerie au Mexique pour " + budget + " $ MXN. Tortillas, haricots, légumes, fruit et huile. Prix Soriana vérifiés le 22 oct. 2026.";
        if (lang === "es") return "Lista de compras en México por $" + budget + " MXN. Tortillas, frijoles, verdura, fruta y aceite. Precios de Soriana revisados el 22 de oct. de 2026.";
        return "A grocery list for Mexico at $" + budget + " MXN. Tortillas, beans, vegetables, fruit, and oil. Soriana prices checked 22 Oct 2026.";
    }
    if (region === "US") {
        if (lang === "fr") return "Liste d'épicerie pour les États-Unis à " + budget + " $. Légumes et huile dans chaque montant. Prix estimés, oct. 2026.";
        if (lang === "es") return "Lista de compras para Estados Unidos por $" + budget + ". Verdura y aceite en cada monto. Precios estimados, oct. 2026.";
        return "A grocery list for the United States at $" + budget + ". Vegetables and cooking oil are in every amount. Prices are estimated, Oct 2026.";
    }
    if (lang === "fr") return "Liste d'épicerie pour le Canada à " + budget + " $. Légumes et huile dans chaque montant. Prix estimés, oct. 2026.";
    if (lang === "es") return "Lista de compras para Canadá por $" + budget + ". Verdura y aceite en cada monto. Precios estimados, oct. 2026.";
    return "A grocery list for Canada at $" + budget + ". Vegetables and cooking oil are in every amount. Prices are estimated, Oct 2026.";
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
            CA: "Estimated, Oct 2026. Vegetables and oil are in every list. Bananas and cabbage are not priced, because no store page could be read.",
            US: "Estimated, Oct 2026. Vegetables and oil are in every list. Bananas and cabbage are not priced, because no store page could be read.",
            MX: "Soriana, checked 22 Oct 2026."
        },
        heading: (budget, region) => "Eat well on $" + budget + " this week " + WHERE.en[region],
        meals: {
            CA: {
                5: ["A pot of lentils and carrots.", "Cook the lentils with the carrots and a spoon of oil. That pot is dinner, and a warm bowl works for breakfast too. Fruit is not on this $5 list: there is no banana price on file for Canada."],
                10: ["Oats in the morning, beans and carrots at night.", "Put an egg on the beans and carrots, cooked in a little oil. Six eggs across the week means the egg joins the plate. It is not the whole dinner."],
                15: ["The same plates, plus spinach and bread.", "Toast sits beside the oats. Dinner is beans, carrots, and frozen spinach in oil, with an egg on some nights. The foods add up to $13.50, inside the $15 cap."],
                20: ["Rice, peanut butter, and a vegetable every night.", "Breakfast is oats, or peanut butter on bread. Dinner is rice with beans, carrots, and spinach, cooked in oil. Add an egg when you want one. The plate is more than rice alone."],
                25: ["Onion and a pasta night.", "Keep the oats, the eggs, and the vegetables. Cook onion into the pot, and use one night of pasta with spinach so the week is not the same bowl. This shop is $24.25."],
                30: ["Enough foods to rotate the week.", "Oats, rice, pasta, lentils, eggs, beans, peanut butter, bread, carrots, spinach, onions, oil, sauce, and salt. One night is a lentil and carrot stew. Another is rice and beans with spinach. Another is pasta with sauce and onion."]
            },
            US: {
                5: ["Beans, carrots, and oil.", "Cook them as a small stew. The lines add up to $4.00, inside a $5 cap. There is no banana price on file for the United States."],
                10: ["Oats in the morning, beans and carrots at night.", "Dinner is beans and carrots in oil, with an egg on the plate. A dozen eggs covers the week. The egg is not the whole meal."],
                15: ["Frozen vegetables and bread join the pot.", "Toast goes with breakfast. Stir the frozen vegetables into the beans. This list is $14.00, inside the $15 cap."],
                20: ["Peanut butter and onions.", "Breakfast can be oats or peanut butter on bread. Dinner is beans, carrots, frozen vegetables, and onion in oil, with an egg beside them."],
                25: ["Rice one night, lentils the next.", "Both nights keep the carrots or the frozen vegetables, plus onion and oil. This list is $24.50."],
                30: ["Pasta gives you another dinner.", "Sauce, pasta, rice, or lentils, and always a vegetable in the pot. These foods add up to $30.00."]
            },
            MX: {
                100: ["Tortillas, beans, carrots, banana, and oil.", "Cook the beans with carrot and a little oil, and eat them with tortillas. The banana is the fruit. This shop is $92.20, inside $100 MXN. Eggs and rice do not fit this amount, and the plate is still a real meal."],
                200: ["A week of Mexican staples.", "Breakfast is eggs with tortilla and tomato. Later, beans or lentils with rice, onion, and carrot, plus a banana. The onion is a quarter kilogram, the smallest step Soriana listed, so it seasons the pot. The list is $194.23."],
                300: ["Oats, cabbage, and frozen peas join the week.", "Have oats some mornings. Put cabbage and peas in the pot with the beans, rice, and onion. Another kilogram of tortillas is on the list. The foods add up to $299.43."],
                500: ["A bigger shop you can share.", "More tortillas, beans, rice, eggs, and bananas, a full kilogram of onion, cabbage, peas, oats, oil, and pasta. Cook one pot and split it. The list is $491.70, inside $500 MXN."]
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
            CA: "Estimé, oct. 2026. Il y a des légumes et de l'huile dans chaque liste. Les bananes et le chou n'ont pas de prix, parce qu'aucune page de magasin n'a pu être lue.",
            US: "Estimé, oct. 2026. Il y a des légumes et de l'huile dans chaque liste. Les bananes et le chou n'ont pas de prix, parce qu'aucune page de magasin n'a pu être lue.",
            MX: "Soriana, vérifié le 22 oct. 2026."
        },
        heading: (budget, region) => "Bien manger avec " + budget + " $ cette semaine " + WHERE.fr[region],
        meals: {
            CA: {
                5: ["Un chaudron de lentilles et de carottes.", "Faites cuire les lentilles avec les carottes et un peu d'huile. Ce plat sert de souper, et un bol chaud convient au déjeuner. Il n'y a pas de fruit sur cette liste de 5 $ : aucun prix de banane n'est au dossier pour le Canada."],
                10: ["Du gruau le matin, des haricots et des carottes le soir.", "Déposez un œuf sur les haricots et les carottes, cuits avec un peu d'huile. Six œufs pour la semaine, c'est un œuf dans l'assiette, pas un souper composé d'un seul œuf."],
                15: ["Les mêmes assiettes, plus des épinards et du pain.", "Une rôtie accompagne le gruau. Le souper, c'est haricots, carottes et épinards surgelés dans l'huile, avec un œuf certains soirs. Les aliments font 13,50 $, sous le plafond de 15 $."],
                20: ["Du riz, du beurre d'arachide, et un légume chaque soir.", "Le déjeuner, c'est du gruau ou du beurre d'arachide sur du pain. Le souper, c'est du riz avec des haricots, des carottes et des épinards, cuits dans l'huile. Ajoutez un œuf si vous en voulez un. L'assiette n'est pas que du riz."],
                25: ["De l'oignon et une soirée de pâtes.", "Gardez le gruau, les œufs et les légumes. Faites revenir l'oignon dans le chaudron, et prévoyez un soir de pâtes avec des épinards. Cette épicerie fait 24,25 $."],
                30: ["Assez d'aliments pour varier la semaine.", "Gruau, riz, pâtes, lentilles, œufs, haricots, beurre d'arachide, pain, carottes, épinards, oignons, huile, sauce et sel. Un soir, un ragoût de lentilles et de carottes. Un autre, du riz et des haricots avec des épinards. Un autre, des pâtes avec la sauce et de l'oignon."]
            },
            US: {
                5: ["Haricots, carottes et huile.", "Cuisinez un petit ragoût. Les lignes font 4,00 $, sous un plafond de 5 $. Aucun prix de banane n'est au dossier pour les États-Unis."],
                10: ["Du gruau le matin, des haricots et des carottes le soir.", "Le souper, c'est des haricots et des carottes dans l'huile, avec un œuf dans l'assiette. Une douzaine d'œufs couvre la semaine. L'œuf n'est pas tout le repas."],
                15: ["Des légumes surgelés et du pain s'ajoutent.", "Une rôtie avec le déjeuner. Mélangez les légumes surgelés aux haricots. Cette liste fait 14,00 $, sous 15 $."],
                20: ["Du beurre d'arachide et des oignons.", "Le déjeuner peut être du gruau ou du beurre d'arachide sur du pain. Le souper, c'est haricots, carottes, légumes surgelés et oignon dans l'huile, avec un œuf à côté."],
                25: ["Du riz un soir, des lentilles le suivant.", "Les deux soirs gardent les carottes ou les légumes surgelés, plus l'oignon et l'huile. Cette liste fait 24,50 $."],
                30: ["Les pâtes donnent un autre souper.", "Sauce, pâtes, riz ou lentilles, et toujours un légume dans le chaudron. Ces aliments font 30,00 $."]
            },
            MX: {
                100: ["Tortillas, haricots, carottes, bananes et huile.", "Cuisez les haricots avec la carotte et un peu d'huile, et mangez-les avec des tortillas. La banane est le fruit. Cette épicerie fait 92,20 $ MXN, sous 100 $. Les œufs et le riz n'entrent pas dans ce montant, et l'assiette reste un vrai repas."],
                200: ["Une semaine d'aliments de base au Mexique.", "Au déjeuner, des œufs avec une tortilla et de la tomate. Ensuite, des haricots ou des lentilles avec du riz, de l'oignon et de la carotte, plus une banane. L'oignon est un quart de kilo, le plus petit pas affiché chez Soriana. La liste fait 194,23 $."],
                300: ["L'avoine, le chou et les petits pois s'ajoutent.", "Prenez de l'avoine certains matins. Mettez le chou et les pois dans le chaudron avec les haricots, le riz et l'oignon. Un autre kilo de tortillas est sur la liste. Les aliments font 299,43 $."],
                500: ["Une plus grosse épicerie à partager.", "Plus de tortillas, de haricots, de riz, d'œufs et de bananes, un kilo d'oignon, du chou, des pois, de l'avoine, de l'huile et des pâtes. Un seul chaudron peut nourrir plus d'une personne. La liste fait 491,70 $, sous 500 $ MXN."]
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
            CA: "Estimado, oct. 2026. Hay verdura y aceite en cada lista. El plátano y la col no tienen precio, porque no se pudo leer una página de tienda.",
            US: "Estimado, oct. 2026. Hay verdura y aceite en cada lista. El plátano y la col no tienen precio, porque no se pudo leer una página de tienda.",
            MX: "Soriana, revisado el 22 de oct. de 2026."
        },
        heading: (budget, region) => "Comer bien con $" + budget + " esta semana " + WHERE.es[region],
        meals: {
            CA: {
                5: ["Una olla de lentejas y zanahorias.", "Cocine las lentejas con las zanahorias y un poco de aceite. Esa olla es la cena, y un tazón caliente sirve de desayuno. No hay fruta en esta lista de $5: no hay un precio de plátano registrado para Canadá."],
                10: ["Avena en la mañana, frijoles y zanahorias en la noche.", "Ponga un huevo sobre los frijoles y las zanahorias, cocidos con un poco de aceite. Seis huevos en la semana significa que el huevo acompaña el plato. No es toda la cena."],
                15: ["Los mismos platos, más espinaca y pan.", "Una tostada acompaña la avena. La cena es frijoles, zanahorias y espinaca congelada con aceite, y un huevo algunas noches. Los alimentos suman $13.50, dentro de los $15."],
                20: ["Arroz, mantequilla de maní y una verdura cada noche.", "El desayuno es avena, o mantequilla de maní en pan. La cena es arroz con frijoles, zanahorias y espinaca, cocidos con aceite. Agregue un huevo si quiere. El plato es más que arroz."],
                25: ["Cebolla y una noche de pasta.", "Siga con la avena, los huevos y las verduras. Cocine la cebolla en la olla, y deje una noche de pasta con espinaca. Esta compra suma $24.25."],
                30: ["Bastantes alimentos para variar la semana.", "Avena, arroz, pasta, lentejas, huevos, frijoles, mantequilla de maní, pan, zanahorias, espinaca, cebollas, aceite, salsa y sal. Una noche, lentejas con zanahoria. Otra, arroz y frijoles con espinaca. Otra, pasta con salsa y cebolla."]
            },
            US: {
                5: ["Frijoles, zanahorias y aceite.", "Cocínelos como un guiso corto. Las líneas suman $4.00, dentro de un tope de $5. No hay un precio de plátano registrado para Estados Unidos."],
                10: ["Avena en la mañana, frijoles y zanahorias en la noche.", "La cena es frijoles y zanahorias con aceite, y un huevo en el plato. Una docena de huevos cubre la semana. El huevo no es toda la comida."],
                15: ["Entran la verdura congelada y el pan.", "Una tostada con el desayuno. Mezcle la verdura congelada con los frijoles. Esta lista suma $14.00, dentro de los $15."],
                20: ["Mantequilla de maní y cebollas.", "El desayuno puede ser avena o mantequilla de maní en pan. La cena es frijoles, zanahorias, verdura congelada y cebolla con aceite, y un huevo al lado."],
                25: ["Arroz una noche, lentejas la siguiente.", "Las dos noches conservan las zanahorias o la verdura congelada, más cebolla y aceite. Esta lista suma $24.50."],
                30: ["La pasta da otra cena.", "Salsa, pasta, arroz o lentejas, y siempre una verdura en la olla. Estos alimentos suman $30.00."]
            },
            MX: {
                100: ["Tortillas, frijoles, zanahoria, plátano y aceite.", "Cocine los frijoles con zanahoria y un poco de aceite, y acompáñelos con tortilla. El plátano es la fruta de la semana. Esta lista suma $92.20, dentro de $100 MXN. El huevo y el arroz no caben en este monto, y el plato igual es una comida."],
                200: ["Una semana con la comida de todos los días.", "En el desayuno, huevo con tortilla y jitomate. Después, frijoles o lentejas con arroz, cebolla y zanahoria, y un plátano. La cebolla es un cuarto de kilo, el paso más chico que mostró Soriana, así que sazona la olla. La lista suma $194.23."],
                300: ["Entran la avena, la col y los chícharos.", "Tome avena algunas mañanas. Meta la col y los chícharos a la olla, con los frijoles, el arroz y la cebolla. Hay otro kilo de tortilla. Los alimentos suman $299.43."],
                500: ["Una compra más grande para compartir.", "Más tortilla, frijol, arroz, huevo y plátano, un kilo de cebolla, col, chícharos, avena, aceite y pasta. Una olla alcanza para más de una persona. La lista suma $491.70, dentro de $500 MXN."]
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
    const totalCents = items.reduce((sum, item) => sum + cents(item.price), 0);
    const total = formatMoney(totalCents);
    const capCents = budget * 100;
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
    sumEl.textContent = totalCents === capCents ? t.equal(total, country.currency) : t.under(total, country.currency, budget);
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
