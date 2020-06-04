const width = 500,
    height = 860,
    url = encodeURI("https://services.arcgis.com/CCZiGSEQbAxxFVh3/arcgis/rest/services/COVID19_Concelhos_V/FeatureServer/0/query?f=json&where=ConfirmadosAcumulado_Conc>0&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=ConfirmadosAcumulado_Conc desc&resultOffset=0&resultRecordCount=318&resultType=standard&cacheHint=true"),
    caopUrl = "data/caop.json",
    fixedDataUrl = "data/data.json";

const projection = d3.geoMercator()
    .center([-8.00, 39.60])
    .scale(7000)
    .translate([width / 2, height / 2]),
    path = d3.geoPath(projection);

const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.json(caopUrl)
    .then(topology => {// Obtem o topojson no ficheiro caop.json
        d3.json(url)
            .then(data => processAndRender(topology, data))// Obtem os dados no url original da ESRI Portugal
            .catch(error => { // Se não for obtidos os dados com sucesso carrega uma fonte de dados predefenidos no ficheiro data.json
                console.error(error)
                d3.json(fixedDataUrl)
                    .then((data) => processAndRender(topology, data))
                    .catch(console.error)
            });
    }).catch(console.error);


function processAndRender(topology, data) {
    // Chama a função feature do modulo topojson para converter o topojson para um geojson
    var geojson = topojson.feature(topology, topology.objects.onlydis);
    let maxCases = 0;
    // Loop usado para juntar os dados geograficos com os dados sobre o covid-19 através do código Dicofre
    for (let i = 0; geojson.features.length > i; i++) {
        for (let y = 0; data.features.length > y; y++) {
            if (data.features[y].attributes.Dico === geojson.features[i].properties.Dicofre.substring(0, 4)) {
                geojson.features[i].properties = { ...geojson.features[i].properties, ...data.features[y].attributes }
                // Esta condição é usada para determinar o número maximo de casos confirmados
                if (maxCases < data.features[y].attributes.ConfirmadosAcumulado_Conc) maxCases = data.features[y].attributes.ConfirmadosAcumulado_Conc
            }
        }
    }

    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "rgba(0, 0, 0, 0.2)")
        .style("fill", function (d) {
            const caseOp = d.properties.ConfirmadosAcumulado_Conc / maxCases;
            return `rgba(200, 0, 0, ${caseOp < .05 ? .05 : caseOp})`;
        })
        .on("mouseover", function (d) {
            d3.select(this).style('stroke', 'black');
            tooltip.transition()
                .duration(300)
                .style("opacity", .9);
            tooltip.html(
                `<ul>
                    <li>${d.properties.Concelho}, ${d.properties.Distrito}</li>
                    <li>Confirmados: ${d.properties.ConfirmadosAcumulado_Conc || 0}</li>
                </ul>`
            )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 80) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).style('stroke', 'rgba(0, 0, 0, 0.2)');
            tooltip.transition()
                .duration(300)
                .style("opacity", 0);
        });
}