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
let areasType=['match',["get", "layer"]]
areas.features.forEach(element => {
    if(!areasType.includes(element['properties']['layer'])){
        areasType.push(element['properties']['layer'])
        areasType.push('hsla(' + (Math.floor(Math.random()*360) + ', 100%, 70%, 1)'))
    }
});
areasType.push('#ccc')
function addLayer(layer,type,source,style,title){
    // Add a symbol layer
    map.addLayer({
        'id': layer,
        'type': type,
        'source': source,
        'layout': style[0],
        'paint':style[1]
    })
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', layer, (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties[title];

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
function drawPoint(source){
    map.getCanvas().style.cursor='crosshair'
    map.once('click',(e)=>{
        let coord=e.lngLat
        map.getSource(source).setData({
            "type": "FeatureCollection",
            "features": [{ "type": "Feature","geometry": { "type": "Point", "coordinates": [ coord['lng'], coord["lat"] ] }}]
        })
        map.getCanvas().style.cursor='hand'
    })
    $('#draw-container-'+source).empty()
    $('#draw-container-'+source).append(
        `<button type="button" id="clear-draw-`+source+`" onclick="clearPoint('`+source+`')" class="btn btn-sm btn-outline btn-danger"><i class="bi bi-trash-fill"></i></button>`
    )
}
function clearPoint(source){
    map.getSource(source).setData({
        "type": "FeatureCollection",
        "features": []
    })
    map.getCanvas().style.cursor='hand'
    $('#draw-container-'+source).empty()
    $('#draw-container-'+source).append(
        `<button type="button" id="activate-draw-`+source+`" onclick="drawPoint('`+source+`')" class="btn btn-sm"><i class="bi bi-geo-alt"></i></button>`
    )
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
    map.addSource('areas', {
        'type': 'geojson',
        'data': areas
    })
    map.addSource('origin',{
        'type':'geojson',
        'data':{
            "type": "FeatureCollection",
            "features": []
        }
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
    $('#points-layer-check').on('change', ()=>{
        if ($('#points-layer-check').prop('checked')) {
            addLayer('conferences','symbol','points',[{
                'icon-image': 'custom-marker',
                'text-font': [
                    'Open Sans Semibold',
                    'Arial Unicode MS Bold'
                ],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            },{}],'layer')
            map.fitBounds(turf.bbox(map.getSource('points')._data))
        }else{
            if (map.getLayer('conferences')) map.removeLayer('conferences')
        }
   }) 
   $('#lines-layer-check').on('change', ()=>{   
        if ($('#lines-layer-check').prop('checked')) {
            addLayer('lines','line','lines',[{
                'line-join': 'round',
                'line-cap': 'round'
            },{
                'line-color': '#088',
                'line-width': 8
            }],'layer')
            map.fitBounds(turf.bbox(map.getSource('lines')._data))
        }else{
            if (map.getLayer('lines')) map.removeLayer('lines')
        }
    })  
    $('#areas-layer-check').on('change', ()=>{   
        if ($('#areas-layer-check').prop('checked')) {
            addLayer('areas','fill','areas',[{},{
                'fill-color': areasType,
                'fill-opacity': 0.8
            }],'layer')
            map.fitBounds(turf.bbox(map.getSource('areas')._data))
        }else{
            if (map.getLayer('areas')) map.removeLayer('areas')
        }
    })
    $('#all-layer-check').on('change', ()=>{   
        if ($('#all-layer-check').prop('checked')) {
            if (map.getLayer('areas')) map.removeLayer('areas')
            addLayer('areas','fill','areas',[{},{
                'fill-color': areasType,
                'fill-opacity': 0.8
            }],'layer')
            $('#areas-layer-check').prop('checked', true)
            if (map.getLayer('lines')) map.removeLayer('lines')
            addLayer('lines','line','lines',[{
                'line-join': 'round',
                'line-cap': 'round'
            },{
                'line-color': linesType,
                'line-width': 8
            }],'layer')
            $('#lines-layer-check').prop('checked', true)
            if (map.getLayer('conferences')) map.removeLayer('conferences')
            addLayer('conferences','symbol','points',[{
                'icon-image': 'custom-marker',
                'text-font': [
                    'Open Sans Semibold',
                    'Arial Unicode MS Bold'
                ],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            },{}],'layer')
            $('#points-layer-check').prop('checked', true)
        }else{
            if (map.getLayer('areas')) map.removeLayer('areas')
            $('#areas-layer-check').prop('checked', false)
            if (map.getLayer('lines')) map.removeLayer('lines')
            $('#lines-layer-check').prop('checked', false)
            if (map.getLayer('conferences')) map.removeLayer('conferences')
            $('#points-layer-check').prop('checked', false)
        }
    }) 
})
