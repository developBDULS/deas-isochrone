mapboxgl.accessToken = 'pk.eyJ1Ijoiam1hcnRpbmV6Y2wiLCJhIjoiY2w1c2RwYmk0Mjl3MzNrcGl3bDIzcWd2cyJ9.H09NN_RapDgKq1sBJPZRUA';
const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet
    center: [-71.2481, -29.9082],
    zoom: 13.5 // starting zoom
    });

// Create variables to use in getIso()
const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
const lon = -71.2481;
const lat = -29.9082;
let profile = 'walking';
let minutes = 4;

//CONST
const params = document.getElementById('params');

const lngLat = {
    lon: lon,
    lat: lat
    };
const marker = new mapboxgl.Marker({
    'color': '#314ccd'
    });            

map.on('load', ()=>{
    map.loadImage(
        'media/ICONO DESFIBRILADOR 2-01.png',
        (error, image) => {
            if(error) throw error;
            map.addImage('maker-red', image);
        }
    );
    map.loadImage(
        'media/ÍCONO DESFIBRILADOR AZUL 01.png',
        (error, image) => {
            if(error) throw error;
            map.addImage('maker-blue', image);
        }
    );
    // When the map loads, add the source and layer
    map.addSource('iso', {
        type: 'geojson',
        data: {
        'type': 'FeatureCollection',
        'features': []
        }
    });
        
    map.addLayer(
    {
        'id': 'isoLayer',
        'type': 'fill',
        'source': 'iso',
        'layout': {},
        'paint': {
        'fill-color': '#EC5803',
        'fill-opacity': 0.4
        }
    },
    'poi-label'
    );
    //initialize isochrone
    marker.setLngLat(lngLat).addTo(map);
    getIso(); 
});

map.once('idle', () => {    
    d3.json("data/deas_collections.json", function (d) {
        deas = d;
        //add source
        map.addSource('deas',{
            'type': 'geojson',
            'data': deas
        });
        //addLayer
        map.addLayer({
            'id': 'points',
            'type': 'symbol',
            'source': 'deas',
            'layout': {
                'icon-image': 'maker-red',
                'icon-size': 0.75
            }
        });

        map.addSource('nearest-dea', {
            type: 'geojson',
            data: {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type':'Feature',
                    'properties':{
                        "id": "dea-9",
                        "Direccion": "Benavente 980",
                        "Campus": "Campus Ignacio Domeyko",
                        "Dependencia": "Portería del Campus",
                        "Sector": "Portería Campus Ignacio Domeyko",
                        "longitude": -71.246740729398596,
                        "latitude": -29.9088820455373
                    },
                    'geometry':{
                        "type": "Point",
                        "coordinates": [
                            -71.246740729398596,
                            -29.9088820455373
                        ]
                    }
                }
            ]
            }
        });
        map.addLayer({
            'id': 'nearest',
            'type': 'symbol',
            'source': 'nearest-dea',
            'layout': {
                'icon-image': 'maker-blue',
                'icon-size': 0.75
            }
        }); 
    });
});

//TURF FUNCTIONS
function nearestDea(deas,lng, lat){
    const newPoint = turf.point([lng, lat]);
    let nearest = turf.nearestPoint(newPoint, deas);
    map.getSource('nearest-dea').setData(nearest);
    if(map.getLayer('nearest')){
        map.removeLayer('nearest');        
    }
    
    map.addLayer({
        'id': 'nearest',
        'type': 'symbol',
        'source': 'nearest-dea',
        'layout': {
            'icon-image': 'maker-blue',
            'icon-size': 0.75
        }
    });    
}

//Event listeners
map.on('click', (e)=> {
    latitud = e.lngLat.lat;
    longitud = e.lngLat.lng;
    lngLat.lat = e.lngLat.lat
    lngLat.lon = e.lngLat.lng
    const newPoint = turf.point([longitud, latitud]);
    let nearest = turf.nearestPoint(newPoint, deas);
    map.getSource('nearest-dea').setData(nearest);
    if(map.getLayer('nearest')){
        map.removeLayer('nearest');        
    }
    
    map.addLayer({
        'id': 'nearest',
        'type': 'symbol',
        'source': 'nearest-dea',
        'layout': {
            'icon-image': 'maker-blue',
            'icon-size': 0.75
        }
    }); 
    marker.setLngLat(lngLat).addTo(map);
    getIso();
});

//ISOCHRONE
async function getIso() {
    const query = await fetch(
    `${urlBase}${profile}/${lngLat.lon},${lngLat.lat}?contours_minutes=${minutes}&polygons=true&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
    );
    const data = await query.json();
    // Set the 'iso' source's data to what's returned by the API query
    map.getSource('iso').setData(data);
}

params.addEventListener('change', (event) => {
    if (event.target.name === 'profile') {
        profile = event.target.value;
    } else if (event.target.name === 'duration') {
        minutes = event.target.value;
    }
    getIso();
});
//POPUP
const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
    });

map.on('mouseenter', 'points', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const direccion = e.features[0].properties.Direccion;
    const campus = e.features[0].properties.Campus;
    const dependencia = e.features[0].properties.Dependencia;
    const sector = e.features[0].properties.Sector;  
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;    }

    table_info = "<table id='customers'><tr><th>Dirección</th><td>"+direccion+"</td></tr>"+
        "<tr><th>Campus</th><td>"+campus+"</td></tr>"+
        "<tr><th>Dependencia</th><td>"+dependencia+"</td></tr>"+
        "<tr><th>Sector</th><td>"+sector+"</td></tr>"+
        "</table>";
    popup.setLngLat(coordinates).setHTML(table_info).addTo(map);
});

map.on('mouseleave', 'points', (e) => {
    popup.remove(); 
});

map.on('mouseenter', 'nearest', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const direccion = e.features[0].properties.Direccion;
    const campus = e.features[0].properties.Campus;
    const dependencia = e.features[0].properties.Dependencia;
    const sector = e.features[0].properties.Sector;  
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;    }

    table_info = "<table id='customers'><tr><th>Dirección</th><td>"+direccion+"</td></tr>"+
        "<tr><th>Campus</th><td>"+campus+"</td></tr>"+
        "<tr><th>Dependencia</th><td>"+dependencia+"</td></tr>"+
        "<tr><th>Sector</th><td>"+sector+"</td></tr>"+
        "</table>";
    popup.setLngLat(coordinates).setHTML(table_info).addTo(map);
});

map.on('mouseleave', 'nearest', (e) => {
    // Change the cursor style as a UI indicator.
    popup.remove(); 
});

/** ICONS & INFO*/
const img = document.createElement('img');
img.src = 'media/LOGO GEORREFERENCIACIÓN BCO - 145X100-01-01.png';
const info = document.getElementById('bduls-container');
info.appendChild(img);

const title_container = document.getElementById('map-title');
const title_value = document.createElement('span');
title_value.innerHTML = "<b>DEAs IV Región</b>";
title_container.appendChild(title_value);

const layers = [
    'Ubicación Actual',
    'DEA más Cercano',
    'DEAs Disponibles',
    'Distancia Cubierta'
];

const colors = [
    '#4745AC',
    '#362084',
    '#FC0D0D',
    '#EC5803'
];

const legend = document.getElementById('legend');

layers.forEach((layer, i) => {
    const color = colors[i];
    const item = document.createElement('div');
    const key = document.createElement('span');
    key.className = 'legend-key';
    key.style.backgroundColor = color;
    
    const value = document.createElement('span');
    value.innerHTML = `${layer}`;
    item.appendChild(key);
    item.appendChild(value);
    legend.appendChild(item);
    });
