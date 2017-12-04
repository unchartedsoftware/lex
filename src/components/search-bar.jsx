import { Component } from 'preact';
import { OptionSelector } from './option-selector';
import { StateBuilderFactory } from '../lib/state-builder-factory';
import { Option, OptionSelection } from '../lib/states/generic/option-selection';
import { Token } from './token';

export class SearchBar extends Component {
  constructor () {
    super(arguments);
    this.state = {
      tokens: []
    }; // TODO bind values to incoming TokenStateMachine

    // TODO move this stuff up a level when ready - these things should be passed in to SearchBar
    this.state.builders = new StateBuilderFactory();
    this.state.builders.registerBuilder(OptionSelection, OptionSelector);

    const options = [
      new Option('first')
    ];
    this.state.machineTemplate = new OptionSelection(undefined, 'field selection', options);
  }

  render (props, {tokens, builders, machineTemplate}) {
    return (
      <div className='search-box form-control'>
        <Token machineTemplate={machineTemplate} builders={builders} />
      </div>
    );
  }
}
