import { Component } from 'preact';
import { Token } from './token';

export class SearchBar extends Component {
  constructor () {
    super();
    this.state = {
      tokens: [],
      builders: undefined,
      machineTemplate: undefined
    }; // TODO bind values to incoming TokenStateMachine
  }

  processProps (props) {
    const { machineTemplate, builders } = props;
    if (machineTemplate !== this.state.machineTemplate) {
      this.setState({
        machineTemplate: machineTemplate
      });
    }
    if (builders !== this.state.builders) {
      this.setState({
        builders: builders
      });
    }
  }

  componentWillMount () {
    this.processProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.processProps(nextProps);
  }

  render (props, {tokens, builders, machineTemplate}) {
    return (
      <div className='search-box form-control'>
        <Token machineTemplate={machineTemplate} builders={builders} />
      </div>
    );
  }
}
