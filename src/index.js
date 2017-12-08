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
    // TODO move to library object - as a bunch of overridable defaults
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

    // TODO make chainable using some kind of awesome Builder class
    this.state.machineTemplate = new OptionSelection({
      name: 'Choose a field to search',
      options: function () {
        return new Promise((resolve) => {
          resolve([
            new Option('Name', {type: 'string'}),
            new Option('Income', {type: 'number'})
          ]);
        });
      }
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
        <SearchBar builders={builders} machineTemplate={machineTemplate} onSubmit={(val) => console.log(val)} />
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus condimentum ex quam, sed tincidunt dolor maximus eu. Donec vel mi lacus. Etiam quam eros, iaculis sit amet ante a, pharetra consectetur libero. Fusce eu felis tempor, gravida dolor nec, tempor felis. Nulla lacus sapien, efficitur id blandit in, condimentum sed massa. Vestibulum et dui neque. Aliquam vulputate eget ex nec sodales. Donec dolor tortor, varius a sodales quis, ornare vel diam. Aliquam a diam ex. Maecenas ac luctus nisi. Curabitur rhoncus sapien vitae mi fermentum, a fringilla magna suscipit. Pellentesque ultrices odio vel erat posuere condimentum.

        Ut urna ipsum, semper vitae venenatis eu, vehicula sit amet libero. Nam scelerisque ante vitae felis aliquam aliquam. Sed sit amet bibendum mi. Suspendisse at hendrerit nunc, vitae scelerisque est. In hac habitasse platea dictumst. Proin viverra magna nec nunc consectetur malesuada. In nec feugiat elit, nec mattis nulla. Donec lacinia tellus sed sem viverra, viverra condimentum neque faucibus. Pellentesque in turpis porttitor, vestibulum augue et, lacinia sem. Morbi accumsan faucibus nisi sed ullamcorper. Integer venenatis gravida leo a fringilla.

        Nullam malesuada mauris id purus hendrerit, vitae feugiat diam porttitor. Nullam sagittis, eros eu ultrices pellentesque, dolor magna lobortis quam, nec pretium sem turpis aliquam dui. Duis sed magna sed sem placerat sodales vel eu ante. Suspendisse tempor auctor lectus sed porta. Vivamus in fringilla elit. Curabitur ac elit mollis, efficitur sem vel, tempor leo. Praesent sagittis et risus eget ullamcorper. Curabitur eu mollis dui. In non eros at ligula pellentesque fermentum ac vel est. Vestibulum consectetur lacus eu molestie</p>
      </div>
    );
  }
}

require('preact/debug'); // only use in dev mode.
