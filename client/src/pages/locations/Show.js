import React from 'react'
import Page from 'components/Page'

import API from 'api'
import {Location} from 'models'
import Breadcrumbs from 'components/Breadcrumbs'
import Form from 'components/Form'
import Leaflet from 'components/Leaflet'


export default class LocationShow extends Page {
	constructor(props) {
		super(props)
		this.state = {
			location: new Location()
		}
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			location(id:${props.params.id}) {
				id, name, lat, lng
			}
		`).then(data => this.setState({location: new Location(data.location)}))
	}

	render() {
		let loc = this.state.location
		let markers=[]
		let latlng = "None"
		if (loc.lat && loc.lng) {
			latlng = loc.lat + ", " + loc.lng
			markers.push({name: loc.name, lat: loc.lat, lng: loc.lng})
		}



		return (
			<div>
				<Breadcrumbs items={[[loc.name || 'Location', Location.pathFor(loc)]]} />

				<Form static formFor={loc} horizontal>
					<fieldset>
						<legend>{loc.name}</legend>

						<Form.Field id="latlng" value={latlng} label="Lat/Lon" />
					</fieldset>

					<Leaflet markers={markers}/>

			</Form>
			</div>
		)
	}
}