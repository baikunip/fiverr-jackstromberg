let map = new maplibregl.Map({
        container: 'map', // container id
        style: {
            'id': 'raster',
            'version': 8,
            'name': 'Raster tiles',
            'center': [0, 0],
            'zoom': 0,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    'tileSize': 256,
                    'minzoom': 0,
                    'maxzoom': 19
                }
            },
            "glyphs": "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
            'layers': [
                {
                    'id': 'background',
                    'type': 'background',
                    'paint': {
                        'background-color': '#e0dfdf'
                    }
                },
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles'
                }
            ]
        },
        center: [-94.26011374932243,
            46.41032845779952], // starting position [lng, lat]
        zoom: 14 // starting zoom
    });

let areasType=['match',["get", "layer"]],linesType=['match',["get", "layer"]]
emptyjson={
    "type": "FeatureCollection",
    "features": []
},
activeLayers={},
featureList=[]
areas.features.forEach(element => {
    if(!areasType.includes(element['properties']['layer'])){
        areasType.push(element['properties']['layer'])
        areasType.push('hsla(' + (Math.floor(Math.random()*360) + ', 100%, 70%, 1)'))
    }
});
lines.features.forEach(element => {
    if(!linesType.includes(element['properties']['layer'])){
        linesType.push(element['properties']['layer'])
        linesType.push('hsla(' + (Math.floor(Math.random()*360) + ', 100%, 70%, 1)'))
    }
});
areasType.push('#ccc')
linesType.push('#ccc')
function addLayer(layer,type,source,style,title){
    // Add a symbol layer
    map.addLayer({
        'id': layer,
        'type': type,
        'source': source,
        'layout': style[0],
        'paint':style[1]
    })
    if(type!='symbol'){
        let labelData=emptyjson
        for (let index = 0; index < map.getSource(source)._data['features'].length; index++) {
            const element = map.getSource(source)._data['features'][index];
            let center=turf.centroid({
                "type": "FeatureCollection",
                "features": [element]
            }),emptyFeature={"type": "Feature","properties":element['properties'],"geometry":center['geometry']}
            labelData['features'].push(emptyFeature)
        }
        map.getSource(source+'-label').setData(labelData)
        map.addLayer({
            'id': layer+'-label',
            'type': 'symbol',
            'source': source+'-label',
            'layout': {
                'text-font': ['Open Sans Bold'],
                'text-field': ['get', title],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            }
        })
    }
    activeLayers[layer]=map.getSource(source)._data['features']
    // console.log(map.getSource(source)._options.data['features'])
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', layer, (e) => {
        let coordinates,description = e.features[0].properties[title];
        if(e.features[0].geometry.type=="Polygon")coordinates=turf.centroid({"type": "FeatureCollection","features": [e.features[0]]}).geometry.coordinates.slice()
        else if(e.features[0].geometry.type=="LineString")coordinates=turf.pointOnFeature({"type": "FeatureCollection","features": [e.features[0]]}).geometry.coordinates.slice()
        else coordinates = e.features[0].geometry.coordinates.slice();

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    })
     // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
    });
}
function removeLayer(layer,type,source){
    map.removeLayer(layer);
    activeLayers[layer] = [];
    if(type!='symbol'){
        map.getSource(source+'-label').setData(emptyjson)
        map.removeLayer(layer+'-label')
    } 
}
function drawPoint(source) {
    map.getCanvas().style.cursor = 'crosshair';
    const clickHandler = (e) => {
        const coord = e.lngLat;
        map.getSource(source).setData({
            "type": "FeatureCollection",
            "features": [{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [coord.lng, coord.lat] } }]
        });
        map.getCanvas().style.cursor = 'hand';
        document.querySelector('#coordinate-' + source).value = coord.lng + ',' + coord.lat;
    };

    map.once('click', clickHandler);

    const drawContainer = document.querySelector('#draw-container-' + source);
    drawContainer.innerHTML = '';
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.id = 'clear-draw-' + source;
    clearButton.onclick = () => clearPoint(source);
    clearButton.className = 'btn btn-sm btn-outline btn-danger';
    clearButton.innerHTML = '<i class="bi bi-trash-fill"></i>';
    drawContainer.appendChild(clearButton);
}

function clearPoint(source) {
    map.getCanvas().style.cursor = 'default';
    map.getSource(source).setData(emptyjson);
    const drawContainer = document.querySelector('#draw-container-' + source);
    drawContainer.innerHTML = '';
    const activateButton = document.createElement('button');
    activateButton.type = 'button';
    activateButton.id = 'activate-draw-' + source;
    activateButton.onclick = () => drawPoint(source);
    activateButton.className = 'btn btn-sm';
    activateButton.innerHTML = '<i class="bi bi-geo-alt"></i>';
    drawContainer.appendChild(activateButton);

    document.querySelector('#coordinate-' + source).value = '';
}

function showRoute() {
    const org = document.querySelector('#coordinate-origin').value;
    const dest = document.querySelector('#coordinate-destination').value.split(', ');
    const travelmode = document.querySelector('#travel-mode').value;

    fetch(`https://api.openrouteservice.org/v2/directions/${travelmode}?api_key=5b3ce3597851110001cf6248ba6a3408925f461ba2991a96af959ec0&start=${org}&end=${dest.join(',')}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            map.getSource('routes').setData(data);
            map.fitBounds(turf.bbox(map.getSource('routes')._data));
            const routingContainer = document.querySelector('#routing-container');
            routingContainer.innerHTML = '';
            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = 'btn btn-block btn-danger';
            clearButton.textContent = 'Clear Direction';
            clearButton.onclick = clearRoute;
            routingContainer.appendChild(clearButton);
        })
        .catch(error => {
            console.error('Error fetching route data:', error);
            map.getSource('routes').setData(emptyjson);
        });
}


function clearRoute() {
    map.getSource('routes').setData(emptyjson);

    const routingContainer = document.querySelector('#routing-container');
    routingContainer.innerHTML = '';
    const getDirectionButton = document.createElement('button');
    getDirectionButton.type = 'button';
    getDirectionButton.className = 'btn btn-block btn-primary';
    getDirectionButton.innerHTML = 'Get Direction';
    getDirectionButton.onclick = showRoute;
    routingContainer.appendChild(getDirectionButton);
}

const geocoderApi = {
    forwardGeocode: async (config) => {
        const features = [];
        try {
            const request =
        `https://nominatim.openstreetmap.org/search?q=${
            config.query
        }&format=geojson&polygon_geojson=1&addressdetails=1`;
            const response = await fetch(request);
            const geojson = await response.json();
            for (const feature of geojson.features) {
                const center = [
                    feature.bbox[0] +
                (feature.bbox[2] - feature.bbox[0]) / 2,
                    feature.bbox[1] +
                (feature.bbox[3] - feature.bbox[1]) / 2
                ];
                const point = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: center
                    },
                    place_name: feature.properties.display_name,
                    properties: feature.properties,
                    text: feature.properties.display_name,
                    place_type: ['place'],
                    center
                };
                features.push(point);
            }
        } catch (e) {
            console.error(`Failed to forwardGeocode with error: ${e}`);
        }

        return {
            features
        };
    }
};
map.addControl(
    new MaplibreGeocoder(geocoderApi, {
        maplibregl
    })
);
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    })
)
function showSideBar() {
    document.getElementById('map').style.height = '50vh';
    document.getElementById('side-bar').style.height = '50vh';
    document.getElementById('show-side-bar').style.display = 'none';
}

function hideSideBar() {
    document.getElementById('map').style.height = '100vh';
    document.getElementById('side-bar').style.height = '0vh';
    document.getElementById('show-side-bar').style.display = 'block';
}

document.querySelector('#search-feature').addEventListener('focus', () => {
    const val = document.querySelector('#search-feature').value;
    const keys = Object.keys(activeLayers);
    const featureList = [];

    const datalistOptions = document.querySelector('#datalistOptions');
    datalistOptions.innerHTML = ''; // Clear existing options

    keys.forEach(key => {
        for (let index = 0; index < activeLayers[key].length; index++) {
            const element = activeLayers[key][index];
            if (element.properties.layer.includes(val) && featureList.length < 5) {
                featureList.push(element);
            }
        }
    });

    if (featureList.length > 0) {
        featureList.forEach(res => {
            const option = document.createElement('option');
            option.value = res.properties.layer;
            datalistOptions.appendChild(option);
        });
    }
});

function searchFeature(){
    let val=document.querySelector('#search-feature').value,
    keys=Object.keys(activeLayers)
    keys.forEach(key => {
        for (let index = 0; index < activeLayers[key].length; index++) {
            const element = activeLayers[key][index];
            if(element['properties']['layer']==val){
                let searchedFeature=emptyjson
                searchedFeature['features'].push(element)
                map.fitBounds(turf.bbox(searchedFeature))
            }
        }
    })
}
map.on('load', async () => {
    // Add an image to use as a custom marker
    const image = await map.loadImage('https://maplibre.org/maplibre-gl-js/docs/assets/osgeo-logo.png');
    map.addImage('custom-marker', image.data);
    // sources
    map.addSource('points', {
        'type': 'geojson',
        'data': points
    })
    map.addSource('lines', {
        'type': 'geojson',
        'data': lines
    })
    map.addSource('lines-label', {
        'type': 'geojson',
        'data': emptyjson
    })
    map.addSource('areas', {
        'type': 'geojson',
        'data': areas
    })
    map.addSource('areas-label', {
        'type': 'geojson',
        'data': emptyjson
    })
    map.addSource('origin',{
        'type':'geojson',
        'data':emptyjson
    })
    map.addSource('destination',{
        'type':'geojson',
        'data':emptyjson
    })
    map.addSource('routes',{
        'type':'geojson',
        'data':emptyjson
    })
    // layers
    map.addLayer({
        'id': 'origin',
        'type': 'circle',
        'source': 'origin',
        'paint':{
            'circle-radius': 6,
            'circle-color': '#B42222'
        },
    })
    map.addLayer({
        'id': 'destination',
        'type': 'circle',
        'source': 'destination',
        'paint':{
            'circle-radius': 6,
            'circle-color': '#2F4858'
        },
    })
    map.addLayer({
        'id': 'routes',
        'type': 'line',
        'source': 'routes',
        'layout':{
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint':{
            'line-color': 'red',
            'line-width': 4
        },
    })
    // Event listener for points-layer-check
    document.querySelector('#points-layer-check').addEventListener('change', () => {
        if (document.querySelector('#points-layer-check').checked) {
            addLayer('conferences', 'symbol', 'points', [{
                'icon-image': 'custom-marker',
                'text-font': ['Open Sans Bold'],
                'text-field': ['get', 'layer'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            }, {}], 'layer');
            map.fitBounds(turf.bbox(map.getSource('points')._data));
        } else {
            if (map.getLayer('conferences'))removeLayer('conferences','symbol','points')
        }
    })

    // Event listener for lines-layer-check
    document.querySelector('#lines-layer-check').addEventListener('change', () => {
        if (document.querySelector('#lines-layer-check').checked) {
            addLayer('lines', 'line', 'lines', [{
                'line-join': 'round',
                'line-cap': 'round'
            }, {
                'line-color': linesType,
                'line-width': 8
            }], 'layer');
            map.fitBounds(turf.bbox(map.getSource('lines')._data));
        } else {
            if (map.getLayer('lines')) removeLayer('lines', 'line', 'lines')
        }
    })

    // Event listener for areas-layer-check
    document.querySelector('#areas-layer-check').addEventListener('change', () => {
        if (document.querySelector('#areas-layer-check').checked) {
            addLayer('areas', 'fill', 'areas', [{}, {
                'fill-color': areasType,
                'fill-opacity': 0.8
            }], 'layer');
            map.fitBounds(turf.bbox(map.getSource('areas')._data));
        } else {
            if (map.getLayer('areas')) removeLayer('areas', 'fill', 'areas')
        }
    })

    // Event listener for all-layer-check
    document.querySelector('#all-layer-check').addEventListener('change', () => {
        if (document.querySelector('#all-layer-check').checked) {
            if (map.getLayer('areas')) removeLayer('areas', 'fill', 'areas');
            addLayer('areas', 'fill', 'areas', [{}, {
                'fill-color': areasType,
                'fill-opacity': 0.8
            }], 'layer');
            document.querySelector('#areas-layer-check').checked = true;
            if (map.getLayer('lines')) removeLayer('lines', 'line', 'lines')
            addLayer('lines', 'line', 'lines', [{
                'line-join': 'round',
                'line-cap': 'round'
            }, {
                'line-color': linesType,
                'line-width': 8
            }], 'layer');
            document.querySelector('#lines-layer-check').checked = true;
            if (map.getLayer('conferences')) removeLayer('conferences', 'symbol', 'points');
            addLayer('conferences', 'symbol', 'points', [{
                'icon-image': 'custom-marker',
                'text-font': ['Open Sans Bold'],
                'text-field': ['get', 'layer'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.5,
                'text-justify': 'auto',
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            }, {}], 'layer');
            document.querySelector('#points-layer-check').checked = true;
        } else {
            if (map.getLayer('areas')) removeLayer('areas', 'fill', 'areas');
            document.querySelector('#areas-layer-check').checked = false;
            activeLayers['areas'] = [];

            if (map.getLayer('lines')) removeLayer('lines', 'line', 'lines');
            document.querySelector('#lines-layer-check').checked = false;
            activeLayers['lines'] = [];

            if (map.getLayer('conferences')) removeLayer('conferences', 'symbol', 'points')
            document.querySelector('#points-layer-check').checked = false;
            activeLayers['conferences'] = [];
        }
    })

})
