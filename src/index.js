import './style/index.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import { Component } from 'preact';
// TODO make a top-level lib module that exposes all of this so no relative requires
import { OptionSelector } from './components/builders/option-selector';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { Option, OptionSelection } from './lib/states/generic/option-selection';
import { SearchBar } from './components/search-bar';

export default class App extends Component {
  constructor () {
    super();
    this.state.builders = new StateBuilderFactory();
    this.state.builders.registerBuilder(OptionSelection, OptionSelector);

    const options = [
      new Option('first')
    ];
    this.state.machineTemplate = new OptionSelection(undefined, 'field selection', options);
  }

  render (props, {builders, machineTemplate}) {
    return (
      <div>
        <h1> Search Bar Test </h1>
        <SearchBar builders={builders} machineTemplate={machineTemplate} />
      </div>
    );
  }
}

require('preact/debug'); // only use in dev mode.
