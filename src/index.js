import './style/index.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import { Component } from 'preact';
import { SearchBar } from './components/search-bar';

export default class App extends Component {
  render () {
    return (
      <div>
        <h1> Search Bar Test </h1>
        <SearchBar />
      </div>
    );
  }
}

require('preact/debug'); // only use in dev mode.
