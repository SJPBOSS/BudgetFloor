(function () {
    var RECIPES = [
        {
            need: ["lentils", "cabbage", "carrots", "tomatoes", "spinach", "oil"],
            title: { en: "Lentil pot", fr: "Chaudron de lentilles", es: "Olla de lentejas" },
            body: {
                en: "Rinse the lentils. Cover them with water and add the cabbage, carrots, spinach, and tomato. Simmer until the lentils are soft. Stir in a spoon of the oil at the end.",
                fr: "Rincez les lentilles. Couvrez-les d'eau et ajoutez le chou, les carottes, les épinards et la tomate. Laissez mijoter jusqu'à ce que les lentilles soient tendres. Ajoutez une cuillerée d'huile à la fin.",
                es: "Enjuague las lentejas. Cúbralas con agua y agregue la col, las zanahorias, la espinaca y el tomate. Hierva a fuego lento hasta que las lentejas estén suaves. Al final, incorpore una cucharada del aceite."
            }
        },
        {
            need: ["lentils", "cabbage", "carrots", "tomatoes", "spinach"],
            title: { en: "Lentil pot", fr: "Chaudron de lentilles", es: "Olla de lentejas" },
            body: {
                en: "Rinse the lentils. Cover them with water and add the cabbage, carrots, spinach, and tomato. Simmer until the lentils are soft. This list has no oil.",
                fr: "Rincez les lentilles. Couvrez-les d'eau et ajoutez le chou, les carottes, les épinards et la tomate. Laissez mijoter jusqu'à ce que les lentilles soient tendres. Cette liste n'a pas d'huile.",
                es: "Enjuague las lentejas. Cúbralas con agua y agregue la col, las zanahorias, la espinaca y el tomate. Hierva a fuego lento hasta que las lentejas estén suaves. Esta lista no trae aceite."
            }
        },
        {
            need: ["lentils", "cabbage", "oil"],
            title: { en: "Lentils and cabbage", fr: "Lentilles et chou", es: "Lentejas y col" },
            body: {
                en: "Rinse the lentils. Cover them with water, add the cabbage, and simmer until they are soft. Stir in a spoon of the oil at the end.",
                fr: "Rincez les lentilles. Couvrez-les d'eau, ajoutez le chou et laissez mijoter jusqu'à ce qu'elles soient tendres. Ajoutez une cuillerée d'huile à la fin.",
                es: "Enjuague las lentejas. Cúbralas con agua, agregue la col y hierva a fuego lento hasta que estén suaves. Al final, incorpore una cucharada del aceite."
            }
        },
        {
            need: ["chicken", "potatoes", "tomatoes"],
            title: { en: "Chicken, potatoes, and tomato", fr: "Poulet, pommes de terre et tomate", es: "Pollo, papas y tomate" },
            body: {
                en: "Cut the chicken, potatoes, and tomatoes into pieces. Cover them with water and simmer until the chicken is cooked through and no longer pink.",
                fr: "Coupez le poulet, les pommes de terre et les tomates en morceaux. Couvrez d'eau et laissez mijoter jusqu'à ce que le poulet soit cuit et ne soit plus rose.",
                es: "Corte el pollo, las papas y los tomates en trozos. Cúbralos con agua y hierva a fuego lento hasta que el pollo esté cocido y ya no se vea rosado."
            }
        },
        {
            need: ["chicken", "rice"],
            title: { en: "Chicken and rice", fr: "Poulet et riz", es: "Pollo y arroz" },
            body: {
                en: "Cook the rice in water. In another pot, cover the chicken with water and simmer until it is cooked through. Serve the chicken on the rice.",
                fr: "Cuisez le riz dans l'eau. Dans un autre chaudron, couvrez le poulet d'eau et laissez mijoter jusqu'à ce qu'il soit cuit. Servez le poulet sur le riz.",
                es: "Cocine el arroz en agua. En otra olla, cubra el pollo con agua y hierva a fuego lento hasta que esté cocido. Sirva el pollo sobre el arroz."
            }
        },
        {
            need: ["rice", "beans"],
            title: { en: "Rice and beans", fr: "Riz et haricots", es: "Arroz y frijoles" },
            body: {
                en: "Cook the rice in water. Heat the beans and serve them with the rice.",
                fr: "Cuisez le riz dans l'eau. Réchauffez les haricots et servez-les avec le riz.",
                es: "Cocine el arroz en agua. Caliente los frijoles y sírvalos con el arroz."
            }
        },
        {
            need: ["pasta", "sauce"],
            title: { en: "Pasta and sauce", fr: "Pâtes et sauce", es: "Pasta y salsa" },
            body: {
                en: "Boil the pasta in water until it is tender. Heat the sauce and stir it through the pasta.",
                fr: "Faites bouillir les pâtes dans l'eau jusqu'à ce qu'elles soient tendres. Réchauffez la sauce et mélangez-la aux pâtes.",
                es: "Hierva la pasta en agua hasta que esté suave. Caliente la salsa y mézclela con la pasta."
            }
        },
        {
            need: ["pasta", "tomatoes"],
            title: { en: "Pasta and tomato", fr: "Pâtes et tomate", es: "Pasta y tomate" },
            body: {
                en: "Boil the pasta in water until it is tender. Heat the tomatoes and stir them through the pasta.",
                fr: "Faites bouillir les pâtes dans l'eau jusqu'à ce qu'elles soient tendres. Réchauffez les tomates et mélangez-les aux pâtes.",
                es: "Hierva la pasta en agua hasta que esté suave. Caliente los tomates y mézclelos con la pasta."
            }
        },
        {
            need: ["pasta", "jitomate"],
            title: { en: "Pasta and tomato", fr: "Pâtes et tomate", es: "Pasta y jitomate" },
            body: {
                en: "Boil the pasta in water until it is tender. Chop the tomato, heat it in a little water, and stir it through the pasta.",
                fr: "Faites bouillir les pâtes dans l'eau jusqu'à ce qu'elles soient tendres. Coupez la tomate, chauffez-la dans un peu d'eau et mélangez-la aux pâtes.",
                es: "Hierva la pasta en agua hasta que esté suave. Pique el jitomate, caliéntelo en un poco de agua y mézclelo con la pasta."
            }
        },
        {
            need: ["arroz", "jitomate", "frijol"],
            title: { en: "Rice, beans, and tomato", fr: "Riz, haricots et tomate", es: "Arroz, frijol y jitomate" },
            body: {
                en: "Cook the rice in water. Heat the beans with the chopped tomato in a little water and serve them with the rice.",
                fr: "Cuisez le riz dans l'eau. Réchauffez les haricots avec la tomate coupée dans un peu d'eau et servez-les avec le riz.",
                es: "Cocine el arroz en agua. Caliente el frijol con el jitomate picado en un poco de agua y sírvalo con el arroz."
            }
        },
        {
            need: ["lenteja", "chicharo"],
            title: { en: "Lentils and peas", fr: "Lentilles et petits pois", es: "Lentejas y chícharos" },
            body: {
                en: "Rinse the lentils and cover them with water. Simmer until they are soft, then stir in the peas and heat them through.",
                fr: "Rincez les lentilles et couvrez-les d'eau. Laissez mijoter jusqu'à ce qu'elles soient tendres, puis ajoutez les petits pois et chauffez.",
                es: "Enjuague las lentejas y cúbralas con agua. Hierva a fuego lento hasta que estén suaves, agregue los chícharos y caliente."
            }
        },
        {
            need: ["frijol", "aceite", "cebolla"],
            title: { en: "Beans and onion", fr: "Haricots et oignon", es: "Frijol y cebolla" },
            body: {
                en: "Chop the onion and soften it in a spoon of the oil. Add the beans and a little water and heat them through.",
                fr: "Coupez l'oignon et faites-le ramollir dans une cuillerée d'huile. Ajoutez les haricots et un peu d'eau, puis chauffez.",
                es: "Pique la cebolla y ablándela con una cucharada del aceite. Agregue el frijol y un poco de agua, y caliente."
            }
        },
        {
            need: ["tortilla", "frijol", "zanahoria"],
            title: { en: "Beans and carrot with tortillas", fr: "Haricots et carotte avec tortillas", es: "Frijol y zanahoria con tortilla" },
            body: {
                en: "Heat the beans with the chopped carrot in water until the carrot is soft. Eat them with the tortillas.",
                fr: "Réchauffez les haricots avec la carotte coupée dans l'eau jusqu'à ce que la carotte soit tendre. Mangez-les avec les tortillas.",
                es: "Caliente el frijol con la zanahoria picada en agua hasta que la zanahoria esté suave. Acompáñelo con las tortillas."
            }
        },
        {
            need: ["huevo", "tortilla"],
            title: { en: "Eggs and tortillas", fr: "Œufs et tortillas", es: "Huevo y tortilla" },
            body: {
                en: "Cook the eggs in a dry pan, or boil them in water. Eat them with the tortillas.",
                fr: "Cuisez les œufs dans une poêle sèche, ou faites-les bouillir dans l'eau. Mangez-les avec les tortillas.",
                es: "Cocine los huevos en un sartén seco, o hiérvalos en agua. Acompáñelos con las tortillas."
            }
        },
        {
            need: ["avena", "platano"],
            title: { en: "Oats and banana", fr: "Avoine et banane", es: "Avena y plátano" },
            body: {
                en: "Heat the oats in water until they thicken. Slice the banana on top. Milk is not on this list.",
                fr: "Chauffez l'avoine dans l'eau jusqu'à ce qu'elle épaississe. Déposez la banane en tranches dessus. Le lait n'est pas sur cette liste.",
                es: "Caliente la avena en agua hasta que espese. Ponga el plátano en rebanadas encima. La leche no está en esta lista."
            }
        },
        {
            need: ["pb", "bananas"],
            title: { en: "Banana and peanut butter", fr: "Banane et beurre d'arachide", es: "Plátano y mantequilla de maní" },
            body: {
                en: "Slice the banana and eat it with the peanut butter.",
                fr: "Tranchez la banane et mangez-la avec le beurre d'arachide.",
                es: "Rebana el plátano y cómalo con la mantequilla de maní."
            }
        },
        {
            need: ["onions", "lentils"],
            title: { en: "Lentils and onion", fr: "Lentilles et oignon", es: "Lentejas y cebolla" },
            body: {
                en: "Rinse the lentils and cover them with water. Add the chopped onion and simmer until the lentils are soft.",
                fr: "Rincez les lentilles et couvrez-les d'eau. Ajoutez l'oignon coupé et laissez mijoter jusqu'à ce que les lentilles soient tendres.",
                es: "Enjuague las lentejas y cúbralas con agua. Agregue la cebolla picada y hierva a fuego lento hasta que las lentejas estén suaves."
            }
        },
        {
            need: ["eggs", "bread"],
            title: { en: "Eggs and bread", fr: "Œufs et pain", es: "Huevos y pan" },
            body: {
                en: "Boil the eggs in water, or cook them in a dry pan. Eat them with the bread.",
                fr: "Faites bouillir les œufs dans l'eau, ou cuisez-les dans une poêle sèche. Mangez-les avec le pain.",
                es: "Hierva los huevos en agua, o cocínelos en un sartén seco. Cómalos con el pan."
            }
        },
        {
            need: ["eggs", "potatoes"],
            title: { en: "Eggs and potatoes", fr: "Œufs et pommes de terre", es: "Huevos y papas" },
            body: {
                en: "Cut the potatoes and boil them in water until they are soft. Boil or dry-cook the eggs and eat them with the potatoes.",
                fr: "Coupez les pommes de terre et faites-les bouillir dans l'eau jusqu'à ce qu'elles soient tendres. Faites bouillir ou cuire les œufs à sec et mangez-les avec les pommes de terre.",
                es: "Corte las papas y hiérvalas en agua hasta que estén suaves. Hierva o cocine los huevos en seco y cómalos con las papas."
            }
        },
        {
            need: ["beans", "potatoes", "lettuce"],
            title: { en: "Beans, potatoes, and lettuce", fr: "Haricots, pommes de terre et laitue", es: "Frijoles, papas y lechuga" },
            body: {
                en: "Boil the potatoes in water until they are soft. Heat the beans. Serve both with the lettuce.",
                fr: "Faites bouillir les pommes de terre dans l'eau jusqu'à ce qu'elles soient tendres. Réchauffez les haricots. Servez le tout avec la laitue.",
                es: "Hierva las papas en agua hasta que estén suaves. Caliente los frijoles. Sirva todo con la lechuga."
            }
        },
        {
            need: ["col", "frijol"],
            title: { en: "Beans and cabbage", fr: "Haricots et chou", es: "Frijol y col" },
            body: {
                en: "Chop the cabbage and simmer it in water with the beans until the cabbage is soft.",
                fr: "Coupez le chou et laissez-le mijoter dans l'eau avec les haricots jusqu'à ce que le chou soit tendre.",
                es: "Pique la col y hiérvala a fuego lento en agua con el frijol hasta que la col esté suave."
            }
        },
        {
            need: ["cabbage", "oil"],
            title: { en: "Cabbage", fr: "Chou", es: "Col" },
            body: {
                en: "Chop the cabbage and cook it slowly in a little of the oil with a splash of water until it is soft.",
                fr: "Coupez le chou et cuisez-le doucement dans un peu d'huile avec une touche d'eau jusqu'à ce qu'il soit tendre.",
                es: "Pique la col y cocínela a fuego lento con un poco del aceite y un chorrito de agua hasta que esté suave."
            }
        },
        {
            need: ["flour"],
            title: { en: "Flatbread", fr: "Galette", es: "Pan plano" },
            body: {
                en: "Stir the flour with water until it holds together. Flatten small pieces and cook them in a dry pan until they set. This list has no yeast and no oil.",
                fr: "Mélangez la farine avec de l'eau jusqu'à ce que la pâte se tienne. Aplatissez de petits morceaux et cuisez-les dans une poêle sèche jusqu'à ce qu'ils prennent. Cette liste n'a ni levure ni huile.",
                es: "Mezcle la harina con agua hasta que se sostenga. Aplane trozos pequeños y cocínelos en un sartén seco hasta que cuajen. Esta lista no trae levadura ni aceite."
            }
        },
        {
            need: ["cereal"],
            title: { en: "Cereal", fr: "Céréales", es: "Cereal" },
            body: {
                en: "Eat the cereal dry, or with water. Milk is not on this list.",
                fr: "Mangez les céréales sèches, ou avec de l'eau. Le lait n'est pas sur cette liste.",
                es: "Coma el cereal seco, o con agua. La leche no está en esta lista."
            }
        },
        {
            need: ["bread", "bananas"],
            title: { en: "Bread and banana", fr: "Pain et banane", es: "Pan y plátano" },
            body: {
                en: "Eat the bread with the banana.",
                fr: "Mangez le pain avec la banane.",
                es: "Coma el pan con el plátano."
            }
        },
        {
            need: ["bananas"],
            title: { en: "Bananas", fr: "Bananes", es: "Plátano" },
            body: {
                en: "Eat the bananas as they are.",
                fr: "Mangez les bananes telles quelles.",
                es: "Coma el plátano tal cual."
            }
        },
        {
            need: ["platano"],
            title: { en: "Banana", fr: "Banane", es: "Plátano" },
            body: {
                en: "Eat the banana as it is.",
                fr: "Mangez la banane telle quelle.",
                es: "Coma el plátano tal cual."
            }
        },
        {
            need: ["oranges"],
            title: { en: "Oranges", fr: "Oranges", es: "Naranjas" },
            body: {
                en: "Peel the oranges and eat them.",
                fr: "Épluchez les oranges et mangez-les.",
                es: "Pele las naranjas y cómalas."
            }
        },
        {
            need: ["eggs"],
            title: { en: "Eggs", fr: "Œufs", es: "Huevos" },
            body: {
                en: "Cover the eggs with water and boil them, then cool them. Salt is not on this list.",
                fr: "Couvrez les œufs d'eau, faites-les bouillir, puis laissez-les refroidir. Le sel n'est pas sur cette liste.",
                es: "Cubra los huevos con agua, hiérvalos y luego enfríelos. La sal no está en esta lista."
            }
        },
        {
            need: ["rice"],
            title: { en: "Rice", fr: "Riz", es: "Arroz" },
            body: {
                en: "Cook the rice in water until it is tender.",
                fr: "Cuisez le riz dans l'eau jusqu'à ce qu'il soit tendre.",
                es: "Cocine el arroz en agua hasta que esté suave."
            }
        },
        {
            need: ["pasta"],
            title: { en: "Pasta", fr: "Pâtes", es: "Pasta" },
            body: {
                en: "Boil the pasta in water until it is tender.",
                fr: "Faites bouillir les pâtes dans l'eau jusqu'à ce qu'elles soient tendres.",
                es: "Hierva la pasta en agua hasta que esté suave."
            }
        }
    ];

    function tokenOf(id) {
        return String(id).replace(/^(ca|us|mx)_/, "").replace(/_(half|q|\d+)$/, "");
    }

    function fitting(bag) {
        var matched = RECIPES.filter(function (recipe) {
            return recipe.need.every(function (token) { return bag.has(token); });
        });
        return matched.filter(function (recipe) {
            return !matched.some(function (other) {
                if (other === recipe || other.need.length <= recipe.need.length) return false;
                return recipe.need.every(function (token) { return other.need.indexOf(token) !== -1; });
            });
        });
    }

    window.budgetFloorDinners = function (ids, lang) {
        var bag = new Set((ids || []).map(tokenOf));
        var recipes = fitting(bag);
        var dinners = [];
        var i;
        for (i = 0; i < 7 && recipes.length; i += 1) {
            var recipe = recipes[i % recipes.length];
            dinners.push({ title: recipe.title[lang] || recipe.title.en, body: recipe.body[lang] || recipe.body.en });
        }
        return {
            dinners: dinners,
            repeated: recipes.length > 0 && recipes.length < 7,
            noOil: !bag.has("oil") && !bag.has("aceite")
        };
    };
})();
