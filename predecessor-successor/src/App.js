// app css
import './App.css';

// app dependencies
import React, { Component } from 'react';
import LeanixApi from './LeanixApi';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class App extends Component {

	constructor(props) {
		super(props);
		this._handleLoadingSuccess = this._handleLoadingSuccess.bind(this);
		this._handleLoadingError = this._handleLoadingError.bind(this);
		this.state = {
			params: null,
			loadingState: LOADING_INIT
		};
	}

	componentDidMount() {
		try {
			const leanixApi = new LeanixApi();
			const params = leanixApi.getParams();
			console.log(params);
			// set directly to avoid triggering rendering process and disable eslint warning
			this.state.params = params; // eslint-disable-line
			// invoke 'leanixApi' calls here with params, this._handleLoadingSuccess & this._handleLoadingError
			leanixApi.queryFactsheets(params, this._handleLoadingSuccess, this._handleLoadingError, true, -1, [10, 18]);
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

    _renderSuccessful() {
        return (
            <div className='container-fluid App'>
            </div>
        );
    }
}

export default App;