import { Component } from 'preact';
import { OptionSelector } from './option-selector';
import { StateBuilderFactory } from '../lib/state-builder-factory';
import { Option, OptionSelection } from '../lib/states/generic/option-selection';
import { TokenStateMachine } from '../lib/token-state-machine';
import { bind } from '../../node_modules/decko/dist/decko';

export class SearchBar extends Component {
  constructor () {
    super(arguments);
    this.state = {
      tokens: [],
      stateArray: [] // TODO move to token
    }; // TODO bind values to incoming TokenStateMachine

    // TODO move this stuff up a level when ready - these things should be passed in to SearchBar
    this.state.builders = new StateBuilderFactory();
    this.state.builders.registerBuilder(OptionSelection, OptionSelector);

    const options = [
      new Option('first')
    ];
    const machineTemplate = new OptionSelection(undefined, 'field selection', options);
    this.state.machine = new TokenStateMachine(machineTemplate);
    this.state.machine.on('submit', () => this.submit());
    this.state.machine.on('state changed', () => this.getStateArray()); // TODO push down to Token
    this.getStateArray();
  }

  submit () {
    console.log('Submit');
  }

  @bind
  transition () {
    this.state.machine.transition();
  }

  getStateArray () {
    // TODO move this to Token
    const result = [];
    let current = this.state.machine.state;
    while (current !== undefined) {
      result.unshift(current);
      current = current.parent;
    }
    this.setState({
      stateArray: result
    });
  }

  render (props, {tokens}) {
    return (
      <div className='search-box form-control'>
        {this.state.stateArray.map(s => {
          const Builder = this.state.builders.getBuilder(s.template.constructor);
          return (<Builder machineState={s} onTransition={this.transition} />);
        })}
      </div>
    );
  }
}
