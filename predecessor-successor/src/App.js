// app css
import './App.css';

// app dependencies
import React, { Component } from 'react';
import LeanixApi from './LeanixApi';
import ReactGantt from 'gantt-for-react';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class App extends Component {

	constructor(props) {
		super(props);
		this.leanixApi = new LeanixApi();
		this._handleLoadingSuccess = this._handleLoadingSuccess.bind(this);
		this._handleLoadingError = this._handleLoadingError.bind(this);
		this.state = {
			loadingState: LOADING_INIT
		};
	}

	componentDidMount() {
		try {
			console.log(this.leanixApi.queryParams);
			this.leanixApi.queryFactsheets(this._handleLoadingSuccess, this._handleLoadingError, true, -1, [10, 18]);
		} catch (error) {
			this._handleLoadingError(error);
		}
	}

	_handleLoadingSuccess(data) {
		// transfer 'data' as state property as needed here
		console.log(data);
		this.setState({
			loadingState: LOADING_SUCCESSFUL
		});
	}

	_handleLoadingError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
	}

	render() {
		switch (this.state.loadingState) {
		case LOADING_INIT:
			return this._renderLoading();
		case LOADING_SUCCESSFUL:
			return this._renderSuccessful();
		case LOADING_ERROR:
			return this._renderError();
		default:
			throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

    _renderLoading() {
        return (
            <div className='loader' aria-hidden='true' aria-label='loading ...' />
        );
    }

    _renderError() {
        return null;
    }

    getTasks() {
		let names = [
      ["Redesign website", [0, 7]],
      ["Write new content", [1, 4]],
      ["Apply new styles", [3, 6]],
      ["Review", [7, 7]],
      ["Deploy", [8, 9]],
      ["Go Live!", [10, 10]]
    ];

    let tasks = names.map(function(name, i) {
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
	
	_func() {}
	
	_html_func() {return '';}
	
	_renderSuccessful() {
        return (
            <div className='container-fluid App'>
				<ReactGantt 
					tasks={this.getTasks()} 
					viewMode='Month'
					onClick={this._func} 
					onDateChange={this._func}
					onProgressChange={this._func}
					onViewChange={this._func} 
					customPopupHtml={this._html_func} />
            </div>
        );
    }
}

export default App;