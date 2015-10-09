# Leaflet table 

To display a data table inside a leaflet map.

[Check it out](http://diogok.github.io/leaflet.table).

## Usage

Use the leaflet CSS and JS

    <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css" />
    <script src="http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js"></script>

Include the CSS and JS:

    <link rel="stylesheet" href="supagrid.css" />
    <link rel="stylesheet" href="leaflet.table.css" />
    <script src="supagrid.js" type="text/javascript"></script>
    <script src="leaflet.table.js" type="text/javascript"></script>

Create the map:

    <div id="map" style='width: 100vw; height: 100vh'></div>

    <script type="text/javascript">
      var map = L.map('map').setView([0, 0], 1);
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
    </script>

Use the table control:

    var table_control = new L.control.Table({}).addTo(map);

    var fields = ['id','name'];

    var layer = new L.layerGroup();

    for(var i=0;i<50;i++) { // random points
      var marker = new L.marker([10.0+(i/100), 20.0+(i/100)]);
      marker.properties={id:i,name:"John "+i};
      marker.bindPopup('ID: '+marker.properties.id);
    }

    var data= layer.getFeatures().map(function(feat){return feat.properties});

    var table = new Supagrid({
      fields: fields,
      id_field: fields[0],
      data: data
    });

    layer.eachLayer(function(layer){
      layer.on('popupopen',function(){
        table.focus(layer.properties.id);
      });
    });

    table_control.addTable(table.supagrid,'my_table','My Table')

Take a look at the index.html for other usage.

## License

MIT

