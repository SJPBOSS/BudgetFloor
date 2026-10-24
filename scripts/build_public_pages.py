#!/usr/bin/env python3
"""Write the public guides. Prices come from data/prices.json. No store names."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRICES = json.loads((ROOT / "data" / "prices.json").read_text())
LASTMOD = "2026-10-23"
SITE = "https://www.getbudgetfloor.com"

AID = {
    "en": '<p>If this shop is more than you have, use a directory. <a href="https://www.211.ca/">211.ca</a> connects you to local help, and <a href="https://foodbankscanada.ca/">Food Banks Canada</a> covers the country. In Quebec, <a href="https://www.211qc.ca/">211 Québec</a> and the <a href="https://banquesalimentaires.org/">Banques alimentaires du Québec</a> do that job. In the United States, <a href="https://www.feedingamerica.org/find-your-local-foodbank">Feeding America</a> finds a food bank. In Mexico, <a href="https://bamx.org.mx/">Bancos de Alimentos de México</a> and their <a href="https://bamx.org.mx/donde-estamos/">map of food banks</a> do the same.</p>',
    "fr": '<p>Si cette épicerie dépasse ce que vous avez, un répertoire peut aider. <a href="https://www.211.ca/">211.ca</a> vous oriente, et <a href="https://foodbankscanada.ca/">Banques alimentaires Canada</a> couvre le pays. Au Québec : <a href="https://www.211qc.ca/">211 Québec</a> et les <a href="https://banquesalimentaires.org/">Banques alimentaires du Québec</a>. Aux États-Unis : <a href="https://www.feedingamerica.org/find-your-local-foodbank">Feeding America</a>. Au Mexique : <a href="https://bamx.org.mx/">Bancos de Alimentos de México</a> et leur <a href="https://bamx.org.mx/donde-estamos/">carte des banques alimentaires</a>.</p>',
    "es": '<p>Si esta compra es más de lo que tiene, un directorio puede orientarle. <a href="https://www.211.ca/">211.ca</a> conecta con ayuda local, y <a href="https://foodbankscanada.ca/">Food Banks Canada</a> cubre el país. En Quebec: <a href="https://www.211qc.ca/">211 Québec</a> y los <a href="https://banquesalimentaires.org/">Banques alimentaires du Québec</a>. En Estados Unidos: <a href="https://www.feedingamerica.org/find-your-local-foodbank">Feeding America</a>. En México: <a href="https://bamx.org.mx/">Bancos de Alimentos de México</a> y su <a href="https://bamx.org.mx/donde-estamos/">mapa de bancos de alimentos</a>.</p>',
}

WEEK = {
    "en": "Every amount on this page is for seven days, one week of groceries, not one day.",
    "fr": "Chaque montant sur cette page couvre sept jours, une semaine d'épicerie, pas une journée.",
    "es": "Cada monto en esta página cubre siete días, una semana de compras, no un día.",
}

HOME = {"en": "Home", "fr": "Accueil", "es": "Inicio"}
SKIP = {
    "en": ("Skip to content", "en"),
    "fr": ("Aller au contenu", "fr"),
    "es": ("Saltar al contenido", "es"),
}
MORE = {"en": "More guides", "fr": "Autres guides", "es": "Más guías"}
FOOD = {"en": "Food help", "fr": "Aide alimentaire", "es": "Ayuda con la comida"}
METHOD = {"en": "/about/", "fr": "/fr/a-propos/", "es": "/es/acerca/"}
METHOD_LABEL = {
    "en": "How the prices are calculated",
    "fr": "Comment les prix sont calculés",
    "es": "Cómo se calculan los precios",
}


def thousandths(value):
    parts = str(value).split(".")
    whole = int(parts[0] or 0)
    frac = (parts[1] if len(parts) > 1 else "")[:3].ljust(3, "0")
    return whole * 1000 + int(frac)


def format_money(total):
    whole, frac = divmod(total, 1000)
    if frac % 10 == 0:
        return f"{whole}.{frac // 10:02d}"
    return f"{whole}.{frac:03d}"


def show_money(value, lang):
    text = format_money(thousandths(value)) if not isinstance(value, int) else format_money(value)
    if isinstance(value, int):
        text = format_money(value)
    if lang == "fr":
        return text.replace(".", ",") + " $"
    return "$" + text


def basket(region, budget):
    country = PRICES["countries"][region]
    ids = country["tiers"][str(budget)]
    items = [country["items"][item_id] for item_id in ids]
    total = sum(thousandths(item["price"]) for item in items)
    return items, total, country["currency"]


def money_total(region, budget, lang):
    _, total, _ = basket(region, budget)
    return show_money(total, lang)


def table(region, budget, lang, caption):
    items, total, _ = basket(region, budget)
    heads = {"en": ("Item", "Price"), "fr": ("Aliment", "Prix"), "es": ("Alimento", "Precio")}
    head_item, head_price = heads[lang]
    rows = []
    for item in items:
        name = item["name"][lang]
        price = show_money(item["price"], lang)
        rows.append(f"<tr><td>{name}</td><td class=\"num\">{price}</td></tr>")
    label = {"en": "Total", "fr": "Total", "es": "Total"}[lang]
    shown = show_money(total, lang)
    rows.append(f"<tr class=\"total\"><th scope=\"row\">{label}</th><td class=\"num\">{shown}</td></tr>")
    body = "".join(rows)
    return (
        "<div class=\"table-wrap\"><table>"
        f"<caption>{caption}</caption>"
        f"<thead><tr><th scope=\"col\">{head_item}</th><th class=\"num\" scope=\"col\">{head_price}</th></tr></thead>"
        f"<tbody>{body}</tbody></table></div>"
    )


def esc(text):
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def write_page(path, lang, html_lang, title, description, crumb, kicker, h1, body, alternates, home_href):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    url = SITE + "/" + str(path.relative_to(ROOT)).replace("index.html", "")
    if not url.endswith("/"):
        url += "/"
    links = []
    for code, href in alternates:
        current = ' aria-current="page"' if href.rstrip("/") == url.replace(SITE, "").rstrip("/") else ""
        label = code.split("-")[0].upper()
        if label == "EN":
            label = "EN"
        links.append(f'<a href="{href}" hreflang="{code}" lang="{code.split("-")[0]}"{current}>{label[:2]}</a>')
    # Fix lang labels to EN FR ES in order of alternates
    labels = []
    for code, href in alternates:
        short = "EN" if code.startswith("en") else ("FR" if code.startswith("fr") else "ES")
        current = ' aria-current="page"' if (SITE + href) == url or href == url.replace(SITE, "") else ""
        labels.append(
            f'<a href="{href}" hreflang="{code}" lang="{code.split("-")[0]}"{current}>{short}</a>'
        )
    alt_head = "".join(
        f'<link rel="alternate" hreflang="{code}" href="{SITE}{href}">'
        for code, href in alternates
    )
    xdefault = alternates[0][1]
    alt_head += f'<link rel="alternate" hreflang="x-default" href="{SITE}{xdefault}">'
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "headline": h1,
                "description": description,
                "inLanguage": html_lang,
                "datePublished": LASTMOD,
                "dateModified": LASTMOD,
                "mainEntityOfPage": url,
                "image": SITE + "/og.png",
                "author": {"@type": "Organization", "name": "Budget Floor", "url": SITE + "/"},
                "publisher": {"@type": "Organization", "name": "Budget Floor", "url": SITE + "/"},
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": HOME[lang], "item": SITE + home_href},
                    {"@type": "ListItem", "position": 2, "name": crumb, "item": url},
                ],
            },
        ],
    }
    skip_text, skip_lang = SKIP[lang]
    footer_links = [
        f'<li><a href="{METHOD[lang]}">{METHOD_LABEL[lang]}</a></li>',
        f'<li><a href="/cheap-grocery-list-united-states/">United States list</a></li>' if lang == "en" else "",
        f'<li><a href="/situations/">Situations</a></li>' if lang == "en" else (f'<li><a href="/fr/situations/">Situations</a></li>' if lang == "fr" else '<li><a href="/es/situaciones/">Situaciones</a></li>'),
        f'<li><a href="{home_href}">{HOME[lang]}</a></li>',
    ]
    locale = {"en-CA": "en_CA", "en-US": "en_US", "en": "en_CA", "fr-CA": "fr_CA", "es": "es_MX", "es-MX": "es_MX"}[html_lang]
    doc = f"""<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{url}">
{alt_head}
<meta name="theme-color" content="#f3efe7">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:site_name" content="Budget Floor">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:locale" content="{locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{SITE}/og.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False)}</script>
</head>
<body class="guide">
<a class="skip" href="#content">{esc(skip_text)}</a>
<div class="wrap">
<header>
<div class="topbar">
<a class="brand" href="{home_href}">Budget Floor</a>
<nav class="langs" aria-label="Language">{''.join(labels)}</nav>
</div>
<nav class="crumb" aria-label="Breadcrumb"><a href="{home_href}">{HOME[lang]}</a> <span aria-hidden="true">/</span> <span>{esc(crumb)}</span></nav>
</header>
<main id="content" tabindex="-1">
<p class="kicker">{kicker}</p>
<h1>{esc(h1)}</h1>
<p class="week-flag">{WEEK[lang]}</p>
{body}
<div class="note aid">{AID[lang]}</div>
</main>
<footer>
<h2>{MORE[lang]}</h2>
<nav aria-label="{MORE[lang]}"><ul>{''.join(footer_links)}</ul></nav>
<h2>{FOOD[lang]}</h2>
<div class="note aid">{AID[lang]}</div>
</footer>
</div>
</body>
</html>
"""
    lowered = doc.lower()
    if "walmart" in lowered or "instacart" in lowered:
        raise SystemExit("store name in " + str(path))
    path.write_text(doc)
    return url


def trio(pages, spec):
    """spec: list of 3 dicts en, fr, es with path, html_lang, title, description, crumb, kicker, h1, body, home."""
    alternates = []
    for lang, item in zip(("en", "fr", "es"), spec):
        href = "/" + item["path"].replace("index.html", "")
        code = item["html_lang"]
        alternates.append((code, href if href.endswith("/") else href + "/"))
    urls = []
    for item in spec:
        lang = item["lang"]
        urls.append(write_page(
            item["path"], lang, item["html_lang"], item["title"], item["description"],
            item["crumb"], item["kicker"], item["h1"], item["body"], alternates, item["home"],
        ))
    pages.append(alternates)
    return urls


def cta(lang, href, label):
    return f'<p class="cta"><a href="{href}">{label}</a></p>'


def build():
    ca10 = money_total("CA", 10, "en")
    ca30 = money_total("CA", 30, "en")
    ca50 = money_total("CA", 50, "en")
    ca100 = money_total("CA", 100, "en")
    us30 = money_total("US", 30, "en")
    us50 = money_total("US", 50, "en")
    us100 = money_total("US", 100, "en")
    mx500 = money_total("MX", 500, "en")
    assert ca100 == "$99.61", ca100
    assert us50 == "$49.814", us50
    assert us100 == "$99.628", us100
    assert ca30 == "$28.27", ca30
    assert ca50 == "$49.85", ca50
    assert us30 == "$29.838", us30

    pages = []
    home = {"en": "/?lang=en&region=CA", "fr": "/?lang=fr&region=CA", "es": "/?lang=es&region=CA"}

    def pack(lang, path, html_lang, title, description, crumb, kicker, h1, body, home_href):
        return {
            "lang": lang, "path": path, "html_lang": html_lang, "title": title,
            "description": description, "crumb": crumb, "kicker": kicker, "h1": h1,
            "body": body, "home": home_href,
        }

    # About
    about_body = {
        "en": """
<p class="lede">Budget Floor lists foods for seven days. The price beside each food is a published official price, or a whole multiple of that price. No price is lowered to fit a cap.</p>
<h2>Canada</h2>
<p>Canada prices are the Canada average from <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501">Statistics Canada table 18-10-0245-01</a> for August 2026. They are not a city flyer and not a store price. A partial package keeps the published rate. Vegetable oil is published as 3 litres at $9.82, and 500 ml is one sixth of that bottle, $1.64 to the cent. Half a kilogram of cabbage is half of $2.63, $1.32.</p>
<p>Adapted from Statistics Canada, Table 18-10-0245-01, August 2026. This does not constitute an endorsement by Statistics Canada of this product.</p>
<h2>United States</h2>
<p>United States prices are Bureau of Labor Statistics CPI average prices, U.S. city average, September 2026. The fact sheet is <a href="https://www.bls.gov/cpi/factsheets/average-prices.htm">Average price data</a>. A line that says three pounds is three times the published per-pound price. The figure is a U.S. city average. It is not the shelf price in one named city. These data are a U.S. government work.</p>
<h2>Mexico</h2>
<p>Mexico prices are Profeco Quién es Quién observations for Mexico City in October 2026, from <a href="https://qqp.profeco.gob.mx/">qqp.profeco.gob.mx</a>. The product name is the name on that observation, because the price belongs to that product. Other Mexican cities are not a separate survey. Budget Floor is not part of Profeco.</p>
<h2>A change from last month</h2>
<p>One official month is stored for each country. A percent change needs a second stored month. This site does not estimate one.</p>
<h2>What these pages are</h2>
<p>They are grocery lists and cooking steps. They are not medical advice, not a treatment, and not a halal or vegetarian certification. They do not name a grocery chain as a place to shop, do not use store logos, and do not carry affiliate or commission links. The lists stay free. Food-help links are public directories.</p>
<h2>What stays on this phone</h2>
<p>Language, country, amount, checklist marks, and large type stay in this browser. Budget Floor has no account and does not ask for an email. A service worker can save the site files on the device so a list you already opened can load without a connection. It does not contact any other site. Read aloud uses your browser’s speech. Budget Floor does not receive a recording.</p>
<p>The address <a href="/pedido/">/pedido/</a> is a separate sample order page. It is not a grocery budget.</p>
""",
        "fr": """
<p class="lede">Budget Floor dresse une liste pour sept jours. Le prix à côté de chaque aliment est un prix officiel publié, ou un multiple entier de ce prix. Aucun prix n'est baissé pour entrer dans un plafond.</p>
<h2>Canada</h2>
<p>Les prix du Canada sont la moyenne du Canada, <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501">tableau 18-10-0245-01 de Statistique Canada</a>, août 2026. Ce n'est pas un circulaire de ville ni un prix de magasin. Une portion d'un format publié garde le taux publié. L'huile végétale est publiée en format de 3 litres à 9,82 $, et 500 ml est le sixième de cette bouteille, soit 1,64 $. Un demi-kilo de chou est la moitié de 2,63 $, soit 1,32 $.</p>
<p>Adapté de Statistique Canada, tableau 18-10-0245-01, août 2026. Cela ne constitue pas une approbation de Statistique Canada à l'égard de ce produit.</p>
<h2>États-Unis</h2>
<p>Les prix des États-Unis sont les prix moyens de l'IPC du Bureau of Labor Statistics, moyenne des villes américaines, septembre 2026. La fiche est <a href="https://www.bls.gov/cpi/factsheets/average-prices.htm">Average price data</a>. Une ligne de trois livres vaut trois fois le prix publié à la livre. Le chiffre est une moyenne des villes américaines. Ce n'est pas le prix en rayon d'une ville nommée. Ces données sont un ouvrage du gouvernement des États-Unis.</p>
<h2>Mexique</h2>
<p>Les prix du Mexique sont des observations de Profeco, Quién es Quién, pour Mexico en octobre 2026, à <a href="https://qqp.profeco.gob.mx/">qqp.profeco.gob.mx</a>. Le nom du produit est celui de l'observation, parce que le prix appartient à ce produit. Les autres villes du Mexique ne font pas l'objet d'une enquête distincte. Budget Floor ne fait pas partie de la Profeco.</p>
<h2>Un changement depuis le mois dernier</h2>
<p>Un seul mois officiel est conservé pour chaque pays. Un pourcentage exige un deuxième mois conservé. Ce site n'en estime pas.</p>
<h2>Ce que ces pages sont</h2>
<p>Ce sont des listes d'épicerie et des étapes de cuisine. Ce n'est pas un avis médical, ni un traitement, ni une certification halal ou végétarienne. Les pages ne désignent pas une chaîne d'épicerie comme endroit où acheter, n'utilisent pas de logo de magasin et ne portent pas de lien d'affiliation ou de commission. Les listes restent gratuites. Les liens d'aide alimentaire sont des répertoires publics.</p>
<h2>Ce qui reste sur ce téléphone</h2>
<p>La langue, le pays, le montant, les coches et les gros caractères restent dans ce navigateur. Budget Floor n'a pas de compte et ne demande pas de courriel. Un service worker peut enregistrer les fichiers du site sur l'appareil pour qu'une liste déjà ouverte se charge sans connexion. Il ne contacte aucun autre site. La lecture à voix haute utilise la synthèse vocale du navigateur. Budget Floor ne reçoit pas d'enregistrement.</p>
<p>L'adresse <a href="/pedido/">/pedido/</a> est une page de commande séparée, à titre d'exemple. Ce n'est pas un budget d'épicerie.</p>
""",
        "es": """
<p class="lede">Budget Floor arma una lista para siete días. El precio junto a cada alimento es un precio oficial publicado, o un múltiplo entero de ese precio. Ningún precio se baja para caber en un tope.</p>
<h2>Canadá</h2>
<p>Los precios de Canadá son el promedio de Canadá del <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810024501">cuadro 18-10-0245-01 de Statistics Canada</a> para agosto de 2026. No son un folleto de una ciudad ni un precio de tienda. Una parte de un paquete publicado conserva la tarifa publicada. El aceite vegetal se publica como 3 litros a $9.82, y 500 ml es un sexto de esa botella, $1.64. Medio kilo de col es la mitad de $2.63, $1.32.</p>
<p>Adaptado de Statistics Canada, cuadro 18-10-0245-01, agosto de 2026. Esto no constituye un respaldo de Statistics Canada a este producto.</p>
<h2>Estados Unidos</h2>
<p>Los precios de Estados Unidos son los precios promedio del IPC del Bureau of Labor Statistics, promedio de las ciudades de EE. UU., septiembre de 2026. La ficha es <a href="https://www.bls.gov/cpi/factsheets/average-prices.htm">Average price data</a>. Una línea de tres libras es tres veces el precio publicado por libra. La cifra es un promedio de ciudades de EE. UU. No es el precio de anaquel de una ciudad con nombre. Estos datos son una obra del gobierno de Estados Unidos.</p>
<h2>México</h2>
<p>Los precios de México son observaciones de Profeco, Quién es Quién, para la Ciudad de México en octubre de 2026, en <a href="https://qqp.profeco.gob.mx/">qqp.profeco.gob.mx</a>. El nombre del producto es el de esa observación, porque el precio pertenece a ese producto. Las demás ciudades de México no son una encuesta aparte. Budget Floor no forma parte de Profeco.</p>
<h2>Un cambio respecto al mes pasado</h2>
<p>Se guarda un solo mes oficial por país. Un porcentaje necesita un segundo mes guardado. Este sitio no lo estima.</p>
<h2>Qué son estas páginas</h2>
<p>Son listas de compras y pasos de cocina. No son un consejo médico, ni un tratamiento, ni una certificación halal o vegetariana. Las páginas no nombran una cadena de supermercados como lugar de compra, no usan logotipos de tiendas y no llevan enlaces de afiliado ni de comisión. Las listas siguen siendo gratuitas. Los enlaces de ayuda alimentaria son directorios públicos.</p>
<h2>Qué se queda en este teléfono</h2>
<p>El idioma, el país, el monto, las marcas de la lista y la letra grande se quedan en este navegador. Budget Floor no tiene cuenta y no pide un correo. Un service worker puede guardar los archivos del sitio en el aparato para que una lista ya abierta cargue sin conexión. No contacta ningún otro sitio. Leer en voz alta usa la voz del navegador. Budget Floor no recibe una grabación.</p>
<p>La dirección <a href="/pedido/">/pedido/</a> es una página de pedido de ejemplo, aparte. No es un presupuesto de comida.</p>
""",
    }
    trio(pages, [
        pack("en", "about/index.html", "en-CA", "How Budget Floor calculates prices", "Official grocery prices for one week in Canada, the United States, and Mexico. No price is lowered to fit a cap.", "How prices are calculated", "Method", "How the prices are calculated", about_body["en"], home["en"]),
        pack("fr", "fr/a-propos/index.html", "fr-CA", "Comment Budget Floor calcule les prix", "Prix d'épicerie officiels pour une semaine au Canada, aux États-Unis et au Mexique. Aucun prix n'est baissé pour entrer dans un plafond.", "Comment les prix sont calculés", "Méthode", "Comment les prix sont calculés", about_body["fr"], home["fr"]),
        pack("es", "es/acerca/index.html", "es", "Cómo Budget Floor calcula los precios", "Precios oficiales de comida para una semana en Canadá, Estados Unidos y México. Ningún precio se baja para caber en un tope.", "Cómo se calculan los precios", "Método", "Cómo se calculan los precios", about_body["es"], home["es"]),
    ])

    us_table_10 = table("US", 10, "en", "United States $10 list for one week")
    us_table_50 = table("US", 50, "en", "United States $50 list for one week")
    us_table_100 = table("US", 100, "en", "United States $100 list for one week")
    us_body = {
        "en": f"""
<p class="lede">This is a one-week grocery list for the United States. The prices are the U.S. city average from the Bureau of Labor Statistics for September 2026. They are not the shelf price in New York, Houston, Los Angeles, Chicago, or any other named city.</p>
<p>The amounts on the list are $5, $10, $15, $20, $25, $30, $40, $50, and $100 for seven days. A pound that would pass the cap is left off. The price is not cut to fit. A pound of sugar is $1.019 and does not fit the $50 list or the $100 list.</p>
{cta("en", "/?lang=en&region=US&budget=50", "Open the $50 United States list")}
<h2>The $10 list</h2>
{table("US", 10, "en", "United States $10 list, one week")}
<h2>The $50 list</h2>
<p>The foods add up to {us50} for the week, inside $50.</p>
{us_table_50}
<h2>The $100 list</h2>
<p>Every line on the $50 list is doubled at the same per-pound rate. The foods add up to {us100} for the week. The list may not feed four people.</p>
{us_table_100}
""",
        "fr": f"""
<p class="lede">Ceci est une liste d'épicerie pour une semaine aux États-Unis. Les prix sont la moyenne des villes américaines du Bureau of Labor Statistics pour septembre 2026. Ce n'est pas le prix en rayon à New York, Houston, Los Angeles, Chicago ou une autre ville nommée.</p>
<p>Les montants sont 5, 10, 15, 20, 25, 30, 40, 50 et 100 $ pour sept jours. Une livre qui dépasserait le plafond reste dehors. Le prix n'est pas coupé pour entrer. Une livre de sucre à 1,019 $ n'entre pas dans la liste de 50 $ ni dans celle de 100 $.</p>
{cta("fr", "/?lang=fr&region=US&budget=50", "Ouvrir la liste de 50 $ aux États-Unis")}
<h2>La liste de 10 $</h2>
{table("US", 10, "fr", "Liste des États-Unis à 10 $, une semaine")}
<h2>La liste de 50 $</h2>
<p>Les aliments font {money_total("US", 50, "fr")} pour la semaine, sous 50 $.</p>
{table("US", 50, "fr", "Liste des États-Unis à 50 $, une semaine")}
<h2>La liste de 100 $</h2>
<p>Chaque ligne de la liste de 50 $ est doublée au même prix à la livre. Les aliments font {money_total("US", 100, "fr")} pour la semaine. La liste peut ne pas nourrir quatre personnes.</p>
{table("US", 100, "fr", "Liste des États-Unis à 100 $, une semaine")}
""",
        "es": f"""
<p class="lede">Esta es una lista de compras para una semana en Estados Unidos. Los precios son el promedio de las ciudades de EE. UU. del Bureau of Labor Statistics para septiembre de 2026. No son el precio de anaquel en Nueva York, Houston, Los Ángeles, Chicago ni ninguna otra ciudad nombrada.</p>
<p>Los montos son $5, $10, $15, $20, $25, $30, $40, $50 y $100 por siete días. Una libra que pasaría el tope se queda afuera. El precio no se recorta para caber. Una libra de azúcar a $1.019 no cabe en la lista de $50 ni en la de $100.</p>
{cta("es", "/?lang=es&region=US&budget=50", "Abrir la lista de $50 en Estados Unidos")}
<h2>La lista de $10</h2>
{table("US", 10, "es", "Lista de Estados Unidos de $10, una semana")}
<h2>La lista de $50</h2>
<p>Los alimentos suman {money_total("US", 50, "es")} para la semana, dentro de $50.</p>
{table("US", 50, "es", "Lista de Estados Unidos de $50, una semana")}
<h2>La lista de $100</h2>
<p>Cada línea de la lista de $50 se duplica al mismo precio por libra. Los alimentos suman {money_total("US", 100, "es")} para la semana. La lista puede no alcanzar para cuatro personas.</p>
{table("US", 100, "es", "Lista de Estados Unidos de $100, una semana")}
""",
    }
    trio(pages, [
        pack("en", "cheap-grocery-list-united-states/index.html", "en-US", "Cheap grocery list for the United States", "A one-week United States grocery list from Bureau of Labor Statistics average prices, September 2026. Not a city shelf price.", "Cheap grocery list for the United States", "United States · BLS, September 2026", "A cheap grocery list for the United States", us_body["en"], "/?lang=en&region=US"),
        pack("fr", "fr/liste-epicerie-pas-chere-etats-unis/index.html", "fr-CA", "Liste d'épicerie pas chère aux États-Unis", "Liste d'épicerie pour une semaine aux États-Unis, prix moyens du Bureau of Labor Statistics, septembre 2026.", "Liste d'épicerie pas chère aux États-Unis", "États-Unis · BLS, septembre 2026", "Une liste d'épicerie pas chère aux États-Unis", us_body["fr"], "/?lang=fr&region=US"),
        pack("es", "es/lista-compras-barata-estados-unidos/index.html", "es", "Lista de compras barata en Estados Unidos", "Lista de compras para una semana en Estados Unidos, precios promedio del Bureau of Labor Statistics, septiembre de 2026.", "Lista de compras barata en Estados Unidos", "Estados Unidos · BLS, septiembre de 2026", "Una lista de compras barata en Estados Unidos", us_body["es"], "/?lang=es&region=US"),
    ])

    under_body = {
        "en": f"""
<p class="lede">The $50 United States list is for seven days. The foods add up to {us50}, inside $50. The $40 list adds up to {money_total("US", 40, "en")}, also inside $50. Both use the U.S. city average for September 2026.</p>
<p>A pound of sugar is $1.019 and would pass $50, so sugar stays off the list. The price was not cut. This basket may not feed four people.</p>
{cta("en", "/?lang=en&region=US&budget=50", "Open the $50 United States list")}
{table("US", 50, "en", "United States $50 list for one week")}
""",
        "fr": f"""
<p class="lede">La liste de 50 $ aux États-Unis couvre sept jours. Les aliments font {money_total("US", 50, "fr")}, sous 50 $. La liste de 40 $ fait {money_total("US", 40, "fr")}, aussi sous 50 $. Les deux utilisent la moyenne des villes américaines de septembre 2026.</p>
<p>Une livre de sucre à 1,019 $ dépasserait 50 $, alors le sucre reste dehors. Le prix n'a pas été baissé. Ce panier peut ne pas nourrir quatre personnes.</p>
{cta("fr", "/?lang=fr&region=US&budget=50", "Ouvrir la liste de 50 $ aux États-Unis")}
{table("US", 50, "fr", "Liste des États-Unis à 50 $, une semaine")}
""",
        "es": f"""
<p class="lede">La lista de $50 en Estados Unidos cubre siete días. Los alimentos suman {money_total("US", 50, "es")}, dentro de $50. La lista de $40 suma {money_total("US", 40, "es")}, también dentro de $50. Las dos usan el promedio de las ciudades de EE. UU. de septiembre de 2026.</p>
<p>Una libra de azúcar a $1.019 pasaría de $50, así que el azúcar se queda afuera. El precio no se recortó. Esta canasta puede no alcanzar para cuatro personas.</p>
{cta("es", "/?lang=es&region=US&budget=50", "Abrir la lista de $50 en Estados Unidos")}
{table("US", 50, "es", "Lista de Estados Unidos de $50, una semana")}
""",
    }
    trio(pages, [
        pack("en", "grocery-list-under-50-united-states/index.html", "en-US", "Grocery list under $50 a week in the United States", f"The United States $50 list totals {us50} for seven days. Bureau of Labor Statistics, September 2026.", "Grocery list under $50 a week", "United States · one week", "A grocery list under $50 a week in the United States", under_body["en"], "/?lang=en&region=US"),
        pack("fr", "fr/liste-epicerie-moins-de-50-etats-unis/index.html", "fr-CA", "Liste d'épicerie à moins de 50 $ par semaine aux États-Unis", "La liste de 50 $ aux États-Unis couvre sept jours. Bureau of Labor Statistics, septembre 2026.", "Liste à moins de 50 $ par semaine", "États-Unis · une semaine", "Une liste à moins de 50 $ par semaine aux États-Unis", under_body["fr"], "/?lang=fr&region=US"),
        pack("es", "es/lista-compras-menos-de-50-estados-unidos/index.html", "es", "Lista de compras por menos de $50 a la semana en Estados Unidos", "La lista de $50 en Estados Unidos cubre siete días. Bureau of Labor Statistics, septiembre de 2026.", "Lista por menos de $50 a la semana", "Estados Unidos · una semana", "Una lista por menos de $50 a la semana en Estados Unidos", under_body["es"], "/?lang=es&region=US"),
    ])

    situations = [
        ("student", "grocery-list-student", "liste-epicerie-etudiant", "lista-compras-estudiante",
         {"en": "A grocery list for a student", "fr": "Une liste d'épicerie pour un étudiant", "es": "Una lista de compras para un estudiante"},
         {"en": "One person, seven days. The $20 and $30 lists are a practical student shop. This is not a student-aid program. Switch the country on the home page. The United States $20 list includes chicken. The Canada $20 list is the lentil pot.",
          "fr": "Une personne, sept jours. Les listes de 20 $ et de 30 $ sont une épicerie pratique pour un étudiant. Ce n'est pas un programme d'aide financière. Changez le pays sur la page d'accueil. La liste de 20 $ aux États-Unis comprend du poulet. La liste de 20 $ au Canada est le chaudron de lentilles.",
          "es": "Una persona, siete días. Las listas de $20 y $30 son una compra práctica para un estudiante. Esto no es un programa de ayuda estudiantil. Cambie el país en la página de inicio. La lista de $20 en Estados Unidos incluye pollo. La lista de $20 en Canadá es la olla de lentejas."},
         {"en": ("/?lang=en&region=CA&budget=20", "Open the $20 Canada list"), "fr": ("/?lang=fr&region=CA&budget=20", "Ouvrir la liste canadienne de 20 $"), "es": ("/?lang=es&region=CA&budget=20", "Abrir la lista canadiense de $20")}),
        ("single", "grocery-list-single-parent", "liste-epicerie-parent-seul", "lista-compras-madre-o-padre",
         {"en": "A grocery list for a single parent", "fr": "Une liste d'épicerie pour un parent seul", "es": "Una lista de compras para madre o padre solo"},
         {"en": f"One basket may have to cover an adult and a child. The $50 Canada list is {ca50} and the $100 Canada list is {ca100} for the week. The United States lists at those amounts are {us50} and {us100}. They may still not be enough. Food help below is part of the plan.",
          "fr": f"Un seul panier peut devoir couvrir un adulte et un enfant. La liste canadienne de 50 $ fait {money_total('CA', 50, 'fr')} et celle de 100 $ fait {money_total('CA', 100, 'fr')} pour la semaine. Aux États-Unis, ces montants font {money_total('US', 50, 'fr')} et {money_total('US', 100, 'fr')}. Cela peut encore ne pas suffire. L'aide alimentaire plus bas fait partie du plan.",
          "es": f"Una sola canasta puede tener que cubrir a un adulto y a un niño. La lista canadiense de $50 suma {money_total('CA', 50, 'es')} y la de $100 suma {money_total('CA', 100, 'es')} en la semana. En Estados Unidos, esos montos suman {money_total('US', 50, 'es')} y {money_total('US', 100, 'es')}. Puede que aun así no alcance. La ayuda alimentaria de abajo es parte del plan."},
         {"en": ("/?lang=en&region=CA&budget=50", "Open the $50 Canada list"), "fr": ("/?lang=fr&region=CA&budget=50", "Ouvrir la liste canadienne de 50 $"), "es": ("/?lang=es&region=CA&budget=50", "Abrir la lista canadiense de $50")}),
        ("family", "grocery-list-family-of-4", "liste-epicerie-famille-de-4", "lista-compras-familia-de-4",
         {"en": "A grocery list for a family of four", "fr": "Une liste d'épicerie pour une famille de quatre", "es": "Una lista de compras para una familia de cuatro"},
         {"en": f"The largest Canada list is $100, and the foods add up to {ca100} for the week. The largest United States list adds up to {us100}. The largest Mexico list is 500 pesos, {mx500}. Any of these may not feed four people for seven days. Food help below is part of the plan.",
          "fr": f"La plus grosse liste canadienne est 100 $, et les aliments font {money_total('CA', 100, 'fr')} pour la semaine. La plus grosse liste aux États-Unis fait {money_total('US', 100, 'fr')}. La plus grosse liste au Mexique est 500 pesos, {money_total('MX', 500, 'fr')}. Chacune peut ne pas nourrir quatre personnes pendant sept jours. L'aide alimentaire plus bas fait partie du plan.",
          "es": f"La lista más grande de Canadá es de $100, y los alimentos suman {money_total('CA', 100, 'es')} en la semana. La más grande de Estados Unidos suma {money_total('US', 100, 'es')}. La más grande de México es de 500 pesos, {money_total('MX', 500, 'es')}. Cualquiera puede no alcanzar para cuatro personas durante siete días. La ayuda alimentaria de abajo es parte del plan."},
         {"en": ("/?lang=en&region=CA&budget=100", "Open the $100 Canada list"), "fr": ("/?lang=fr&region=CA&budget=100", "Ouvrir la liste canadienne de 100 $"), "es": ("/?lang=es&region=CA&budget=100", "Abrir la lista canadiense de $100")}),
        ("sweets", "grocery-list-no-sweets", "liste-epicerie-sans-sucreries", "lista-compras-sin-dulces",
         {"en": "A grocery list with no sweets added", "fr": "Une liste d'épicerie sans sucreries ajoutées", "es": "Una lista de compras sin dulces añadidos"},
         {"en": "The lists do not add candy, soda, or dessert. A pound of sugar in the United States price table is $1.019, and it does not fit the $50 or $100 list, so it is left off. The price is not cut. This page is not medical advice and not a treatment.",
          "fr": "Les listes n'ajoutent pas de bonbons, de boisson gazeuse ou de dessert. Une livre de sucre dans le tableau des États-Unis coûte 1,019 $, et elle n'entre pas dans la liste de 50 $ ni dans celle de 100 $, alors elle reste dehors. Le prix n'est pas coupé. Cette page n'est pas un avis médical et ce n'est pas un traitement.",
          "es": "Las listas no agregan dulces, refresco ni postre. Una libra de azúcar en la tabla de Estados Unidos cuesta $1.019, y no cabe en la lista de $50 ni en la de $100, así que se queda afuera. El precio no se recorta. Esta página no es un consejo médico ni un tratamiento."},
         {"en": ("/?lang=en&region=US&budget=50", "Open the $50 United States list"), "fr": ("/?lang=fr&region=US&budget=50", "Ouvrir la liste de 50 $ aux États-Unis"), "es": ("/?lang=es&region=US&budget=50", "Abrir la lista de $50 en Estados Unidos")}),
        ("halal", "grocery-list-halal", "liste-epicerie-halal", "lista-compras-halal",
         {"en": "A grocery list and halal", "fr": "Une liste d'épicerie et le halal", "es": "Una lista de compras y lo halal"},
         {"en": "Canada’s lists contain no meat. Mexico’s lists contain no pork. United States lists from $20 include whole chicken at the published per-pound average. Budget Floor does not certify halal slaughter, ingredients, or handling. That chicken line is not a halal certification.",
          "fr": "Les listes du Canada ne contiennent pas de viande. Les listes du Mexique ne contiennent pas de porc. Les listes des États-Unis à partir de 20 $ comprennent du poulet entier au prix moyen publié à la livre. Budget Floor ne certifie pas l'abattage, les ingrédients ou la manipulation halal. Cette ligne de poulet n'est pas une certification halal.",
          "es": "Las listas de Canadá no contienen carne. Las listas de México no contienen cerdo. Las listas de Estados Unidos desde $20 incluyen pollo entero al promedio publicado por libra. Budget Floor no certifica el sacrificio, los ingredientes ni el manejo halal. Esa línea de pollo no es una certificación halal."},
         {"en": ("/?lang=en&region=CA&budget=30", "Open the $30 Canada list"), "fr": ("/?lang=fr&region=CA&budget=30", "Ouvrir la liste canadienne de 30 $"), "es": ("/?lang=es&region=CA&budget=30", "Abrir la lista canadiense de $30")}),
        ("veg", "grocery-list-vegetarian", "liste-epicerie-vegetarienne", "lista-compras-vegetariana",
         {"en": "A vegetarian grocery list", "fr": "Une liste d'épicerie végétarienne", "es": "Una lista de compras vegetariana"},
         {"en": "Canada and Mexico lists contain no meat. United States chicken starts on the $20 list. Eggs are on some lists, so those lists are not vegan. These are foods from the official price tables. They are not a certified vegetarian product.",
          "fr": "Les listes du Canada et du Mexique ne contiennent pas de viande. Le poulet des États-Unis commence à la liste de 20 $. Il y a des œufs sur certaines listes, alors ces listes ne sont pas véganes. Ce sont des aliments des tableaux de prix officiels. Ce n'est pas un produit végétarien certifié.",
          "es": "Las listas de Canadá y de México no contienen carne. El pollo de Estados Unidos empieza en la lista de $20. Hay huevos en algunas listas, así que esas listas no son veganas. Son alimentos de las tablas oficiales de precios. No son un producto vegetariano certificado."},
         {"en": ("/?lang=en&region=CA&budget=30", "Open the $30 Canada list"), "fr": ("/?lang=fr&region=CA&budget=30", "Ouvrir la liste canadienne de 30 $"), "es": ("/?lang=es&region=CA&budget=30", "Abrir la lista canadiense de $30")}),
        ("b30", "grocery-list-30-a-week", "liste-epicerie-30-par-semaine", "lista-compras-30-por-semana",
         {"en": "A grocery list at $30 a week", "fr": "Une liste d'épicerie à 30 $ par semaine", "es": "Una lista de compras a $30 por semana"},
         {"en": f"Thirty dollars here is seven days, not one day. The Canada list adds up to {ca30}. The United States list adds up to {us30}. Mexico’s amounts are 100, 200, 300, and 500 pesos for the week. There is no 30-dollar Mexico list.",
          "fr": f"Trente dollars ici, c'est sept jours, pas une journée. La liste canadienne fait {money_total('CA', 30, 'fr')}. La liste des États-Unis fait {money_total('US', 30, 'fr')}. Au Mexique, les montants sont 100, 200, 300 et 500 pesos pour la semaine. Il n'y a pas de liste mexicaine à 30 dollars.",
          "es": f"Treinta dólares aquí son siete días, no un día. La lista de Canadá suma {money_total('CA', 30, 'es')}. La de Estados Unidos suma {money_total('US', 30, 'es')}. En México, los montos son 100, 200, 300 y 500 pesos para la semana. No hay una lista de México de 30 dólares."},
         {"en": ("/?lang=en&region=CA&budget=30", "Open the $30 Canada list"), "fr": ("/?lang=fr&region=CA&budget=30", "Ouvrir la liste canadienne de 30 $"), "es": ("/?lang=es&region=CA&budget=30", "Abrir la lista canadiense de $30")}),
        ("b50", "grocery-list-50-a-week", "liste-epicerie-50-par-semaine", "lista-compras-50-por-semana",
         {"en": "A grocery list at $50 a week", "fr": "Une liste d'épicerie à 50 $ par semaine", "es": "Una lista de compras a $50 por semana"},
         {"en": f"Fifty dollars here is seven days, not one day. The Canada list adds up to {ca50}. The United States list adds up to {us50}. Sugar does not fit the United States list. Mexico uses peso amounts, not a 50-dollar list.",
          "fr": f"Cinquante dollars ici, c'est sept jours, pas une journée. La liste canadienne fait {money_total('CA', 50, 'fr')}. La liste des États-Unis fait {money_total('US', 50, 'fr')}. Le sucre n'entre pas dans la liste des États-Unis. Le Mexique utilise des montants en pesos, pas une liste à 50 dollars.",
          "es": f"Cincuenta dólares aquí son siete días, no un día. La lista de Canadá suma {money_total('CA', 50, 'es')}. La de Estados Unidos suma {money_total('US', 50, 'es')}. El azúcar no cabe en la lista de Estados Unidos. México usa montos en pesos, no una lista de 50 dólares."},
         {"en": ("/?lang=en&region=US&budget=50", "Open the $50 United States list"), "fr": ("/?lang=fr&region=US&budget=50", "Ouvrir la liste de 50 $ aux États-Unis"), "es": ("/?lang=es&region=US&budget=50", "Abrir la lista de $50 en Estados Unidos")}),
        ("b100", "grocery-list-100-a-week", "liste-epicerie-100-par-semaine", "lista-compras-100-por-semana",
         {"en": "A grocery list at $100 a week", "fr": "Une liste d'épicerie à 100 $ par semaine", "es": "Una lista de compras a $100 por semana"},
         {"en": f"One hundred dollars here is seven days, not one day. The Canada list adds up to {ca100}. The United States list adds up to {us100}. Either basket may not feed four people. Mexico’s 500-peso list is a different currency.",
          "fr": f"Cent dollars ici, c'est sept jours, pas une journée. La liste canadienne fait {money_total('CA', 100, 'fr')}. La liste des États-Unis fait {money_total('US', 100, 'fr')}. Ni l'un ni l'autre panier ne nourrit forcément quatre personnes. La liste mexicaine de 500 pesos est une autre devise.",
          "es": f"Cien dólares aquí son siete días, no un día. La lista de Canadá suma {money_total('CA', 100, 'es')}. La de Estados Unidos suma {money_total('US', 100, 'es')}. Ninguna de las dos canastas alcanza por sí sola para cuatro personas. La lista mexicana de 500 pesos es otra moneda."},
         {"en": ("/?lang=en&region=CA&budget=100", "Open the $100 Canada list"), "fr": ("/?lang=fr&region=CA&budget=100", "Ouvrir la liste canadienne de 100 $"), "es": ("/?lang=es&region=CA&budget=100", "Abrir la lista canadiense de $100")}),
    ]

    index_items = {"en": [], "fr": [], "es": []}
    for _key, en_slug, fr_slug, es_slug, titles, ledes, buttons in situations:
        specs = []
        for lang, folder, html_lang, home_href in (
            ("en", f"{en_slug}/index.html", "en-CA", home["en"]),
            ("fr", f"fr/{fr_slug}/index.html", "fr-CA", home["fr"]),
            ("es", f"es/{es_slug}/index.html", "es", home["es"]),
        ):
            href, label = buttons[lang]
            body = f'<p class="lede">{ledes[lang]}</p>' + cta(lang, href, label)
            specs.append(pack(lang, folder, html_lang, titles[lang] + " | Budget Floor", ledes[lang], titles[lang], "One week", titles[lang], body, home_href))
            index_items[lang].append(( "/" + folder.replace("index.html", ""), titles[lang]))
        trio(pages, specs)

    sit_body = {}
    for lang, intro in (
        ("en", "<p class=\"lede\">Each page below is one week of groceries, seven days, not one day. The foods and the prices are the same official lists as the home page. A situation page says who the basket may not cover.</p>"),
        ("fr", "<p class=\"lede\">Chaque page ci-dessous couvre une semaine d'épicerie, sept jours, pas une journée. Les aliments et les prix sont les mêmes listes officielles que la page d'accueil. Une page de situation dit qui le panier peut ne pas couvrir.</p>"),
        ("es", "<p class=\"lede\">Cada página de abajo cubre una semana de compras, siete días, no un día. Los alimentos y los precios son las mismas listas oficiales que la página de inicio. Una página de situación dice a quién puede no alcanzar la canasta.</p>"),
    ):
        lis = "".join(f'<li><a href="{href}">{esc(label)}</a></li>' for href, label in index_items[lang])
        sit_body[lang] = intro + f"<ul>{lis}</ul>"
    trio(pages, [
        pack("en", "situations/index.html", "en-CA", "Grocery lists by situation", "Student, single parent, family of four, no sweets, halal, and vegetarian grocery lists for one week.", "Situations", "One week", "Grocery lists by situation", sit_body["en"], home["en"]),
        pack("fr", "fr/situations/index.html", "fr-CA", "Listes d'épicerie selon la situation", "Listes d'une semaine pour un étudiant, un parent seul, une famille de quatre, sans sucreries, halal et végétarien.", "Situations", "Une semaine", "Listes d'épicerie selon la situation", sit_body["fr"], home["fr"]),
        pack("es", "es/situaciones/index.html", "es", "Listas de compras según la situación", "Listas de una semana para un estudiante, madre o padre solo, familia de cuatro, sin dulces, halal y vegetariana.", "Situaciones", "Una semana", "Listas de compras según la situación", sit_body["es"], home["es"]),
    ])

    cities = [
        ("toronto", "Toronto", "CA", "en-CA",
         "The Toronto page uses the Canada average from Statistics Canada for August 2026. Budget Floor did not survey Toronto stores. This is not a Toronto flyer.",
         "La page de Toronto utilise la moyenne du Canada de Statistique Canada pour août 2026. Budget Floor n'a pas enquêté dans les magasins de Toronto. Ce n'est pas un circulaire de Toronto.",
         "La página de Toronto usa el promedio de Canadá de Statistics Canada para agosto de 2026. Budget Floor no encuestó tiendas de Toronto. No es un folleto de Toronto."),
        ("montreal", "Montreal", "CA", "en-CA",
         "The Montreal page uses the Canada average from Statistics Canada for August 2026, not a Montreal flyer. In Quebec, 211 Québec and the Banques alimentaires du Québec are the directories to use with 211.ca.",
         "La page de Montréal utilise la moyenne du Canada de Statistique Canada pour août 2026, pas un circulaire de Montréal. Au Québec, 211 Québec et les Banques alimentaires du Québec accompagnent 211.ca.",
         "La página de Montreal usa el promedio de Canadá de Statistics Canada para agosto de 2026, no un folleto de Montreal. En Quebec, 211 Québec y los Banques alimentaires du Québec se usan junto con 211.ca."),
        ("vancouver", "Vancouver", "CA", "en-CA",
         "The Vancouver page uses the same Canada average as the Toronto page, Statistics Canada for August 2026. Changing the city name does not change the basket.",
         "La page de Vancouver utilise la même moyenne du Canada que la page de Toronto, Statistique Canada pour août 2026. Changer le nom de la ville ne change pas le panier.",
         "La página de Vancouver usa el mismo promedio de Canadá que la de Toronto, Statistics Canada para agosto de 2026. Cambiar el nombre de la ciudad no cambia la canasta."),
        ("calgary", "Calgary", "CA", "en-CA",
         "The Calgary page uses the Canada average from Statistics Canada for August 2026. It is not an Alberta shelf price and not a Calgary store survey.",
         "La page de Calgary utilise la moyenne du Canada de Statistique Canada pour août 2026. Ce n'est pas un prix en rayon de l'Alberta ni une enquête dans les magasins de Calgary.",
         "La página de Calgary usa el promedio de Canadá de Statistics Canada para agosto de 2026. No es un precio de anaquel de Alberta ni una encuesta de tiendas de Calgary."),
        ("new-york", "New York", "US", "en-US",
         "The New York page uses the U.S. city average from the Bureau of Labor Statistics for September 2026. Naming New York does not select a New York index.",
         "La page de New York utilise la moyenne des villes américaines du Bureau of Labor Statistics pour septembre 2026. Nommer New York ne choisit pas un indice de New York.",
         "La página de Nueva York usa el promedio de las ciudades de EE. UU. del Bureau of Labor Statistics para septiembre de 2026. Nombrar Nueva York no elige un índice de Nueva York."),
        ("houston", "Houston", "US", "en-US",
         "The Houston page uses the U.S. city average for September 2026. It is not a Houston shelf price. The $50 list on this average adds up to " + us50 + " for the week.",
         "La page de Houston utilise la moyenne des villes américaines de septembre 2026. Ce n'est pas un prix en rayon à Houston. La liste de 50 $ sur cette moyenne fait " + money_total("US", 50, "fr") + " pour la semaine.",
         "La página de Houston usa el promedio de las ciudades de EE. UU. de septiembre de 2026. No es un precio de anaquel en Houston. La lista de $50 en ese promedio suma " + money_total("US", 50, "es") + " en la semana."),
        ("los-angeles", "Los Angeles", "US", "en-US",
         "The Los Angeles page uses the U.S. city average for September 2026. The basket does not change because the city name is Los Angeles.",
         "La page de Los Angeles utilise la moyenne des villes américaines de septembre 2026. Le panier ne change pas parce que la ville s'appelle Los Angeles.",
         "La página de Los Ángeles usa el promedio de las ciudades de EE. UU. de septiembre de 2026. La canasta no cambia porque la ciudad se llame Los Ángeles."),
        ("chicago", "Chicago", "US", "en-US",
         "The Chicago page uses the U.S. city average for September 2026. It is the same published average as the New York, Houston, and Los Angeles pages.",
         "La page de Chicago utilise la moyenne des villes américaines de septembre 2026. C'est la même moyenne publiée que les pages de New York, Houston et Los Angeles.",
         "La página de Chicago usa el promedio de las ciudades de EE. UU. de septiembre de 2026. Es el mismo promedio publicado que las páginas de Nueva York, Houston y Los Ángeles."),
        ("mexico-city", "Mexico City", "MX", "en",
         "The Profeco observations used here are for Mexico City in October 2026. This is the city those prices belong to. They are not a national Mexican average.",
         "Les observations de la Profeco utilisées ici concernent Mexico en octobre 2026. C'est la ville à laquelle ces prix appartiennent. Ce n'est pas une moyenne nationale du Mexique.",
         "Las observaciones de Profeco usadas aquí son de la Ciudad de México en octubre de 2026. Esta es la ciudad a la que pertenecen esos precios. No son un promedio nacional de México."),
        ("guadalajara", "Guadalajara", "MX", "en",
         "The Guadalajara page uses Profeco observations for Mexico City in October 2026. It is not a Guadalajara survey. The basket does not change when the city name changes.",
         "La page de Guadalajara utilise les observations de la Profeco pour Mexico en octobre 2026. Ce n'est pas une enquête à Guadalajara. Le panier ne change pas quand le nom de la ville change.",
         "La página de Guadalajara usa observaciones de Profeco para la Ciudad de México en octubre de 2026. No es una encuesta de Guadalajara. La canasta no cambia cuando cambia el nombre de la ciudad."),
    ]
    city_links = {"en": [], "fr": [], "es": []}
    for slug, name, region, html_en, en_p, fr_p, es_p in cities:
        budget = {"CA": 10, "US": 50, "MX": 200}[region]
        names = {"en": name, "fr": "Montréal" if slug == "montreal" else ("Mexico" if slug == "mexico-city" else name), "es": {"new-york": "Nueva York", "los-angeles": "Los Ángeles", "mexico-city": "Ciudad de México"}.get(slug, name)}
        paths = {
            "en": f"grocery-list-{slug}/index.html",
            "fr": f"fr/liste-epicerie-{slug}/index.html",
            "es": f"es/lista-compras-{slug}/index.html",
        }
        if slug == "mexico-city":
            paths["es"] = "es/lista-compras-ciudad-de-mexico/index.html"
            paths["fr"] = "fr/liste-epicerie-mexico/index.html"
        paras = {"en": en_p, "fr": fr_p, "es": es_p}
        specs = []
        for lang, html_lang in (("en", html_en), ("fr", "fr-CA"), ("es", "es-MX" if region == "MX" else "es")):
            title = {
                "en": f"A grocery list for {names['en']}",
                "fr": f"Une liste d'épicerie pour {names['fr']}",
                "es": f"Una lista de compras para {names['es']}",
            }[lang]
            open_label = {
                "en": "Open this list",
                "fr": "Ouvrir cette liste",
                "es": "Abrir esta lista",
            }[lang]
            href = f"/?lang={lang}&region={region}&budget={budget}"
            caption = title
            body = f'<p class="lede">{paras[lang]}</p>' + cta(lang, href, open_label) + table(region, budget, lang, caption)
            home_href = f"/?lang={lang}&region={region}"
            specs.append(pack(lang, paths[lang], html_lang, title + " | Budget Floor", paras[lang], title, "One week · official price", title, body, home_href))
            city_links[lang].append(("/" + paths[lang].replace("index.html", ""), title))
        trio(pages, specs)

    hub = {}
    for lang, intro in (
        ("en", "<p class=\"lede\">A city name on this site does not invent a local flyer. Canada pages use the Canada average for August 2026. United States pages use the U.S. city average for September 2026. Mexico City is the Profeco geography for October 2026. Other Mexican cities use those Mexico City observations.</p>"),
        ("fr", "<p class=\"lede\">Un nom de ville sur ce site n'invente pas un circulaire local. Les pages du Canada utilisent la moyenne du Canada d'août 2026. Les pages des États-Unis utilisent la moyenne des villes américaines de septembre 2026. Mexico est la géographie Profeco d'octobre 2026. Les autres villes du Mexique utilisent ces observations de Mexico.</p>"),
        ("es", "<p class=\"lede\">Un nombre de ciudad en este sitio no inventa un folleto local. Las páginas de Canadá usan el promedio de Canadá de agosto de 2026. Las de Estados Unidos usan el promedio de las ciudades de EE. UU. de septiembre de 2026. La Ciudad de México es la geografía de Profeco de octubre de 2026. Las demás ciudades de México usan esas observaciones de la Ciudad de México.</p>"),
    ):
        lis = "".join(f'<li><a href="{href}">{esc(label)}</a></li>' for href, label in city_links[lang])
        hub[lang] = intro + f"<ul>{lis}</ul>"
    trio(pages, [
        pack("en", "cities/index.html", "en-CA", "Grocery lists by city", "City pages use the official national or Mexico City price and say so. They are not store flyers.", "Cities", "Official price", "What a city name changes", hub["en"], home["en"]),
        pack("fr", "fr/villes/index.html", "fr-CA", "Listes d'épicerie par ville", "Les pages de ville utilisent le prix officiel national ou de Mexico, et elles le disent. Ce ne sont pas des circulaires.", "Villes", "Prix officiel", "Ce qu'un nom de ville change", hub["fr"], home["fr"]),
        pack("es", "es/ciudades/index.html", "es", "Listas de compras por ciudad", "Las páginas de ciudad usan el precio oficial nacional o de la Ciudad de México, y lo dicen. No son folletos de tienda.", "Ciudades", "Precio oficial", "Lo que cambia un nombre de ciudad", hub["es"], home["es"]),
    ])

    # Sitemap
    sitemap_path = ROOT / "sitemap.xml"
    existing = sitemap_path.read_text()
    additions = []
    for alternates in pages:
        alt_links = "".join(
            f'<xhtml:link rel="alternate" hreflang="{code}" href="{SITE}{href}"/>'
            for code, href in alternates
        )
        xdefault = alternates[0][1]
        alt_links += f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{xdefault}"/>'
        for _code, href in alternates:
            loc = SITE + href
            if loc in existing:
                continue
            additions.append(f'<url><loc>{loc}</loc><lastmod>{LASTMOD}</lastmod>{alt_links}</url>')
    if additions:
        existing = existing.replace("</urlset>", "\n".join(additions) + "\n</urlset>")
        sitemap_path.write_text(existing)

    patch_existing()
    print(f"pages {sum(len(group) for group in pages)} sitemap+{len(additions)}")


def patch_existing():
    replacements = [
        (ROOT / "grocery-budget-family-canada/index.html",
         "The largest Canadian list on Budget Floor is the $30 shop. The foods add up to $28.27. It is still a careful week, even for two people, and it will not cover a bigger household by itself. If several people are eating from this one basket, the food-help links below are part of the plan, not a last resort you have to earn.",
         "The largest Canadian list on Budget Floor is the $100 shop. Those foods add up to $99.61 for the week. The $30 shop on this page adds up to $28.27. Either basket may not feed four people. If several people are eating from one list, the food-help links below are part of the plan."),
        (ROOT / "fr/budget-epicerie-famille-canada/index.html",
         "La plus grosse liste canadienne de Budget Floor est l'épicerie de 30 $. Les aliments font 28,27 $. C'est encore une semaine serrée, même pour deux personnes, et elle ne couvre pas à elle seule un plus grand foyer. Si plusieurs personnes mangent dans ce même panier, les liens d'aide plus bas font partie du plan.",
         "La plus grosse liste canadienne de Budget Floor est l'épicerie de 100 $. Ces aliments font 99,61 $ pour la semaine. L'épicerie de 30 $ sur cette page fait 28,27 $. Ni l'une ni l'autre ne nourrit forcément quatre personnes. Si plusieurs personnes mangent dans une seule liste, les liens d'aide plus bas font partie du plan."),
        (ROOT / "es/presupuesto-comida-familia-canada/index.html",
         "La lista canadiense más grande de Budget Floor es la compra de $30. Los alimentos suman $28.27. Sigue siendo una semana ajustada, incluso para dos personas, y no cubre sola un hogar más grande. Si varias personas comen de esta misma canasta, los enlaces de ayuda de abajo son parte del plan.",
         "La lista canadiense más grande de Budget Floor es la compra de $100. Esos alimentos suman $99.61 en la semana. La compra de $30 de esta página suma $28.27. Ninguna de las dos alcanza por sí sola para cuatro personas. Si varias personas comen de una sola lista, los enlaces de ayuda de abajo son parte del plan."),
    ]
    for path, old, new in replacements:
        text = path.read_text()
        if new in text:
            continue
        if old not in text:
            raise SystemExit("missing lede " + str(path))
        path.write_text(text.replace(old, new, 1))

    meta = [
        (ROOT / "cheap-grocery-list-canada/index.html", "Canadian grocery lists from $5 to $30.", "Canadian grocery lists from $5 to $100 for one week."),
        (ROOT / "fr/liste-epicerie-pas-chere-canada/index.html", "Listes d&#x27;épicerie au Canada de 5 $ à 30 $.", "Listes d&#x27;épicerie au Canada de 5 $ à 100 $ pour une semaine."),
        (ROOT / "fr/liste-epicerie-pas-chere-canada/index.html", "Listes d'épicerie au Canada de 5 $ à 30 $.", "Listes d'épicerie au Canada de 5 $ à 100 $ pour une semaine."),
        (ROOT / "es/lista-compras-barata-canada/index.html", "Listas de compras en Canadá de $5 a $30.", "Listas de compras en Canadá de $5 a $100 para una semana."),
    ]
    for path, old, new in meta:
        text = path.read_text()
        if old not in text:
            if new not in text:
                raise SystemExit("missing meta " + old)
            continue
        path.write_text(text.replace(old, new))

    note = {
        ROOT / "cheap-grocery-list-canada/index.html": (
            "<h2>Which page next</h2>",
            "<p>The same Canada average also has lists at $40 ($38.48), $50 ($49.85), and $100 ($99.61) for the week. $100 is the largest Canadian list, and it may not feed four people.</p><h2>Which page next</h2>",
        ),
        ROOT / "fr/liste-epicerie-pas-chere-canada/index.html": (
            "<h2>Quelle page ensuite</h2>",
            "<p>La même moyenne du Canada a aussi des listes à 40 $ (38,48 $), 50 $ (49,85 $) et 100 $ (99,61 $) pour la semaine. 100 $ est la plus grosse liste canadienne, et elle peut ne pas nourrir quatre personnes.</p><h2>Quelle page ensuite</h2>",
        ),
        ROOT / "es/lista-compras-barata-canada/index.html": (
            "<h2>Qué página sigue</h2>",
            "<p>El mismo promedio de Canadá también tiene listas de $40 ($38.48), $50 ($49.85) y $100 ($99.61) para la semana. $100 es la lista canadiense más grande, y puede no alcanzar para cuatro personas.</p><h2>Qué página sigue</h2>",
        ),
    }
    for path, (old, new) in note.items():
        text = path.read_text()
        if old not in text:
            raise SystemExit("missing heading " + str(path))
        if "99.61" in text or "99,61" in text:
            continue
        path.write_text(text.replace(old, new, 1))

    about_li = {
        "en": '<li><a href="/about/">How the prices are calculated</a></li>',
        "fr": '<li><a href="/fr/a-propos/">Comment les prix sont calculés</a></li>',
        "es": '<li><a href="/es/acerca/">Cómo se calculan los precios</a></li>',
    }
    for path in ROOT.rglob("index.html"):
        if "pedido" in path.parts:
            continue
        text = path.read_text()
        if 'class="guide"' not in text and "<body class=\"guide\">" not in text:
            continue
        if "/about/" in text or "/fr/a-propos/" in text or "/es/acerca/" in text:
            continue
        if text.startswith("<!DOCTYPE html>\n<html lang=\"fr-CA\">") or '<html lang="fr-CA">' in text[:80]:
            insert = about_li["fr"]
        elif '<html lang="es' in text[:80]:
            insert = about_li["es"]
        else:
            insert = about_li["en"]
        needle = "<ul>"
        # first ul in the footer nav is enough: insert after the first <ul> that follows More guides heading is hard.
        # Insert immediately after the footer nav's <ul>.
        marker = '<nav aria-label="More guides"><ul>'
        if marker not in text:
            marker = '<nav aria-label="Autres guides"><ul>'
        if marker not in text:
            marker = '<nav aria-label="Más guías"><ul>'
        if marker not in text:
            continue
        text = text.replace(marker, marker + insert, 1)
        path.write_text(text)


if __name__ == "__main__":
    build()
