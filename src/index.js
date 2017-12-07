import './style/index.scss';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import { Component } from 'preact';
// TODO make a top-level lib module that exposes all of this so no relative requires
import { OptionAssistant } from './components/assistants/generic/option-assistant';
import { OptionSelector } from './components/builders/generic/option-selector';
import { StateBuilderFactory } from './lib/state-builder-factory';
import { Option, OptionSelection } from './lib/states/generic/option-selection';
import { TextRelationSelection } from './lib/states/text/text-relation-selection';
import { NumericRelationSelection } from './lib/states/numeric/numeric-relation-selection';
import { TextEntry } from './lib/states/text/text-entry';
import { NumericEntry } from './lib/states/numeric/numeric-entry';
import { SearchBar } from './components/search-bar';

export default class App extends Component {
  constructor () {
    super();
    this.state.builders = new StateBuilderFactory();
    this.state.builders
      .registerBuilder(OptionSelection, OptionSelector)
      .registerBuilder(TextRelationSelection, OptionSelector)
      .registerBuilder(TextEntry, OptionSelector)
      .registerBuilder(NumericRelationSelection, OptionSelector)
      .registerBuilder(NumericEntry, OptionSelector)
      .registerAssistant(OptionSelection, OptionAssistant)
      .registerAssistant(TextRelationSelection, OptionAssistant)
      .registerAssistant(NumericRelationSelection, OptionAssistant);

    // TODO make chainable using a Builder class
    this.state.machineTemplate = new OptionSelection({
      name: 'Choose a field to search',
      options: [
        new Option('Name', {type: 'string'}),
        new Option('Income', {type: 'number'})
      ]
    });
    this.state.machineTemplate.addChild(TextRelationSelection, {
      transitionFunction: (parentVal) => parentVal && parentVal.meta.type === 'string'
    }).addChild(TextEntry);
    this.state.machineTemplate.addChild(NumericRelationSelection, {
      transitionFunction: (parentVal) => parentVal && parentVal.meta.type === 'number'
    }).addChild(NumericEntry);
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
