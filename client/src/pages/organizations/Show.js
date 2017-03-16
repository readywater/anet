import React, {PropTypes} from 'react'
import Page from 'components/Page'
import withHopscotch from 'components/withHopscotch'
import ModelPage from 'components/ModelPage'
import {ListGroup, ListGroupItem} from 'react-bootstrap'
import autobind from 'autobind-decorator'

import Breadcrumbs from 'components/Breadcrumbs'
import Fieldset from 'components/Fieldset'
import Form from 'components/Form'
import LinkTo from 'components/LinkTo'
import Messages, {setMessages} from 'components/Messages'
import ReportCollection from 'components/ReportCollection'
import HopscotchLauncher from 'components/HopscotchLauncher'

import OrganizationPoams from './Poams'
import OrganizationLaydown from './Laydown'
import OrganizationApprovals from './Approvals'

import API from 'api'
import {Organization} from 'models'

class OrganizationShow extends Page {
	static contextTypes = {
		app: PropTypes.object.isRequired,
	}

	static modelName = 'Organization'

	constructor(props) {
		super(props)

		this.state = {
			organization: new Organization({id: props.params.id}),
			action: props.params.action
		}

		setMessages(props,this.state)
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.params.action !== this.state.action) {
			this.setState({action: nextProps.params.action})
		}

		if (+nextProps.params.id !== this.state.organization.id) {
			this.loadData(nextProps)
		}
	}

	componentDidMount() {
		super.componentDidMount()
		if (this.props.hopscotch.getState() === `${this.props.hopscotchTour.id}:5`) {
			this.startTour()
		}
	}

	@autobind
	startTour() {
		this.props.hopscotch.startTour(this.props.hopscotchTour, 6)
	}

	fetchData(props) {
		API.query(/* GraphQL */`
			organization(id:${props.params.id}) {
				id, shortName, longName, type
				parentOrg { id, shortName, longName }
				childrenOrgs { id, shortName, longName },
				poams { id, shortName, longName },
				positions {
					id, name, code, status, type,
					person { id, name, status, rank }
					associatedPositions {
						id, name, code, status
						person { id, name, status, rank}
					}
				},
				reports(pageNum:0, pageSize:25) {
					list {
						id, intent, engagementDate, keyOutcomes, nextSteps
						author { id, name },
						primaryAdvisor { id, name } ,
						primaryPrincipal {id, name },
						advisorOrg { id, shortName, longName }
						principalOrg { id, shortName, longName }
						location { id, name, lat, lng }
					}
				},
				approvalSteps {
					id, name, approvers { id, name, person { id, name}}
				},
			}
		`).then(data => this.setState({organization: data.organization}))
	}

	render() {
		let org = this.state.organization

		let currentUser = this.context.app.state.currentUser
		let isSuperUser = currentUser && currentUser.isSuperUserForOrg(org)
		let isAdmin = currentUser && currentUser.isAdmin()

		let superUsers = org.positions.filter(pos => pos.status === 'ACTIVE' && (!pos.person || pos.person.status === 'ACTIVE') && (pos.type === 'SUPER_USER' || pos.type === 'ADMINISTRATOR'))

		return (
			<div>
				<div className="pull-right">
					<HopscotchLauncher onClick={this.startTour} />
				</div>

				<Breadcrumbs items={[[org.shortName || 'Organization', Organization.pathFor(org)]]} />

				<Messages error={this.state.error} success={this.state.success} />

				<Form formFor={org} static horizontal>
					<Fieldset id="info" title={org.shortName} action={<div>
						{isAdmin && <LinkTo organization={Organization.pathForNew({parentOrgId: org.id})} button>
							Create sub-organization
						</LinkTo>}

						{isSuperUser && <LinkTo organization={org} edit button="primary">
							Edit
						</LinkTo>}
					</div>}>

						<Form.Field id="type">
							{org.type && org.type.split('_')[0]}
						</Form.Field>

						<Form.Field id="longName" label="Description"/>

						{org.parentOrg && org.parentOrg.id &&
							<Form.Field id="parentOrg" label="Parent organization">
								<LinkTo organization={org.parentOrg} />
							</Form.Field>
						}

						{org.type === 'ADVISOR_ORG' &&
							<Form.Field id="superUsers" label="Super users">
								{superUsers.map(position =>
									<p key={position.id}>
										{position.person ?
											<LinkTo person={position.person} />
											:
											<i><LinkTo position={position} />- (Unfilled)</i>
										}
									</p>
								)}
								{superUsers.length === 0 && <p><i>No super users</i></p>}
							</Form.Field>
						}

						{org.childrenOrgs && org.childrenOrgs.length > 0 && <Form.Field id="childrenOrgs" label="Sub organizations">
							<ListGroup>
								{org.childrenOrgs.map(org =>
									<ListGroupItem key={org.id} ><LinkTo organization={org} /></ListGroupItem>
								)}
							</ListGroup>
						</Form.Field>}
					</Fieldset>

					<OrganizationLaydown organization={org} />
					<OrganizationApprovals organization={org} />
					<OrganizationPoams organization={org} />

					<Fieldset id="reports" title={`Reports from ${org.shortName}`}>
						<ReportCollection reports={org.reports && org.reports.list} />
					</Fieldset>
				</Form>
			</div>
		)
	}
}

export default withHopscotch(ModelPage(OrganizationShow))
