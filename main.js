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
    // layers
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
                'line-color': '#888',
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
                'fill-color': '#088',
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
                'fill-color': '#088',
                'fill-opacity': 0.8
            }],'layer')
            $('#areas-layer-check').prop('checked', true)
            if (map.getLayer('lines')) map.removeLayer('lines')
            addLayer('lines','line','lines',[{
                'line-join': 'round',
                'line-cap': 'round'
            },{
                'line-color': '#888',
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
