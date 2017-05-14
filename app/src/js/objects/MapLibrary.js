import ol from 'openlayers';

class MapLibrary {

	constructor(props) {

		return {
			getFeatureStyle: this.getFeatureStyle,
			getHighlightedFeatureStyle: this.getHighlightedFeatureStyle,
			to3857: this.to3857,
			to4326: this.to4326
		}

	}

	getFeatureStyle(feature, resolution) {

		//starting with default style
		var fill = new ol.style.Fill({
			color: 'rgba(255,255,255,0.4)'
		});
		var stroke = new ol.style.Stroke({
			color: '#3399CC',
			width: 1.25
		});
		var styles = [
			new ol.style.Style({
				image: new ol.style.Circle({
					fill: fill,
					stroke: stroke,
					radius: 5
				}),
				fill: fill,
				stroke: stroke
			})
		];

		return styles;

	}

	getHighlightedFeatureStyle(feature, resolution) {

		var baseStyle = this.library.getFeatureStyle(feature, resolution);

		if (feature.getGeometry().getType() === 'LineString') {
			
			//check if special scoring exists on feature / road - if so highlight

			var containScoringPriotization = false;
			Object.keys(this.props.config.roadScoringProperties).forEach( metricName => {
				
				if (containScoringPriotization) return;
				
				var metricDefinition = this.props.config.roadScoringProperties[metricName];
				
				if ( typeof feature.get( metricName ) !== 'undefined' && feature.get( metricName ) !== 0 && metricDefinition.value !== 0 ) containScoringPriotization = true;

			});

			if ( containScoringPriotization ) {

				// SPECIAL highlighting - road has socring priorities
				
				var innerStyle = baseStyle[0];
				innerStyle.setStroke(  
					new ol.style.Stroke({
						color: 'rgb(253,141,1)',
						width: 2.5
					})
				);

				var outerStyle = innerStyle.clone();
				outerStyle.setStroke(  
					new ol.style.Stroke({
						color: '#4a9aff',
						width: 7
					})
				);

				baseStyle = [outerStyle, innerStyle];

			} else {

				// DEFAULT highlighting - nothing special about road
				
				baseStyle[0].setStroke(  

					new ol.style.Stroke({
						color: 'rgb(253,141,1)',
						width: 2.5
					})

				);

			}

		} else if (feature.getGeometry().getType() === 'Point') {

			baseStyle[0].setImage(  

				new ol.style.Circle({
					fill: new ol.style.Fill({
						color: 'rgba(253,141,1,.5)'
					}),
					stroke: new ol.style.Stroke({
						color: 'rgb(29,142,53)',
						width: 1.25
					}),
					radius: 5
				})

			);

		} 

		return baseStyle;

	}

	to3857( target ) {
		return ol.proj.transform( target , 'EPSG:4326','EPSG:3857')
	}

	to4326( target ) {
		return ol.proj.transform( target , 'EPSG:3857', 'EPSG:4326')	
	}

}

module.exports = MapLibrary;