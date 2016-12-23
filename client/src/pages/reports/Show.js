import React from 'react'
import {Link} from 'react-router'
import moment from 'moment'

import API from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import Form from '../../components/Form'
import FormField from '../../components/FormField'

const atmosphereIconStyle = {
	fontSize: '2rem',
	display: 'inline-block',
	marginTop: '-4px'
}

const atmosphereIcons = {
	'POSITIVE': "👍",
	'NEUTRAL': "😐",
	'NEGATIVE': "👎",
}

export default class ReportShow extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			report: {},
		}
	}

	componentDidMount() {
		API.query(`
			report(id:${this.props.params.id}) {
				id, intent, engagementDate, atmosphere, atmosphereDetails
				reportText, nextSteps
				location { id, name }
				author { id, name }
				attendees { id, name }
				poams { id, shortName, longName }

			}
		`).then(data => this.setState({report: data.report}))
	}

	render() {
		let report = this.state.report
		let breadcrumbName = report.intent || 'Report'
		let breadcrumbUrl = '/reports/' + (report.id || this.props.params.id)

		return (
			<div>
				<Breadcrumbs items={[['Reports', '/reports'], [breadcrumbName, breadcrumbUrl]]} />

				<Form formFor={report} horizontal>
					<fieldset>
						<legend>Report #{report.id}</legend>

						<FormField id="intent" label="Subject" type="static" />
						<FormField id="engagementDate" label="Date 📆" type="static" value={moment(report.engagementDate).format("L")} />
						<FormField id="location" label="Location 📍" type="static" value={report.location && report.location.name} />
						<FormField id="atmosphere" label="Atmospherics" type="static">
							<span style={atmosphereIconStyle}>{atmosphereIcons[report.atmosphere]}</span>
							{report.atmosphereDetails && " " + report.atmosphereDetails}
						</FormField>
						<FormField id="author" label="Report author" type="static">
							{report.author &&
								<Link to={"/users/" + report.author.id}>{report.author.name}</Link>
							}
						</FormField>
					</fieldset>

					<fieldset>
						<legend>Meeting attendees</legend>

						{(report.attendees && report.attendees.map(person =>
							person.name
						)) || "This report does not specify any attendees."}
					</fieldset>

					<fieldset>
						<legend>Milestones</legend>

						{(report.poams && report.poams.map(poam =>
							poam.longName
						)) || "This report does not specify any milestones."}
					</fieldset>

					<fieldset>
						<legend>Meeting discussion</legend>

						<h5>Key outcomes</h5>
						<div dangerouslySetInnerHTML={{__html: report.reportText}} />

						<h5>Next steps</h5>
						<div dangerouslySetInnerHTML={{__html: report.nextSteps}} />
					</fieldset>
				</Form>
			</div>
		)
	}
}
