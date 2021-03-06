import React, {PropTypes} from 'react'
import Page from 'components/Page'
import autobind from 'autobind-decorator'

import Form from 'components/Form'
import Fieldset from 'components/Fieldset'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages, {setMessages} from 'components/Messages'
import Leaflet from 'components/Leaflet'
import LinkTo from 'components/LinkTo'
import ReportCollection from 'components/ReportCollection'

import GQL from 'graphqlapi'
import {Location} from 'models'

export default class LocationShow extends Page {
	static contextTypes = {
		currentUser: PropTypes.object.isRequired,
	}

	static modelName = 'Location'

	constructor(props) {
		super(props)
		this.state = {
			location: new Location()
		}
		setMessages(props,this.state)
	}

	fetchData(props) {
		let reportsQuery = new GQL.Part(/* GraphQL */`
			reports: reportList(query: $reportsQuery) {
				pageNum, pageSize, totalCount, list {
					${ReportCollection.GQL_REPORT_FIELDS}
				}
			}
		`).addVariable("reportsQuery", "ReportSearchQuery", {
			pageSize: 10,
			pageNum: this.state.reportsPageNum,
			locationId: props.params.id,
		})

		let locationQuery = new GQL.Part(/* GraphQL */`
			location(id:${props.params.id}) {
				id, name, lat, lng
			}
		`)

		GQL.run([reportsQuery, locationQuery]).then(data => {
            this.setState({
                location: new Location(data.location),
				reports: data.reports,
            })
        })
	}

	render() {
		let {location, reports} = this.state
		let currentUser = this.context.currentUser
		let markers=[]
		let latlng = 'None'
		if (location.lat && location.lng) {
			latlng = location.lat + ', ' + location.lng
			markers.push({name: location.name, lat: location.lat, lng: location.lng})
		}

		return (
			<div>
				<Breadcrumbs items={[[location.name || 'Location', Location.pathFor(location)]]} />

				<Messages success={this.state.success} error={this.state.error} />

				<Form static formFor={location} horizontal >
					<Fieldset title={location.name} action={currentUser.isSuperUser() && <LinkTo location={location} edit button="primary">Edit</LinkTo>} >
						<Form.Field id="latlng" value={latlng} label="Lat/Lon" />
					</Fieldset>

					<Leaflet markers={markers}/>
				</Form>

				<Fieldset title="Reports at this location">
					<ReportCollection paginatedReports={reports} goToPage={this.goToReportsPage} />
				</Fieldset>
			</div>
		)
	}

	@autobind
	goToReportsPage(pageNum) {
		this.setState({reportsPageNum: pageNum}, () => this.loadData())
	}
}
