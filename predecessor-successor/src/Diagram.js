import React, { Component } from 'react';
import ReactGantt from 'gantt-for-react';

class Diagram extends Component {
	
	constructor(props) {
		super(props);
		this._handleClick = this._handleClick.bind(this);
		this._handleDateChange = this._handleDateChange.bind(this);
		this._handleProgressChange = this._handleProgressChange.bind(this);
		this._handleViewChange = this._handleViewChange.bind(this);
		this._renderPopup = this._renderPopup.bind(this);
	}
	
	_handleClick(task) {
		//console.log(task);
	}
	
	_handleDateChange(task, start, end) {
		//console.log(task);
		//console.log(start);
		//console.log(end);
	}
	
	_handleProgressChange(task, progress) {
		//console.log(task);
		//console.log(progress);
	}
	
	_handleViewChange(viewMode) {
		//console.log(viewMode);
	}
	
	_renderPopup(task) {
		// TODO implement later
    	return '';
    }

    getTasks() {
		// TODO remove
    	let names = [
    		["Redesign website", [0, 7]],
    		["Write new content", [1, 4]],
    		["Apply new styles", [3, 6]],
    		["Review", [7, 7]],
    		["Deploy", [8, 9]],
    		["Go Live!", [10, 10]]
    	];
    	let tasks = names.map(function (name, i) {
			let today = new Date();
			let start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			let end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			start.setDate(today.getDate() + name[1][0]);
			end.setDate(today.getDate() + name[1][1]);
			return {
				start: start,
				end: end,
				name: name[0],
				id: "Task " + i,
				progress: parseInt(Math.random() * 100, 10)
			}
		});
    	tasks[1].dependencies = "Task 0"
		tasks[2].dependencies = "Task 1, Task 0"
		tasks[3].dependencies = "Task 2"
		tasks[5].dependencies = "Task 4"
		return tasks;
    }
	
	render() {
		console.log(this.props.filter);
		console.log(this.props.factsheets);
		// TODO vera:
		// hier bitte die Tasks erstellen und den 'this.props.filter' beachten (ist ebenfalls ein factsheet, eine business capability, oder 'null')
		// https://github.com/hustcc/gantt-for-react
		// https://github.com/frappe/gantt
		// noch ein paar Hinweise:
		// - applicationen (services), die keine business capability aufweisen, herausfiltern
		// - für task.name = service.displayName
		// - für task.start = lifecycle phase 'active' verwenden
		// - für task.end = lifecycle phase 'end of life' verwenden
		// - lifecycle phasen logiken kannst du dir an /psr/vtables/src/js/ReportUtils.js ansehen (siehe auch ReportApplicationPortfolio.js & ReportApplicationLifecycle.js für Verwendung)
		// - für task.id = factsheet.ID
		// - für progress = 100
		// - evtl. ist es möglich das factsheet an das task object zu binden
		return (
			<div style={{ width: '100%', overflow: 'auto' }}>
				<ReactGantt
					tasks={this.getTasks()}
					viewMode='Month'
					onClick={this._handleClick} 
					onDateChange={this._handleDateChange}
					onProgressChange={this._handleProgressChange}
					onViewChange={this._handleViewChange} 
					customPopupHtml={this._renderPopup}
				/>
			</div>
		);
	}
}

Diagram.propTypes = {
	factsheets: React.PropTypes.object.isRequired,
	filter: React.PropTypes.shape({
		ID: React.PropTypes.string.isRequired
	})
};

export default Diagram;