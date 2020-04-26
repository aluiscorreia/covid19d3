var width = 500,
    height = 860,
    da = new Date();
dn = new Date();
da.setDate(da.getDate() - 2)
var url = encodeURI(`https://services.arcgis.com/CCZiGSEQbAxxFVh3/arcgis/rest/services/COVID19_Concelhos_V/FeatureServer/0/query?f=json&where=ConfirmadosAcumulado_Conc>0 AND Data_Conc>=timestamp '${da.toLocaleString().replace(',', '').replace('/', '-')}' AND Data_Conc<=timestamp '${dn.toLocaleString().replace(',', '').replace('/', '-')}'&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=ConfirmadosAcumulado_Conc desc&resultOffset=0&resultRecordCount=318&resultType=standard&cacheHint=true`)

var projection = d3.geoMercator().center([-8.00, 39.60])
    .scale(7000)
    .translate([width / 2, height / 2])
    ,
    path = d3.geoPath(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.json("caop.json")
    .then(topology => {
        d3.json(url)
            .then(data => {
                // console.log("data", data)
                // console.log("topojson", topology)
                var geojson = topojson.feature(topology, topology.objects.onlydis);
                // console.log("geojson", geojson)
                let maxCases = 0;
                for (let i = 0; geojson.features.length > i; i++) {
                    for (let y = 0; data.features.length > y; y++) {
                        if (data.features[y].attributes.Dico === geojson.features[i].properties.Dicofre.substring(0, 4)) {
                            geojson.features[i].properties = { ...geojson.features[i].properties, ...data.features[y].attributes }
                            if (maxCases < data.features[y].attributes.ConfirmadosAcumulado_Conc) maxCases = data.features[y].attributes.ConfirmadosAcumulado_Conc
                        }
                    }
                }

                svg.selectAll("path")
                    .data(geojson.features)
                    .enter().append("path")
                    .attr("d", path)
                    .style("fill", function (d) {
                        // console.log(d)
                        const caseOp = d.properties.ConfirmadosAcumulado_Conc / maxCases;
                        return `rgba(200, 0, 0, ${caseOp < .05 ? .05 : caseOp})`;
                    })
                    .on("mouseover", function (d) {
                        tooltip.transition()
                            .duration(300)
                            .style("opacity", .9);
                        tooltip.html(
                            `<ul>
                            <li>${d.properties.Concelho}, ${d.properties.Distrito}</li>
                            <li>Confirmados: ${d.properties.ConfirmadosAcumulado_Conc || 0}</li>
                            <li>Mortos: ${d.properties.Obitos_Conc || 0}</li>
                            <li>Recuperados: ${d.properties.Recuperados_Conc || 0}</li>
                        </ul>`
                        )
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 80) + "px");
                    })
                    .on("mouseout", function (d) {
                        tooltip.transition()
                            .duration(300)
                            .style("opacity", 0);
                    });;
            }).catch(console.error);
    }).catch(console.error);